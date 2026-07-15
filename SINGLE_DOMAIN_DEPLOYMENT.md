# DeutschFlow single-domain deployment

This package supports running the React admin and the Node API from one domain.

Expected routing:

```text
https://deutsch.berlinpulse.eu/        -> React admin UI
https://deutsch.berlinpulse.eu/health  -> Node API health
https://deutsch.berlinpulse.eu/v1/...  -> Node API routes
```

## Hostinger / Node app settings

Deploy this project as a **Node.js app**, not as a static Vite site.

Use:

```text
Root directory: ./
Node version: 20.x
Install command: npm install
Build command: npm run build:single-domain
Start command: npm run start:single-domain
Startup file: apps/api/dist/server.js
Output directory: dist
```

The root `npm run build` builds:

1. shared package
2. Node API
3. React admin
4. copies `apps/admin/dist` to root `dist`

The Node API serves root `dist` for frontend routes and keeps `/health` and `/v1/*` as API routes.

## Environment variables

Set these for the deployment:

```env
NODE_ENV=production
PORT=8080
CORS_ORIGIN=https://deutsch.berlinpulse.eu

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET=content
PUBLIC_CONTENT_BASE_URL=https://YOUR_PROJECT.supabase.co/storage/v1/object/public/content
ENABLE_DEV_ADMIN_BYPASS=false

VITE_API_BASE_URL=https://deutsch.berlinpulse.eu
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

`VITE_API_BASE_URL` can be the same domain. If it is omitted, the admin uses `window.location.origin`, which also works for single-domain deployment.

## Test after deploy

Open:

```text
https://deutsch.berlinpulse.eu/health
```

Expected:

```json
{ "ok": true, "service": "deutschflow-api" }
```

Then open:

```text
https://deutsch.berlinpulse.eu
```

The admin dashboard should show `Health: Connected`.

If `/health` still shows a frontend 404 page, the deployment is still static-only and the Node server is not running.
