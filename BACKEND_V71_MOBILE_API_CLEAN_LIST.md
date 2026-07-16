# DeutschFlow v71 Mobile API Clean List Fix

This update keeps the new Node/Supabase backend compatible with the old PHP mobile API contract, but fixes the mobile lesson list so incomplete setup/admin placeholder chapters do not appear in the app.

## Fixed

- `/api/lessons.php?lang=te&level=A1` no longer returns placeholder rows such as `Chapter 01` when they have no legacy id, no language content, no media, and no real duration.
- Legacy imported lessons continue to return with their numeric PHP-compatible `id` values.
- Section APIs remain unchanged and lazy-loaded:
  - `/api/lesson-detail.php?id={id}&lang={lang}&section=overview`
  - `/api/lesson-detail.php?id={id}&lang={lang}&section=videos`
  - `/api/lesson-detail.php?id={id}&lang={lang}&section=vocabulary`
  - `/api/lesson-detail.php?id={id}&lang={lang}&section=notes`
  - `/api/lesson-detail.php?id={id}&lang={lang}&section=transcript`
  - `/api/lesson-detail.php?id={id}&lang={lang}&section=quiz`

## Runtime marker

```text
DeutschFlow V71_MOBILE_API_CLEAN_LIST_ACTIVE_2026_07_16
```

## Test

```text
https://deutsch.berlinpulse.eu/api/health.php
https://deutsch.berlinpulse.eu/api/lessons.php?lang=te&level=A1&pretty=1
https://deutsch.berlinpulse.eu/api/lesson-detail.php?id=4&lang=te&section=vocabulary&pretty=1
```

Note: the imported old DB has vocabulary rows attached to legacy lesson `4`, not legacy lesson `1`. So `id=1&section=vocabulary` correctly returns an empty array.
