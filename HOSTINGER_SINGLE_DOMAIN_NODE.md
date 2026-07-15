# DeutschFlow Hostinger Single-Domain Node Deployment

This package is configured so one Hostinger Node.js Web App can serve both:

- `/` → React Admin UI
- `/health` → Node/Express API health
- `/v1/*` → Node/Express API routes

## Critical setup

In Hostinger, deploy this as a **Node.js Web App / Express.js / Other backend app**. Do not deploy it as a React, Vite, or static frontend-only app.

Use these settings:

```text
Framework/type: Express.js, or Other
Node version: 20.x or 22.x
Install command: npm install
Build command: npm run build
Start command: npm start
Entry file: server.js
Output directory: dist
```

Environment variables:

```env
NODE_ENV=production
PORT=8080
CORS_ORIGIN=https://deutsch.berlinpulse.eu

VITE_API_BASE_URL=https://deutsch.berlinpulse.eu
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET=content
PUBLIC_CONTENT_BASE_URL=https://YOUR_PROJECT.supabase.co/storage/v1/object/public/content
ENABLE_DEV_ADMIN_BYPASS=false
```

After deploy, test:

```text
https://deutsch.berlinpulse.eu/health
```

Expected:

```json
{ "ok": true, "service": "deutschflow-api" }
```

If `/health` shows Hostinger `Page Not Found`, the site is still deployed as a frontend/static app or the entry file is not `server.js`.
