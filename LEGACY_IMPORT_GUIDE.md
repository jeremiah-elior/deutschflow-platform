# Legacy MySQL import guide

This update keeps the Phase 2 React + Node + Supabase architecture, but adds support for the old Hostinger/MySQL data.

## What changed

- Added `supabase/migrations/002_legacy_mysql_content_schema.sql`.
- Added `scripts/import-legacy-mysql.mjs`.
- Included the old SQL dump at `seed/legacy/u832879198_deutschflow.sql`.
- Admin now shows API errors clearly instead of silent button failure.
- `VITE_API_BASE_URL` is now normalized, so both `https://api.example.com` and `https://api.example.com/v1` are safe.

## Run migrations in Supabase SQL editor

Run these in order:

```sql
-- 1
-- paste supabase/migrations/001_initial_schema.sql

-- 2
-- paste supabase/migrations/002_legacy_mysql_content_schema.sql
```

## Import old MySQL data

From the project root:

```bash
SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" \
npm run import:legacy -- seed/legacy/u832879198_deutschflow.sql
```

Imported old tables:

- `supported_languages` -> `languages`
- `levels` -> `course_levels`
- `categories` -> `course_categories`
- `series` -> `course_series`
- `lessons` -> `chapters`
- `lesson_translations` -> `chapter_translations` + chapter audio assets
- `lesson_notes` -> `chapter_notes`
- `lesson_transcripts` -> `chapter_transcripts`
- `lesson_vocabulary` -> `chapter_vocabulary`
- `lesson_vocabulary_translations` -> `chapter_vocabulary_translations`
- `lesson_videos` -> `chapter_videos`
- `quiz_questions` / `lesson_quiz_questions` -> `chapter_quiz_questions`

## Button issue

The React admin is only the frontend. Buttons call the Node API.

Check your API URL:

```text
https://YOUR_NODE_API_DOMAIN.com/health
```

Expected:

```json
{ "ok": true, "service": "deutschflow-api" }
```

Set admin env:

```text
VITE_API_BASE_URL=https://YOUR_NODE_API_DOMAIN.com
```

Do not worry if you accidentally add `/v1`; this update strips the duplicate automatically.
