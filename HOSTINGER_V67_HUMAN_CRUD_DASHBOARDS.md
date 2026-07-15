# DeutschFlow v67 - Human Admin CRUD Dashboards

This update fixes the bad admin flow where admins had to copy hidden UUIDs.

## Main changes

- Chapter ID input replaced with course/level/chapter dropdowns.
- Audio/file upload now uses human selections and auto-generates storage folder.
- Existing chapter assets can be viewed, replaced, and deleted.
- Courses, levels, chapters now support create/edit/delete.
- Languages support edit and hide.
- Vocabulary supports create/edit/delete.
- Notes support create/edit/delete.
- Videos support create/edit/delete.
- Quiz supports create/edit/delete.
- Categories and series support create/edit/delete.
- New API dropdown endpoint: `GET /v1/admin/content-options`.
- New CRUD API routes added for content tables.

## Deploy settings

Keep the same Hostinger settings:

- Framework: Express
- Branch: main/master
- Root directory: ./
- Node version: 22.x preferred, 20.x supported
- Entry file: server.js
- Env: `NPM_CONFIG_PRODUCTION=false`

Runtime marker:

```text
DeutschFlow V67_HUMAN_CRUD_DASHBOARDS_ACTIVE_2026_07_15
```

## After deploy

Open:

- `/courses` for human audio/file upload and publish manifest
- `/chapters` for chapter CRUD
- `/vocabulary` for vocabulary CRUD
- `/notes` for notes CRUD
- `/videos` for video CRUD
- `/quiz` for quiz CRUD
- `/taxonomy` for categories/series CRUD
