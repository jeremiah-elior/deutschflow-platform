# DeutschFlow v65 Full Dashboards

This build adds production admin dashboards for imported legacy content.

## New admin pages

- `/` Dashboard / command center
- `/chapters` Chapters dashboard
- `/vocabulary` Vocabulary dashboard
- `/notes` Notes dashboard
- `/videos` Videos dashboard
- `/quiz` Quiz dashboard
- `/taxonomy` Categories & Series dashboard

## New admin API routes

- `GET /v1/admin/overview`
- `GET /v1/admin/chapters`
- `GET /v1/admin/vocabulary`
- `GET /v1/admin/notes`
- `GET /v1/admin/videos`
- `GET /v1/admin/quiz`
- `GET /v1/admin/content-taxonomy`

## Public convenience routes added

- `GET /v1/languages`
- `GET /v1/catalog?lang=te`

The older valid routes still work:

- `GET /health`
- `GET /v1/app/bootstrap?lang=te`
- `GET /v1/courses`

## Hostinger

Keep the same settings used for v64:

- Framework: Express
- Node: 22.x preferred, 20.x also supported
- Root directory: `./`
- Entry file: `server.js`
- Build command: `npm run build`
- Start command: `npm start`

Runtime logs should show:

```text
DeutschFlow V65_FULL_DASHBOARDS_ACTIVE_2026_07_15
```
