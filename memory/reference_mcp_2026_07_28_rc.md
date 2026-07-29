# MCP 2026-07-28 spec RC — breaking changes (ref p/ tooling Ralph)

Scan 2026-07-29 (Night Shift). **Zero impacto no ng-m3** — nota de contexto p/ tooling do próprio
Ralph a médio prazo (ex.: se construir MCP server próprio na direção LAM/agente que AGE).

Spec final publicada 28/07/2026. Tier 1 SDKs (Python/TS/Go/C# beta já disponíveis) esperam shippar
suporte dentro de janela de 10 semanas. **Contém breaking changes.**

## 1. Stateless core (headline)
- Removidos: handshake `initialize`/`initialized`, header `Mcp-Session-Id`, sessões protocol-level,
  sticky routing, shared session stores.
- Novo: protocol version + client info + caps viajam em `_meta` em CADA request; método
  `server/discover` substitui handshake; headers `Mcp-Method` + `Mcp-Name` p/ routing sem body
  inspection; **Multi Round-Trip Requests** (server devolve `InputRequiredResult` com `requestState`
  que o client ecoa) substituem SSE streams.
- Consequência: qualquer instância do server responde qualquer request → apps com estado usam
  handles explícitos (IDs) como argumentos de tool, não sessões geridas pelo protocolo.

## 2. Deprecações (annotation-only, ≥12 meses até remoção)
| Feature | Substituto |
|---------|-----------|
| Roots | tool params / resource URIs / server config |
| Sampling | integração direta com LLM provider API |
| Logging | stderr (stdio) / OpenTelemetry (observabilidade estruturada) |

## 3. Auth hardening
- Clients devem validar `iss` per RFC 9207 (futuro será obrigatório).
- Dynamic Client Registration exige `application_type`.
- Credenciais bound ao `issuer` do auth server; re-registar se server migrar.
- Refresh token flows OIDC documentados; scope accumulation + `.well-known` discovery clarificados.

## 4. Tasks extension + MCP Apps
- **Tasks:** movido de core → extensão opt-in. Lifecycle stateless: `tools/call` devolve task handle;
  client dirige via `tasks/get` / `tasks/update` / `tasks/cancel`. `tasks/list` **removido** (scoping
  sem sessões). Users da Tasks API `2025-11-25` têm de migrar.
- **MCP Apps:** interfaces HTML server-rendered, cacheadas + security-reviewed pré-execução; ações
  de UI passam pelo mesmo audit path JSON-RPC das tool calls diretas.

## 5. Outros breaking
- Erro missing-resource: `-32002` (custom MCP) → `-32602` (JSON-RPC standard).
- Tool schemas: full JSON Schema 2020-12; `$ref` externos NÃO devem auto-dereference.

## Fontes
- https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/
- https://blog.modelcontextprotocol.io/posts/sdk-betas-2026-07-28/
