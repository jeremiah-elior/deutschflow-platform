-- DeutschFlow legacy MySQL import support.
-- Run after 001_initial_schema.sql. This keeps old PHP/MySQL data without changing the v1 API contract.

alter table course_levels add column if not exists legacy_id integer;
create unique index if not exists ux_course_levels_legacy_id on course_levels(legacy_id) where legacy_id is not null;

create table if not exists course_categories (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  legacy_id integer,
  name text not null,
  icon text,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, legacy_id)
);

create table if not exists course_series (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  legacy_id integer,
  title text not null,
  subtitle text,
  description text,
  cover_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, legacy_id)
);

alter table chapters add column if not exists legacy_id integer;
alter table chapters add column if not exists category_id uuid references course_categories(id) on delete set null;
alter table chapters add column if not exists series_id uuid references course_series(id) on delete set null;
alter table chapters add column if not exists duration_seconds integer not null default 0;
alter table chapters add column if not exists is_premium boolean not null default false;
alter table chapters add column if not exists is_featured boolean not null default false;
alter table chapters add column if not exists transcript_de text;
alter table chapters add column if not exists notes_json jsonb not null default '{}'::jsonb;
alter table chapters add column if not exists vocabulary_json jsonb;
create unique index if not exists ux_chapters_legacy_id on chapters(legacy_id) where legacy_id is not null;
create index if not exists idx_chapters_category_id on chapters(category_id);
create index if not exists idx_chapters_series_id on chapters(series_id);

create table if not exists chapter_translations (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  legacy_id integer,
  language_code text not null references languages(code),
  title text,
  notes text,
  audio_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(chapter_id, language_code)
);
create unique index if not exists ux_chapter_translations_legacy_id on chapter_translations(legacy_id) where legacy_id is not null;

create table if not exists chapter_notes (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  legacy_id integer,
  language_code text not null references languages(code),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(chapter_id, language_code)
);
create unique index if not exists ux_chapter_notes_legacy_id on chapter_notes(legacy_id) where legacy_id is not null;

create table if not exists chapter_transcripts (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  legacy_id integer,
  language_code text not null references languages(code),
  content text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(chapter_id, language_code, sort_order)
);
create unique index if not exists ux_chapter_transcripts_legacy_id on chapter_transcripts(legacy_id) where legacy_id is not null;

create table if not exists chapter_videos (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  legacy_id integer,
  title text not null default 'Video Overview',
  video_url text not null,
  thumbnail_url text,
  duration_seconds integer not null default 0,
  is_enabled boolean not null default true,
  is_premium boolean not null default true,
  show_as_preview boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists ux_chapter_videos_legacy_id on chapter_videos(legacy_id) where legacy_id is not null;

create table if not exists chapter_vocabulary (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  legacy_id integer,
  german text not null,
  english text,
  meaning_json jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists ux_chapter_vocabulary_legacy_id on chapter_vocabulary(legacy_id) where legacy_id is not null;

create table if not exists chapter_vocabulary_translations (
  id uuid primary key default gen_random_uuid(),
  vocabulary_id uuid not null references chapter_vocabulary(id) on delete cascade,
  legacy_id integer,
  language_code text not null references languages(code),
  meaning text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(vocabulary_id, language_code)
);
create unique index if not exists ux_chapter_vocabulary_translations_legacy_id on chapter_vocabulary_translations(legacy_id) where legacy_id is not null;

create table if not exists chapter_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  legacy_id integer,
  source_table text not null default 'quiz_questions',
  question text not null,
  options_json jsonb not null default '{}'::jsonb,
  correct_option text not null,
  explanation text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists ux_chapter_quiz_questions_legacy_source on chapter_quiz_questions(source_table, legacy_id) where legacy_id is not null;

create trigger course_categories_updated_at before update on course_categories for each row execute function set_updated_at();
create trigger course_series_updated_at before update on course_series for each row execute function set_updated_at();
create trigger chapter_translations_updated_at before update on chapter_translations for each row execute function set_updated_at();
create trigger chapter_notes_updated_at before update on chapter_notes for each row execute function set_updated_at();
create trigger chapter_transcripts_updated_at before update on chapter_transcripts for each row execute function set_updated_at();
create trigger chapter_videos_updated_at before update on chapter_videos for each row execute function set_updated_at();
create trigger chapter_vocabulary_updated_at before update on chapter_vocabulary for each row execute function set_updated_at();
create trigger chapter_vocabulary_translations_updated_at before update on chapter_vocabulary_translations for each row execute function set_updated_at();
create trigger chapter_quiz_questions_updated_at before update on chapter_quiz_questions for each row execute function set_updated_at();

alter table course_categories enable row level security;
alter table course_series enable row level security;
alter table chapter_translations enable row level security;
alter table chapter_notes enable row level security;
alter table chapter_transcripts enable row level security;
alter table chapter_videos enable row level security;
alter table chapter_vocabulary enable row level security;
alter table chapter_vocabulary_translations enable row level security;
alter table chapter_quiz_questions enable row level security;

-- Idempotent legacy asset imports. Postgres 15 supports NULLS NOT DISTINCT, used by Supabase projects.
create unique index if not exists ux_chapter_assets_chapter_type_lang
on chapter_assets (chapter_id, asset_type, language_code) nulls not distinct;

-- Non-partial unique indexes used by Supabase upsert(onConflict).
create unique index if not exists ux_course_levels_legacy_id_all on course_levels(legacy_id);
create unique index if not exists ux_chapters_legacy_id_all on chapters(legacy_id);
create unique index if not exists ux_chapter_translations_legacy_id_all on chapter_translations(legacy_id);
create unique index if not exists ux_chapter_notes_legacy_id_all on chapter_notes(legacy_id);
create unique index if not exists ux_chapter_transcripts_legacy_id_all on chapter_transcripts(legacy_id);
create unique index if not exists ux_chapter_videos_legacy_id_all on chapter_videos(legacy_id);
create unique index if not exists ux_chapter_vocabulary_legacy_id_all on chapter_vocabulary(legacy_id);
create unique index if not exists ux_chapter_vocabulary_translations_legacy_id_all on chapter_vocabulary_translations(legacy_id);
create unique index if not exists ux_chapter_quiz_questions_legacy_source_all on chapter_quiz_questions(source_table, legacy_id);
