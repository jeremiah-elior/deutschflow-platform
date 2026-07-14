# Hostinger build output fix

Hostinger was building the monorepo from the repository root and then looking for a root-level `dist/` folder.

The admin app actually builds to:

```text
apps/admin/dist
```

This patch updates the root build script so after building the admin it copies:

```text
apps/admin/dist -> dist
```

So Hostinger can find the expected output directory.

## Hostinger settings

Use these settings if deploying the React admin as static hosting:

```text
Root directory: ./
Build command: npm run build
Output directory: dist
Node version: 20.x
```

Environment variables:

```text
VITE_API_BASE_URL=https://<your-node-api-domain>/v1
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

Important: `VITE_API_BASE_URL` must point to the deployed Node API, not the static admin URL.
