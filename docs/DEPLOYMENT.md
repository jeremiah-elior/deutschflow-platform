# Deployment

## Supabase

1. Create project.
2. Run `supabase/migrations/001_initial_schema.sql`.
3. Create Auth admin user.
4. Add row:

```sql
insert into admin_profiles (user_id, role, is_active)
values ('YOUR_AUTH_USER_ID', 'super_admin', true);
```

## API deployment

Deploy `apps/api` to Render/Railway/Fly.io/VPS.

Required env:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
SUPABASE_STORAGE_BUCKET=content
PUBLIC_CONTENT_BASE_URL=https://YOUR_PROJECT.supabase.co/storage/v1/object/public/content
CORS_ORIGIN=https://admin.deutschflow.com
```

## Admin deployment

Deploy `apps/admin` to Vercel/Netlify/Cloudflare Pages.

Required env:

```text
VITE_API_BASE_URL=https://api.deutschflow.com
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## Seed LiD

Upload `seed/lid/bamf_2025_study_material_en_te.json` in Admin → LiD Test → upload JSON.
Then click Import and Publish Telugu.
