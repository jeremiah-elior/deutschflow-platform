# DeutschFlow Hostinger v64 Node 20 WebSocket fix

Runtime error fixed:

```text
Error: Node.js 20 detected without native WebSocket support.
Suggested solution: For Node.js < 22, install "ws" package and provide it via the transport option.
```

## What changed

- Added `ws` dependency to `apps/api/package.json`.
- Added `@types/ws` dev dependency for TypeScript build.
- Updated `apps/api/src/config/supabase.ts` to pass `realtime.transport = WebSocket` to Supabase clients.
- Updated root runtime marker to `V64_WS_NODE20_FIX_ACTIVE_2026_07_15`.

## Hostinger settings

```text
Framework preset: Express
Branch: main/master, whichever your GitHub repo uses
Node version: 20.x works now; 22.x also works
Root directory: ./
Package manager: npm
Entry file: server.js
```

Keep this env variable so build tools are installed:

```env
NPM_CONFIG_PRODUCTION=false
```

After redeploy, Runtime logs should show:

```text
DeutschFlow V64_WS_NODE20_FIX_ACTIVE_2026_07_15
```

Then check:

```text
https://deutsch.berlinpulse.eu/health
```

Expected:

```json
{ "ok": true, "service": "deutschflow-api" }
```
