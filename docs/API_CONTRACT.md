# API Contract

Base URL:

```text
https://api.deutschflow.com
```

Current local dev:

```text
http://localhost:8080
```

## Public APIs

```http
GET /health
GET /v1/app/bootstrap?lang=te
GET /v1/courses
GET /v1/courses/:courseSlug/levels/:levelSlug/manifest?lang=te
GET /v1/lid/manifest?lang=te
```

## Admin APIs

All admin endpoints require Supabase Auth Bearer token and `admin_profiles.is_active = true`.

```http
GET  /v1/admin/me
GET  /v1/admin/languages
POST /v1/admin/languages
GET  /v1/admin/courses
POST /v1/admin/courses
POST /v1/admin/levels
POST /v1/admin/chapters
POST /v1/admin/chapter-assets
POST /v1/admin/uploads/sign
POST /v1/admin/courses/:courseSlug/levels/:levelSlug/publish
GET  /v1/admin/lid/catalogs
POST /v1/admin/lid/import-json
POST /v1/admin/lid/assets
POST /v1/admin/lid/publish
```

## Upload flow

1. Admin requests signed upload URL.
2. Browser uploads directly to Supabase Storage.
3. Admin saves metadata through Node API.
4. Admin publishes manifest.
5. Android/iOS download from manifest.
