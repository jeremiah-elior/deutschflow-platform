# DeutschFlow v62 Hostinger Build Not Found Fix

The runtime log:

```text
DeutschFlow API build not found: .../apps/api/dist/server.js
Run npm run build before starting
```

means Hostinger is starting Node before the TypeScript/API build exists.

Use these settings:

- Framework preset: Express
- Node version: 20.x
- Root directory: ./
- Package manager: npm
- Entry file: server.js

Environment variable that is important for build:

```env
NPM_CONFIG_PRODUCTION=false
```

This v62 package makes both `server.js` and `server.cjs` auto-run `npm run build` if `apps/api/dist/server.js` or `dist/index.html` is missing.

After redeploy, `/health` should return JSON.
