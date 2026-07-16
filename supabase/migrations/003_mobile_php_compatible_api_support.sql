-- DeutschFlow v70 mobile API compatibility support.
-- Run after 001_initial_schema.sql and 002_legacy_mysql_content_schema.sql.
-- This lets the new Node/Supabase backend expose PHP-style section APIs safely.

alter table chapter_videos add column if not exists language_code text references languages(code);
alter table chapter_quiz_questions add column if not exists language_code text references languages(code);

-- Existing imported legacy rows came from the old Telugu-first PHP data.
-- Mark them Telugu so Tamil/Kannada requests do not accidentally receive Telugu content.
update chapter_videos
set language_code = 'te'
where language_code is null
  and legacy_id is not null;

update chapter_quiz_questions
set language_code = 'te'
where language_code is null
  and legacy_id is not null;

create index if not exists idx_chapter_videos_language_code on chapter_videos(language_code);
create index if not exists idx_chapter_quiz_questions_language_code on chapter_quiz_questions(language_code);
create index if not exists idx_chapter_translations_lang_published on chapter_translations(chapter_id, language_code, is_published);
create index if not exists idx_chapter_notes_lang on chapter_notes(chapter_id, language_code);
create index if not exists idx_chapter_transcripts_lang on chapter_transcripts(chapter_id, language_code, sort_order);
create index if not exists idx_chapter_assets_mobile on chapter_assets(chapter_id, asset_type, language_code, is_active);
