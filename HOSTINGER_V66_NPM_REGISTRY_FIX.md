# Hostinger v66 npm registry fix

This package fixes the Hostinger build error where npm tries to download packages from an internal OpenAI registry URL such as:

```text
packages.applied-caas-gateway1.internal.api.openai.org
```

That happened because `package-lock.json` was generated inside ChatGPT's build environment and contained internal registry URLs.

## What changed

- Removed `package-lock.json` from the deploy package.
- Added `.npmrc` with `registry=https://registry.npmjs.org/`.
- Pinned `@supabase/supabase-js` to `2.45.0` instead of `^2.45.0` so npm does not install the latest Supabase package that requires Node 22.
- Kept the `ws` transport fix for Node 20.
- Added runtime marker: `DeutschFlow V66_NPM_REGISTRY_FIX_ACTIVE_2026_07_15`.

## Hostinger settings

Recommended:

```text
Framework preset: Express
Branch: main
Root directory: ./
Node version: 22.x preferred, 20.x also supported
Package manager: npm
Entry file: server.js
```

Environment variables must include:

```env
NPM_CONFIG_PRODUCTION=false
VITE_API_BASE_URL=https://deutsch.berlinpulse.eu
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SECRET_KEY
SUPABASE_STORAGE_BUCKET=content
PUBLIC_CONTENT_BASE_URL=https://YOUR_PROJECT.supabase.co/storage/v1/object/public/content
ENABLE_DEV_ADMIN_BYPASS=false
CORS_ORIGIN=https://deutsch.berlinpulse.eu
NODE_ENV=production
```

## GitHub instructions

Make sure the old `package-lock.json` is deleted from GitHub:

```bash
git rm package-lock.json
git add .npmrc package.json apps/api/package.json apps/admin/package.json server.js server.cjs HOSTINGER_V66_NPM_REGISTRY_FIX.md
git commit -m "fix Hostinger npm registry build"
git push origin main
```

Then click **Save and redeploy** in Hostinger.

## Expected logs

```text
DeutschFlow V66_NPM_REGISTRY_FIX_ACTIVE_2026_07_15
```

Then `/health` should return:

```json
{ "ok": true, "service": "deutschflow-api" }
```
