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
