-- DeutschFlow Platform initial schema
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('content', 'content', true, 524288000, null)
on conflict (id) do update set public = true;

create table if not exists admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('super_admin', 'admin', 'editor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists languages (
  code text primary key,
  name text not null,
  native_name text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into languages (code, name, native_name, is_active, sort_order) values
('en', 'English', 'English', true, 1),
('te', 'Telugu', 'తెలుగు', true, 2),
('ta', 'Tamil', 'தமிழ்', true, 3),
('kn', 'Kannada', 'ಕನ್ನಡ', true, 4),
('hi', 'Hindi', 'हिन्दी', false, 5),
('ml', 'Malayalam', 'മലയാളം', false, 6),
('bn', 'Bengali', 'বাংলা', false, 7),
('mr', 'Marathi', 'मराठी', false, 8),
('gu', 'Gujarati', 'ગુજરાતી', false, 9),
('pa', 'Punjabi', 'ਪੰਜਾਬੀ', false, 10),
('ur', 'Urdu', 'اردو', false, 11)
on conflict (code) do nothing;

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_json jsonb not null default '{}'::jsonb,
  description_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists course_levels (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  slug text not null,
  title_json jsonb not null default '{}'::jsonb,
  description_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, slug)
);

create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references course_levels(id) on delete cascade,
  slug text not null,
  number integer not null,
  title_json jsonb not null default '{}'::jsonb,
  description_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(level_id, slug)
);

create table if not exists chapter_assets (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  language_code text references languages(code),
  asset_type text not null,
  storage_path text not null,
  public_url text,
  duration_seconds integer,
  size_bytes bigint,
  sha256 text,
  version text not null default '1',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists content_assets (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  key text not null,
  asset_type text not null,
  language_code text references languages(code),
  storage_path text not null,
  public_url text,
  size_bytes bigint,
  sha256 text,
  version text not null default '1',
  metadata_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module, key, asset_type, language_code)
);

create table if not exists lid_catalogs (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  title text not null,
  total_cards integer not null,
  general_cards integer not null,
  state_cards integer not null,
  source_storage_path text,
  source_file_url text,
  schema_version text not null default '2',
  metadata_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists lid_cards (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references lid_catalogs(id) on delete cascade,
  catalog_key text not null,
  part text not null check (part in ('general', 'state')),
  state text,
  number integer not null,
  page integer,
  question_json jsonb not null,
  choices_json jsonb not null,
  answer_key text not null,
  correct_choice_json jsonb not null,
  learn_json jsonb not null default '{}'::jsonb,
  study_material_json jsonb,
  requires_image boolean not null default false,
  image_note text,
  created_at timestamptz not null default now(),
  unique(catalog_id, catalog_key)
);
create index if not exists idx_lid_cards_catalog_part on lid_cards(catalog_id, part);
create index if not exists idx_lid_cards_catalog_state on lid_cards(catalog_id, state);
create index if not exists idx_lid_cards_catalog_key on lid_cards(catalog_key);

create table if not exists lid_assets (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid references lid_catalogs(id) on delete cascade,
  asset_type text not null,
  language_code text references languages(code),
  key text not null,
  storage_path text not null,
  public_url text,
  size_bytes bigint,
  sha256 text,
  version text not null default '1',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(catalog_id, asset_type, language_code, key)
);

create table if not exists content_releases (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  version text not null,
  language_code text references languages(code),
  manifest_json jsonb not null,
  manifest_storage_path text,
  manifest_public_url text,
  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id),
  is_active boolean not null default true
);
create index if not exists idx_content_releases_module_lang on content_releases(module, language_code, published_at desc);

create table if not exists app_config (
  key text primary key,
  value_json jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null,
  item_key text not null,
  status text,
  score numeric,
  payload_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(user_id, module, item_key)
);

create table if not exists lid_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  catalog_id uuid references lid_catalogs(id),
  selected_state text,
  score integer not null,
  total_questions integer not null default 33,
  passed boolean not null,
  time_taken_seconds integer,
  answers_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger languages_updated_at before update on languages for each row execute function set_updated_at();
create trigger courses_updated_at before update on courses for each row execute function set_updated_at();
create trigger course_levels_updated_at before update on course_levels for each row execute function set_updated_at();
create trigger chapters_updated_at before update on chapters for each row execute function set_updated_at();
create trigger chapter_assets_updated_at before update on chapter_assets for each row execute function set_updated_at();
create trigger content_assets_updated_at before update on content_assets for each row execute function set_updated_at();
create trigger lid_assets_updated_at before update on lid_assets for each row execute function set_updated_at();

alter table admin_profiles enable row level security;
alter table languages enable row level security;
alter table courses enable row level security;
alter table course_levels enable row level security;
alter table chapters enable row level security;
alter table chapter_assets enable row level security;
alter table content_assets enable row level security;
alter table lid_catalogs enable row level security;
alter table lid_cards enable row level security;
alter table lid_assets enable row level security;
alter table content_releases enable row level security;
alter table user_progress enable row level security;
alter table lid_attempts enable row level security;

-- Service role bypasses RLS. Public app reads go through Node API, not direct anon table access.
-- Later, add direct client RLS policies for user_progress/lid_attempts if mobile writes directly to Supabase.
