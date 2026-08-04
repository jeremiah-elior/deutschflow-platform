# DeutschFlow V75 — Hostinger stale-build fix

## Problem
The V74 source contained the new public pages, but the repository root `dist/` was still the older V73 compiled admin SPA. Hostinger could therefore start the old frontend, which redirected `/` to `/login` and did not contain `/about`, `/privacy-policy`, or the other public routes.

## Fix
- Every admin build now writes `dist/.deutschflow-build-version`.
- `server.js`, `server.cjs`, and `scripts/ensure-build.mjs` require the V75 build stamp.
- If Hostinger has an old `dist/`, startup treats it as stale and runs `npm run build`.
- Existing APIs and Supabase admin logic are unchanged.

## Expected public routes
- `/`
- `/about`
- `/support`
- `/privacy-policy`
- `/terms`
- `/delete-account`
- `/impressum`
- `/admin/login`
- `/admin`

## Hostinger deployment
Use Node 20.x and run `npm install` followed by `npm run build`. Restart the application after deployment. In runtime logs you should see `V75_PUBLIC_SITE_BUILD_FIX_2026_08_04` and `adminCurrent: true` after a successful build.

## Extra blank-page protection
The admin/Supabase bundle is now lazy-loaded only for `/admin/*`. Public pages do not initialize Supabase on page load, so `/`, `/about`, `/privacy-policy`, `/terms`, `/support`, `/delete-account`, and `/impressum` can render independently of admin authentication configuration.
