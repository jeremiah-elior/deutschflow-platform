# DeutschFlow v70 Backend Fix — New Backend with PHP-Compatible Mobile APIs

This update keeps the single-domain Node/Supabase backend and admin UI, but adds the same mobile API shape that the old PHP app used.

## Base URL

```text
https://deutsch.berlinpulse.eu
```

## Production mobile APIs

Use these in React Native and iOS. Do not use the old `silver-llama` PHP host.

```http
GET /api/lessons.php?lang={te|ta|kn}&level=A1
GET /api/lesson-detail.php?id={lessonId}&lang={te|ta|kn}&section=overview
GET /api/lesson-detail.php?id={lessonId}&lang={te|ta|kn}&section=videos
GET /api/lesson-detail.php?id={lessonId}&lang={te|ta|kn}&section=vocabulary
GET /api/lesson-detail.php?id={lessonId}&lang={te|ta|kn}&section=notes
GET /api/lesson-detail.php?id={lessonId}&lang={te|ta|kn}&section=transcript
GET /api/lesson-detail.php?id={lessonId}&lang={te|ta|kn}&section=quiz
```

Supporting routes:

```http
GET /api/categories.php
GET /api/levels.php
GET /api/series.php
GET /api/health.php
GET /api/index.php?endpoint=lessons&lang=te
```

## Mobile flow

1. App starts with the selected profile language.
2. Call `/api/lessons.php?lang=te&level=A1`.
3. Open player immediately using the list item `audioUrl`, `title`, `coverUrl`, and `durationMinutes`.
4. Lazy-load sections only when the user opens each tab.

## No wrong-language fallback

By default, Telugu content is not returned for Tamil/Kannada.

Fallback is only enabled when requested:

```http
GET /api/lesson-detail.php?id=1&lang=kn&section=notes&fallback=1
```

## Required Supabase migration

Run this after deploying v70:

```text
supabase/migrations/003_mobile_php_compatible_api_support.sql
```

This adds language support to videos/quiz and marks legacy imported video/quiz rows as Telugu, so Tamil/Kannada do not accidentally show Telugu content.

## Runtime marker

Hostinger runtime logs should show:

```text
DeutschFlow V70_PHP_COMPAT_MOBILE_APIS_ACTIVE_2026_07_16
```
