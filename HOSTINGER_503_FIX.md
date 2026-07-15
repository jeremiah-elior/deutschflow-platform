# Hostinger 503 Fix for DeutschFlow single-domain deployment

503 means the Node process started and then crashed, or Hostinger did not start the correct entry file.

Use this package with these exact settings:

- App type/framework: Express.js or Other
- Node version: 20.x or 22.x
- Install command: `npm install`
- Build command: `npm run build`
- Start command: `npm start`
- Entry/startup file: `server.js`
- Output directory: `dist`

Do not choose React/Vite/static hosting for this deployment.

## Required runtime environment variables

Set these in the Node app environment variables, not only in Vite/frontend variables:

```env
NODE_ENV=production
PORT=8080
CORS_ORIGIN=https://deutsch.berlinpulse.eu
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET=content
PUBLIC_CONTENT_BASE_URL=https://YOUR_PROJECT.supabase.co/storage/v1/object/public/content
ENABLE_DEV_ADMIN_BYPASS=false
```

For the frontend build, also set:

```env
VITE_API_BASE_URL=https://deutsch.berlinpulse.eu
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## Test

Open:

`https://deutsch.berlinpulse.eu/health`

Expected response:

```json
{
  "ok": true,
  "service": "deutschflow-api",
  "time": "...",
  "configWarnings": []
}
```

If `configWarnings` is not empty, add/fix those environment variables in Hostinger and restart the app.
