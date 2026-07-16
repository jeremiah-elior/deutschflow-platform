# Backend v72 — Media uploads redirect fix

Fixes legacy media URLs under `/uploads/...` on the new single-domain backend.

## Problem

`https://deutsch.berlinpulse.eu/uploads/videos/...mp4` was falling through to the React admin SPA and returning HTML/blank page instead of video.

## Fix

- Express now handles `/uploads/*` before React fallback.
- If a local `uploads/` folder exists, files are served directly.
- Otherwise `/uploads/*` redirects to the legacy media host until files are migrated to Supabase Storage.
- API responses now normalize old `silver-llama.../uploads/...` URLs and relative `/uploads/...` URLs into `https://deutsch.berlinpulse.eu/uploads/...`.

## Runtime marker

`DeutschFlow V72_MEDIA_UPLOADS_REDIRECT_ACTIVE_2026_07_16`

## Optional env

```env
PUBLIC_APP_BASE_URL=https://deutsch.berlinpulse.eu
LEGACY_MEDIA_BASE_URL=https://silver-llama-257051.hostingersite.com
```

`PUBLIC_APP_BASE_URL` can be omitted if `CORS_ORIGIN=https://deutsch.berlinpulse.eu` is already set.
