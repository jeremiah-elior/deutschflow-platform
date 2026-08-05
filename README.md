# DeutschFlow V77

Production backend and public website for DeutschFlow.

## Architecture

- React + Vite public/admin website
- Node.js + Express API
- MySQL / MariaDB database
- Hostinger local media storage (`uploads/content/`)
- Firebase Authentication for the React Native mobile app
- MySQL admin accounts with signed HTTP-only admin sessions

**Supabase is not required at runtime in V77.**

## Main URLs

```text
/                         Public website
/about                    About
/support                  Support
/privacy-policy           Privacy Policy
/terms                    Terms
/delete-account           Account deletion
/impressum                 Impressum
/admin/login              Admin login
/admin/*                  Admin dashboards
/health                    API/database health
/__version                 Deployed version
/api/lessons.php           Mobile lesson compatibility API
/api/lesson-detail.php     Mobile lesson-detail compatibility API
/v1/app/bootstrap          Mobile bootstrap
/v1/lid/catalog            LiD catalog for the app
```

## First deployment

Read **`V77_MYSQL_MIGRATION.md`** before deploying.

The ready MySQL import is:

```text
mysql/deutschflow_v77_full.sql
```

Then configure `.env`, run `npm install`, `npm run build`, and start with `npm start` / `server.js`.

## Development

```bash
cp .env.example .env
cp apps/admin/.env.example apps/admin/.env
npm install
npm run dev
```

## Important

Do not commit `.env`, database passwords, JWT secrets, or the large storage backup to GitHub.
