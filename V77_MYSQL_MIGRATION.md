# DeutschFlow V77 — MySQL migration

V77 removes the runtime dependency on Supabase. DeutschFlow now uses:

- **Node.js + Express** for the API
- **MySQL / MariaDB** for course, LiD, release and admin data
- **Hostinger filesystem** under `uploads/content/` for migrated lesson/LiD media
- **Firebase Authentication** remains unchanged in the mobile app
- **MySQL admin users + signed HTTP-only cookie** for the web admin

The public website and all existing mobile compatibility endpoints remain on `https://mydeutschflow.de`.

## Migrated backup contents

The provided PostgreSQL backup was converted to MySQL seed data. The migration contains:

| Table/content | Rows |
| --- | ---: |
| Courses | 1 |
| Levels | 6 |
| Categories | 7 |
| Series | 2 |
| Chapters | 5 |
| Chapter translations | 6 |
| Chapter assets | 9 |
| Notes | 8 |
| Vocabulary | 141 |
| Videos | 1 |
| Quiz questions | 1 |
| Languages | 11 |
| LiD catalogs | 3 |
| LiD cards | 460 |
| Content releases | 13 |
| Admin users | 1 |

The existing administrator account was migrated with its existing bcrypt password hash, so the same admin password should continue to work after import. If it does not, use the password-reset script described below.

## 1. Create the Hostinger MySQL database

In hPanel create a MySQL database and user. Keep these values ready:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
```

Do not commit the password to GitHub.

## 2. Import the database

The easiest method is phpMyAdmin:

1. Open the new database in phpMyAdmin.
2. Import `mysql/deutschflow_v77_full.sql`.
3. Wait for the import to complete.

The same import can be run from the Node project after environment variables are configured:

```bash
npm install
npm run db:migrate
```

`db:migrate` imports `mysql/schema.sql` followed by `mysql/seed.sql`.

## 3. Import the storage backup

The supplied storage export contains the `content/` folder. It must end up at:

```text
<project root>/uploads/content/
```

If the original backup ZIP is available on the server:

```bash
npm run storage:import -- /path/to/wnkxhlqmelualzsiqzhq.storage.zip
```

Or extract it manually and copy the contents of its `content/` directory into `uploads/content/`.

Expected migrated files include lesson audio, LiD JSON source files, and course manifests.

Do **not** put the large storage ZIP into GitHub. Upload/extract it with Hostinger File Manager or another server file-transfer method.

## 4. Hostinger environment variables

Set these on the Node application:

```env
PORT=8080
NODE_ENV=production
CORS_ORIGIN=https://mydeutschflow.de
PUBLIC_APP_BASE_URL=https://mydeutschflow.de

DB_HOST=YOUR_HOSTINGER_MYSQL_HOST
DB_PORT=3306
DB_USER=YOUR_HOSTINGER_MYSQL_USER
DB_PASSWORD=YOUR_HOSTINGER_MYSQL_PASSWORD
DB_NAME=YOUR_HOSTINGER_MYSQL_DATABASE
DB_SSL=false

UPLOADS_DIR=uploads/content
ADMIN_JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET_AT_LEAST_64_CHARS
ADMIN_COOKIE_NAME=df_admin
ENABLE_DEV_ADMIN_BYPASS=false
```

The web build only needs:

```env
VITE_API_BASE_URL=https://mydeutschflow.de
VITE_SITE_URL=https://mydeutschflow.de
```

plus the legal/support values from `apps/admin/.env.example`.

There are no `SUPABASE_*` or `VITE_SUPABASE_*` variables in V77.

## 5. Install, build and redeploy

Hostinger settings remain:

```text
Framework: Express
Branch: main
Node: 20.x
Root directory: ./
Package manager: npm
Entry file: server.js
Build command: npm run build
```

Then redeploy/restart the application.

## 6. Verify V77

```bash
curl -s https://mydeutschflow.de/__version
```

Expected:

```json
{"app":"DeutschFlow","version":"V77_MYSQL_2026_08_05","database":"mysql"}
```

Check database health:

```bash
curl -s https://mydeutschflow.de/health
```

The `database.ok` value must be `true`.

Check the exact mobile endpoint that was failing before:

```bash
curl -i "https://mydeutschflow.de/api/lessons.php?lang=te&level=A1"
```

Expected status: `HTTP/2 200` and a JSON lesson list.

Also test:

```bash
curl -s https://mydeutschflow.de/v1/lid/catalog
curl -s https://mydeutschflow.de/v1/app/bootstrap?lang=te
```

## 7. Admin login

Admin URL:

```text
https://mydeutschflow.de/admin/login
```

V77 migrated the existing admin password hash. If the old password does not work, reset it from the project directory after DB configuration:

```bash
npm run admin:set-password -- YOUR_ADMIN_EMAIL "A-NEW-STRONG-PASSWORD"
```

This updates only the MySQL `admin_users` record.

If you prefer to create a new admin with an email/password you choose, run:

```bash
npm run admin:create -- YOUR_EMAIL "A-NEW-STRONG-PASSWORD"
```

## 8. Mobile app

The React Native app should use:

```ts
export const API_BASE_URL = 'https://mydeutschflow.de';
```

Firebase sign-in stays unchanged. The mobile app does not connect directly to MySQL.

## Notes about older media

The supplied storage export contains the current Supabase-hosted lesson/LiD files. A few older database records still reference the previous `silver-llama-257051.hostingersite.com/uploads/...` media host. V77 keeps a compatibility fallback for those URLs so existing legacy covers/audio are not silently lost. They can be copied into the new `uploads/` area later if you want to remove that fallback completely.

## Storage persistence note

`UPLOADS_DIR` accepts either a relative directory (default `uploads/content`) or an absolute server path. If your Hostinger deployment recreates the Node build directory on each GitHub redeploy, place the media in a persistent directory available through hPanel File Manager and set `UPLOADS_DIR` to that absolute directory. V77 will still expose that directory at `/uploads/content/*`.

Keep a backup of the prepared storage archive before future deployments.
