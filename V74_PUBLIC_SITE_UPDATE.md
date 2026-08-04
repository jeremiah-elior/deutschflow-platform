# DeutschFlow V74 — Public website & legal pages

Date: 2026-08-04

This update is based on the V73 working Node/Express + Supabase backend and keeps the existing mobile/API/admin functionality intact.

## Added public routes

- `/` — landing page
- `/about` — product/about page
- `/support` — support cards and FAQ
- `/privacy-policy` — privacy policy
- `/terms` — terms of use
- `/delete-account` — public account deletion instructions/request link
- `/impressum` — German legal notice

## Admin route change

The admin dashboard now lives under `/admin`:

- `/admin/login`
- `/admin`
- `/admin/courses`
- `/admin/chapters`
- `/admin/vocabulary`
- `/admin/notes`
- `/admin/videos`
- `/admin/quiz`
- `/admin/taxonomy`
- `/admin/lid`
- `/admin/media`
- `/admin/settings`

Legacy admin page links are redirected to the new `/admin/...` paths.

## Branding

The public website uses the existing DeutschFlow logo and LiD learner illustration from the mobile app assets.

## Before production

Configure `apps/admin/.env` using `apps/admin/.env.example`, especially:

- `VITE_SITE_URL`
- `VITE_SUPPORT_EMAIL`
- `VITE_PRIVACY_EMAIL`
- `VITE_LEGAL_NAME`
- `VITE_LEGAL_STREET`
- `VITE_LEGAL_CITY`
- Google Play / App Store URLs when available

Do not publish the Impressum with `REPLACE_WITH_...` placeholders.

## Validation

All TypeScript/TSX source files were syntax-parsed successfully, and both root Node entry files pass `node --check`.

A full npm production build could not be run in the generation environment because its internal npm registry does not contain `@supabase/supabase-js@2.45.0`. Run the normal project command before deploying:

```bash
npm install
npm run build
```
