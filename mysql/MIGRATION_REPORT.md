# V77 migration report

Source backup: PostgreSQL cluster export dated 2026-07-29.

Converted content:

- 1 course
- 6 levels
- 7 categories
- 2 series
- 5 chapters
- 6 chapter translations
- 9 chapter assets
- 8 notes
- 141 vocabulary rows
- 1 video
- 1 quiz question
- 11 languages
- 3 LiD catalogs
- 460 LiD cards
- 13 published content releases
- 1 administrator profile/auth account migrated to `admin_users`

No server-side user progress or LiD attempt rows existed in this backup.

Storage export:

- 16 files total
- all storage paths referenced by the migrated current DB are present in the prepared storage ZIP
- 4 additional historical audio objects are retained in the prepared ZIP even though no current DB row references them

Runtime backend source contains no Supabase SDK/config dependency in V77.
