#!/usr/bin/env node
/**
 * audit-lockfile.mjs — lockfile-native security audit gate.
 *
 * Why this exists: `pnpm audit` hits npm's retired "quick" endpoint
 * (https://registry.npmjs.org/-/npm/v1/security/audits/quick) which now
 * returns HTTP 410, so the Night Shift's "0 vulns" gate became
 * unverifiable (carry-over 2026-07-15). This script restores a verifiable
 * gate by talking directly to npm's *bulk advisory* endpoint — the
 * supported replacement — using only the package/version pairs already
 * pinned in pnpm-lock.yaml. No external binary, no new dependency; just
 * the same registry.npmjs.org we already install from.
 *
 * Usage:
 *   node scripts/audit-lockfile.mjs [--json] [--lockfile <path>]
 *
 * Exit codes:
 *   0  — no advisories matched installed versions
 *   1  — at least one advisory matched (gate FAIL)
 *   2  — could not run the audit (parse/network error) — gate UNKNOWN
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BULK_ENDPOINT =
  'https://registry.npmjs.org/-/npm/v1/security/advisories/bulk';
const CHUNK_SIZE = 200; // packages per bulk request

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const lockfilePath = resolve(
  args.includes('--lockfile')
    ? args[args.indexOf('--lockfile') + 1]
    : 'pnpm-lock.yaml'
);

/**
 * Parse the `packages:` section of a pnpm-lock v9 lockfile into a map of
 * package name -> sorted array of concrete versions. Entry keys look like
 * `'@scope/name@1.2.3':` or `name@1.2.3(peer@x):` — we strip peer suffixes.
 */
function parseLockfile(text) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l === 'packages:');
  if (start === -1) {
    throw new Error('no `packages:` section found — unexpected lockfile shape');
  }
  const byName = new Map();
  // Entry keys are indented exactly two spaces, ending in ':'. pnpm v9 only
  // quotes keys that need it (scoped `@scope/x`), so match both forms.
  const keyRe = /^ {2}'?([^' ][^':]*)'?:?$/;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    // Stop at the next top-level section (e.g. `snapshots:`).
    if (/^\S/.test(line)) break;
    const m = keyRe.exec(line);
    if (!m) continue;
    let spec = m[1];
    // Drop peer-dependency suffix: `pkg@1.2.3(react@18)` -> `pkg@1.2.3`.
    const paren = spec.indexOf('(');
    if (paren !== -1) spec = spec.slice(0, paren);
    // Split on the LAST '@' so scoped names (@scope/x) survive.
    const at = spec.lastIndexOf('@');
    if (at <= 0) continue;
    const name = spec.slice(0, at);
    const version = spec.slice(at + 1);
    if (!version || /[a-z]/i.test(version[0])) continue; // skip aliases/links
    if (!byName.has(name)) byName.set(name, new Set());
    byName.get(name).add(version);
  }
  const out = {};
  for (const [name, versions] of byName) out[name] = [...versions].sort();
  return out;
}

function chunk(entries, size) {
  const chunks = [];
  for (let i = 0; i < entries.length; i += size) {
    chunks.push(entries.slice(i, i + size));
  }
  return chunks;
}

async function queryBulk(payload) {
  const res = await fetch(BULK_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'npm-command': 'audit',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`bulk endpoint responded ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function main() {
  let packages;
  try {
    packages = parseLockfile(readFileSync(lockfilePath, 'utf8'));
  } catch (err) {
    fail(`parse error: ${err.message}`);
  }

  const names = Object.keys(packages);
  const advisories = {}; // name -> array of advisory objects (unique by id)

  for (const part of chunk(names, CHUNK_SIZE)) {
    const payload = {};
    for (const name of part) payload[name] = packages[name];
    let result;
    try {
      result = await queryBulk(payload);
    } catch (err) {
      fail(`network error: ${err.message}`);
    }
    for (const [name, list] of Object.entries(result)) {
      const seen = new Set((advisories[name] || []).map((a) => a.id));
      for (const adv of list) {
        if (seen.has(adv.id)) continue;
        (advisories[name] ||= []).push(adv);
      }
    }
  }

  const flat = Object.entries(advisories).flatMap(([name, list]) =>
    list.map((a) => ({ name, ...a }))
  );
  const bySeverity = flat.reduce((acc, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1;
    return acc;
  }, {});

  if (asJson) {
    console.log(
      JSON.stringify(
        { scanned: names.length, total: flat.length, bySeverity, advisories: flat },
        null,
        2
      )
    );
  } else {
    console.log(`Scanned ${names.length} packages from ${lockfilePath}`);
    if (flat.length === 0) {
      console.log('✅ 0 advisories matched installed versions.');
    } else {
      console.log(`❌ ${flat.length} advisories matched:`);
      const order = ['critical', 'high', 'moderate', 'low', 'info'];
      for (const sev of order) {
        if (bySeverity[sev]) console.log(`   ${sev}: ${bySeverity[sev]}`);
      }
      console.log('');
      for (const a of flat) {
        console.log(
          `  [${a.severity}] ${a.name} (${a.vulnerable_versions}) — ${a.title}`
        );
        console.log(`     ${a.url}`);
      }
    }
  }

  process.exit(flat.length === 0 ? 0 : 1);
}

function fail(message) {
  console.error(`audit-lockfile: ${message}`);
  process.exit(2);
}

main();
