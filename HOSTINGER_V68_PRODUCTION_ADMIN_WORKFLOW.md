# DeutschFlow v68 production admin workflow

This update removes the testing-style admin flow where edit buttons scroll to forms at the top of the page.

## What changed

- Courses, Languages, Chapters, Vocabulary, Notes, Videos, Quiz, and Categories/Series now use right-side edit drawers.
- Add/edit actions keep the user in the same table context.
- Delete actions show an inline confirmation bar before removing data.
- Saving, deleting, uploading, and publishing show visible progress states.
- Courses page has a production upload workflow: select Course → Level → Chapter → Language → Asset type → Upload → Save asset → Publish manifest.
- No hidden UUID/Chapter ID copying is needed.

## Deploy

Keep the same Hostinger settings as v66/v67:

- Framework: Express
- Root directory: ./
- Entry file: server.js
- Node version: 22.x preferred
- Environment: keep existing Supabase/VITE variables
- NPM_CONFIG_PRODUCTION=false

Runtime marker:

```text
DeutschFlow V68_PRODUCTION_ADMIN_WORKFLOW_ACTIVE_2026_07_15
```
