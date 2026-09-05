#!/usr/bin/env node
/**
 * ng-m3-medir-modulo.mjs — a régua da Onda 9 (MANDATO NG-01)
 *
 * Mede um módulo de `libs/core/src/lib/components/<modulo>/` e imprime JSON
 * determinista com o tamanho da INTERFACE (o que deve encolher) e do
 * COMPORTAMENTO (o que deve crescer). Serve de baseline antes de converter
 * um módulo raso em módulo profundo.
 *
 * Uso:
 *   node tools/ng-m3-medir-modulo.mjs card
 *   node tools/ng-m3-medir-modulo.mjs card-variants
 *   node tools/ng-m3-medir-modulo.mjs button
 *
 * Determinismo: sem timestamps nem random no output; arrays ordenados.
 * Duas corridas seguidas produzem JSON byte-a-byte idêntico (a data vive no
 * NOME do ficheiro de baseline, nunca dentro do JSON).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');
const MODULE_ROOT = join(REPO, 'libs/core/src/lib/components');
const INDEX_TS = join(REPO, 'libs/core/src/index.ts');
const APPS_DIR = join(REPO, 'apps');
const E2E_DIR = join(REPO, 'e2e/tests');

const mod = process.argv[2];
if (!mod) {
  console.error('uso: node tools/ng-m3-medir-modulo.mjs <modulo>');
  process.exit(2);
}
const modDir = join(MODULE_ROOT, mod);
if (!existsSync(modDir)) {
  console.error(`módulo não encontrado: ${modDir}`);
  process.exit(2);
}

/** Lê todos os ficheiros do módulo (recursivo), ordenados. */
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const isSpec = (f) => f.endsWith('.spec.ts');
const isStory = (f) => f.endsWith('.stories.ts');
const isIndex = (f) => f.endsWith('/index.ts') || f.endsWith('\\index.ts');
const read = (f) => readFileSync(f, 'utf8');
const nonBlankLines = (s) => s.split('\n').filter((l) => l.trim().length > 0).length;

/** Conta ocorrências de um regex global. */
const countMatches = (s, re) => (s.match(re) || []).length;

/** Ternários: remove `?.` e `??`, depois conta `?` que casam com um `:`. */
function countTernaries(s) {
  const cleaned = s.replace(/\?\./g, '').replace(/\?\?/g, '');
  // conta `?` que têm um `:` à frente na mesma expressão (heurística por linha)
  let n = 0;
  for (const line of cleaned.split('\n')) {
    const q = (line.match(/\?/g) || []).length;
    const c = (line.match(/:/g) || []).length;
    n += Math.min(q, c);
  }
  return n;
}

const files = walk(modDir);
const tsSrc = files.filter((f) => f.endsWith('.ts') && !isSpec(f) && !isStory(f) && !isIndex(f));
const specFiles = files.filter(isSpec);
const storyFiles = files.filter(isStory);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const scssFiles = files.filter((f) => f.endsWith('.scss'));

// --- Selectors do módulo (derivados dos componentes; prefixo real é iu-) ---
const selectors = [];
for (const f of tsSrc) {
  const src = read(f);
  const re = /selector:\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src))) selectors.push(m[1]);
}
selectors.sort();

// --- INTERFACE: exports públicos no index.ts que vêm do módulo ---
const indexSrc = read(INDEX_TS);
const modRe = new RegExp(`from\\s+['"]\\./lib/components/${mod}/([^'"]+)['"]`, 'g');
const reExportedFiles = new Set();
let em;
while ((em = modRe.exec(indexSrc))) reExportedFiles.add(em[1]);

// símbolos públicos exportados desses ficheiros
const exportSymRe = /export\s+(?:abstract\s+)?(?:class|interface|type|enum|const|function)\s+([A-Za-z0-9_]+)/g;
const publicSymbols = [];
for (const rel of [...reExportedFiles].sort()) {
  const candidate = join(modDir, rel.endsWith('.ts') ? rel : `${rel}.ts`);
  if (!existsSync(candidate)) continue;
  const src = read(candidate);
  let sm;
  while ((sm = exportSymRe.exec(src))) publicSymbols.push(sm[1]);
}
publicSymbols.sort();

// --- INTERFACE: inputs/outputs (input()/output()/@Input/@Output) ---
let inputs = 0;
let outputs = 0;
for (const f of tsSrc) {
  const src = read(f);
  inputs += countMatches(src, /\binput(?:\.required)?\s*[<(]/g) + countMatches(src, /@Input\s*\(/g);
  outputs += countMatches(src, /\boutput\s*[<(]/g) + countMatches(src, /@Output\s*\(/g);
}

// --- TAMANHO: linhas de código sem specs/stories ---
let locSrcTs = 0;
for (const f of tsSrc) locSrcTs += nonBlankLines(read(f));
let locHtml = 0;
for (const f of htmlFiles) locHtml += nonBlankLines(read(f));
let locScss = 0;
for (const f of scssFiles) locScss += nonBlankLines(read(f));

// --- TESTES: nº de it() ---
let itCount = 0;
for (const f of specFiles) itCount += countMatches(read(f), /\bit\s*\(/g);

// --- COMPORTAMENTO: ramos (@if/@switch/ternários) no template + ts ---
// templates = .html + templates inline no .ts
const templateSources = htmlFiles.map(read);
for (const f of tsSrc) {
  const src = read(f);
  const tm = src.match(/template:\s*`([\s\S]*?)`/);
  if (tm) templateSources.push(tm[1]);
}
let templateControlFlow = 0;
for (const t of templateSources) {
  templateControlFlow += countMatches(t, /@if\b/g);
  templateControlFlow += countMatches(t, /@else\s+if\b/g);
  templateControlFlow += countMatches(t, /@for\b/g);
  templateControlFlow += countMatches(t, /@switch\b/g);
  templateControlFlow += countMatches(t, /@case\b/g);
}
let templateTernaries = 0;
for (const t of templateSources) templateTernaries += countTernaries(t);

let tsBranches = 0;
let tsTernaries = 0;
for (const f of tsSrc) {
  const src = read(f);
  tsBranches += countMatches(src, /\bif\s*\(/g);
  tsBranches += countMatches(src, /\bcase\s+[^:]+:/g);
  tsTernaries += countTernaries(src);
}
const behaviorBranches = templateControlFlow + templateTernaries + tsBranches + tsTernaries;

// --- USOS nas apps (por selector) ---
function collectFiles(dir, exts) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist' || name === '.angular') continue;
      out.push(...collectFiles(p, exts));
    } else if (exts.includes(extname(p))) out.push(p);
  }
  return out;
}
const appFiles = collectFiles(APPS_DIR, ['.ts', '.html']);
const usageFiles = new Set();
for (const f of appFiles) {
  const src = read(f);
  for (const sel of selectors) {
    if (src.includes(`<${sel}`)) {
      usageFiles.add(f.slice(REPO.length + 1));
      break;
    }
  }
}

// --- Cenários e2e que tocam o selector ---
const e2eFiles = existsSync(E2E_DIR) ? collectFiles(E2E_DIR, ['.ts']) : [];
let e2eScenarios = 0;
for (const f of e2eFiles) {
  const src = read(f);
  // divide por blocos test(...)/it(...) e conta os que referem um selector do módulo
  const blocks = src.split(/\b(?:test|it)\s*\(/).slice(1);
  for (const b of blocks) {
    if (selectors.some((sel) => b.includes(sel))) e2eScenarios++;
  }
}

const result = {
  module: mod,
  selectors,
  interface: {
    indexExportLines: reExportedFiles.size,
    publicSymbols,
    publicSymbolCount: publicSymbols.length,
    inputs,
    outputs,
    inputsOutputs: inputs + outputs,
  },
  size: {
    componentCount: tsSrc.filter((f) => f.endsWith('.component.ts')).length,
    locSrcTs,
    locHtml,
    locScss,
    locTotalNoTestsNoStories: locSrcTs + locHtml + locScss,
    specFileCount: specFiles.length,
    storyFileCount: storyFiles.length,
  },
  tests: {
    itCount,
    e2eScenarios,
  },
  behavior: {
    templateControlFlow,
    templateTernaries,
    tsBranches,
    tsTernaries,
    totalBranches: behaviorBranches,
  },
  usage: {
    appFileCount: usageFiles.size,
    appFiles: [...usageFiles].sort(),
  },
};

process.stdout.write(JSON.stringify(result, null, 2) + '\n');
