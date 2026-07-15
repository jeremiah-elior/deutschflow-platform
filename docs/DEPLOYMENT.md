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

## v58 note: Admin buttons and API URL

The admin frontend can deploy to Hostinger/Vercel, but the Save/Upload/Publish buttons call the Node API.

Deploy `apps/api` separately and set admin env:

```env
VITE_API_BASE_URL=https://YOUR_NODE_API_DOMAIN.com
```

The frontend normalizes this value. If you accidentally add `/v1`, it will strip the duplicate.

Check API health:

```text
https://YOUR_NODE_API_DOMAIN.com/health
```

Expected:

```json
{ "ok": true, "service": "deutschflow-api" }
```

## v58 note: Legacy MySQL data

See `LEGACY_IMPORT_GUIDE.md` to import `seed/legacy/u832879198_deutschflow.sql` into Supabase.
