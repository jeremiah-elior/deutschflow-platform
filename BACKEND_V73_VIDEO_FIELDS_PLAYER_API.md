# Backend v73 — Video fields for mobile player

Adds videoUrl, videoThumbnailUrl, videoDurationSeconds, and hasVideo to `/api/lessons.php` and overview responses.

Keeps PHP-compatible mobile APIs:
- `/api/lessons.php?lang=te&level=A1`
- `/api/lesson-detail.php?id=1&lang=te&section=overview`
- `/api/lesson-detail.php?id=1&lang=te&section=videos`

Runtime marker: `DeutschFlow V73_VIDEO_FIELDS_PLAYER_API_ACTIVE_2026_07_16`.
