# MCP Trust Boundaries

Status: audit completed in Sprint 047 pre-flight (Night Shift 2026-05-07).
Recommended `.mcp.json` change is **pending manual application by Israel**
— agent-level Write/Edit on `.mcp.json` is correctly blocked by the harness
sensitive-file policy. See "Recommended fix" below.

## Threat model

`.mcp.json` declares servers that the IDE/agent harness invokes over stdio.
Each server runs with the user's privileges. Per ox-security audit (May
2026), stdio MCP servers fetched at invocation time are an attack surface
equivalent to running arbitrary code from the network on every tool call.

## Pre-flight finding (2026-05-07)

The previous config invoked `npx -y @angular/mcp-server`. That package
does not exist on the public npm registry — `npm view` returns 404. With
`-y`, npx auto-installs without prompting; if a malicious actor publishes
a package under that exact name (typosquat / dependency-confusion), every
agent session would silently pull and execute it. Mitigation: switch to
`pnpm exec ng mcp`, which uses the locally-installed `@angular/cli`
binary (pinned in `package.json` and resolved via `pnpm-lock.yaml`).

## Recommended fix (manual)

Israel should apply this diff to `.mcp.json`:

```diff
 {
   "mcpServers": {
     "angular": {
-      "command": "npx",
-      "args": ["-y", "@angular/mcp-server"]
+      "command": "pnpm",
+      "args": ["exec", "ng", "mcp", "--read-only", "--local-only"]
     }
   }
 }
```

Validation: `pnpm exec ng mcp --help` prints the subcommand help on this
repo (Angular CLI 21.2.9 ships `mcp` as a built-in subcommand with
`--read-only` and `--local-only` flags). Confirmed 2026-05-07.

## Current trust boundary

| Server   | Command                                                 | Trust source                                |
| -------- | ------------------------------------------------------- | ------------------------------------------- |
| angular  | `pnpm exec ng mcp --read-only --local-only`             | Local `@angular/cli` (lockfile-pinned)      |

- `--read-only`: refuses tool calls that would mutate workspace files. Edits
  flow through the agent's normal Edit/Write tools, which are gated by the
  PreToolUse protect hook. MCP is for inspection only.
- `--local-only`: refuses tools that require internet access. Removes a
  whole class of exfiltration vectors.

## Adding a new MCP server

1. Prefer servers shipped via local `node_modules`, not `npx -y`. If `npx`
   is unavoidable, pin the exact version (`npx @scope/pkg@1.2.3 ...`) so
   typosquat / version-confusion is not silent.
2. Verify the package exists on the registry you expect (`npm view <name>`).
3. Append the server to the table above with its command and trust source.
4. Document any filesystem / network capabilities the server requires.

## Audit log

- 2026-05-07: discovered `@angular/mcp-server` does not exist on npm
  registry (404). Documented recommended fix to `pnpm exec ng mcp
  --read-only --local-only`. `.mcp.json` change pending manual
  application by Israel (sensitive-file write blocked at harness layer).
  Created this file.
