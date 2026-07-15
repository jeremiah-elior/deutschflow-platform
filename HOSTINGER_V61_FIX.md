# DeutschFlow Hostinger v61 fix

This version is designed for Hostinger single-domain Node deployment.

Use:

- Framework preset: Express
- Node version: 20.x
- Root directory: ./
- Package manager: npm
- Entry file: server.js

The package now runs the build automatically through `postinstall`, and `server.js` also builds as a fallback if Hostinger starts the app before build output exists.

Required environment variables:

```env
NODE_ENV=production
CORS_ORIGIN=https://deutsch.berlinpulse.eu
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET=content
PUBLIC_CONTENT_BASE_URL=https://YOUR_PROJECT.supabase.co/storage/v1/object/public/content
ENABLE_DEV_ADMIN_BYPASS=false
VITE_API_BASE_URL=https://deutsch.berlinpulse.eu
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
```

After redeploy, test:

```
https://deutsch.berlinpulse.eu/health
```

Expected:

```json
{ "ok": true, "service": "deutschflow-api" }
```
