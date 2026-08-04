# DeutschFlow Platform

This is the new Phase 2 backend/admin system for DeutschFlow.

It replaces the repeated PHP API patching approach with:

- React + Vite admin panel
- Node.js + Express API
- Supabase Auth/Postgres/Storage
- Manifest-based content delivery for Android/iOS
- Future-ready content structure for A1/A2/B1 multilingual lessons and LiD Test

## Apps

```text
apps/admin   React admin dashboard
apps/api     Node API server
packages/shared  Shared Zod schemas and TypeScript types
supabase/migrations  Database schema
seed/lid     Seed LiD study JSON
```

## Quick start

1. Create a Supabase project.
2. Run the SQL in `supabase/migrations/001_initial_schema.sql`.
3. Create a Supabase Auth user for yourself.
4. Insert your user id into `admin_profiles` with role `super_admin`.
5. Copy env files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env
```

6. Install and run:

```bash
npm install
npm run dev
```

Admin: http://localhost:5173
API: http://localhost:8080

## Important principle

Android and iOS should not hardcode content files. They should fetch manifests:

```text
GET /v1/app/bootstrap
GET /v1/courses/german/levels/A1/manifest?lang=te
GET /v1/lid/manifest?lang=te
```

Large files such as audio, video, images and LiD card packs are downloaded from Supabase Storage/CDN URLs and cached in the apps.

## v58 legacy MySQL + admin button fix

This package includes a compatibility import path for the old PHP/MySQL backend dump and clearer admin API error handling.

### Important deploy note

The React admin needs a running Node API. Set:

```env
VITE_API_BASE_URL=https://YOUR_NODE_API_DOMAIN.com
```

Then verify:

```text
https://YOUR_NODE_API_DOMAIN.com/health
```

### Old DB import

See `LEGACY_IMPORT_GUIDE.md`.

---

## V74 public website + legal pages

This package now keeps the existing V73 Node/Express + Supabase backend/admin workflow and adds a public DeutschFlow website in the same Vite app.

### Public routes

```text
/                  Landing page
/about             About DeutschFlow
/support           Help / FAQ / contact
/privacy-policy    Privacy Policy
/terms             Terms of Use
/delete-account    Public account/data deletion instructions
/impressum         German legal notice
```

Compatibility aliases are also included:

```text
/privacy           -> /privacy-policy
/account-deletion  -> /delete-account
/login             -> /admin/login
```

### Admin routes

The admin is no longer the public homepage.

```text
/admin              Dashboard
/admin/login        Admin sign-in
/admin/languages
/admin/courses
/admin/chapters
/admin/vocabulary
/admin/notes
/admin/videos
/admin/quiz
/admin/taxonomy
/admin/lid
/admin/media
/admin/settings
```

All existing `/health`, `/api/...`, `/v1/...`, `/uploads/...` and mobile compatibility endpoints are unchanged.

### Public-site configuration

Copy the admin env example and set the public values before production:

```bash
cp apps/admin/.env.example apps/admin/.env
```

Important variables:

```env
VITE_SITE_URL=https://YOUR_DOMAIN
VITE_SUPPORT_EMAIL=YOUR_SUPPORT_EMAIL
VITE_PRIVACY_EMAIL=YOUR_PRIVACY_EMAIL

VITE_LEGAL_NAME=YOUR_FULL_LEGAL_NAME_OR_COMPANY
VITE_LEGAL_STREET=STREET_AND_NUMBER
VITE_LEGAL_CITY=POSTCODE_AND_CITY
VITE_LEGAL_COUNTRY=Germany

VITE_GOOGLE_PLAY_URL=https://play.google.com/store/apps/details?id=YOUR_APP_ID
VITE_APP_STORE_URL=https://apps.apple.com/app/YOUR_APP
```

**Do not deploy the Impressum with the `REPLACE_WITH_...` placeholder values.**

The Privacy Policy and Terms are implementation-oriented starter text based on the current DeutschFlow architecture (Firebase authentication in the mobile app, local device learning state, Supabase content/admin services). The operator should review the final legal text and the Play/App Store privacy declarations before publication.

### Build and deploy

```bash
npm install
npm run build
npm start
```

For Hostinger single-domain deployment, keep using the existing project deployment flow. The Express server continues to serve the Vite build as an SPA, so direct links such as `/privacy-policy`, `/delete-account`, and `/admin/courses` work after deployment.
