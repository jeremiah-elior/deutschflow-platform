# DeutschFlow V76 – deployment root fix

This ZIP is intentionally **flat**: `package.json`, `server.js`, `apps/`, `scripts/` are at the ZIP root.

## Why V75 appeared unchanged
The previous delivery ZIP contained a wrapper folder. Extracting it into an existing project could leave the old root files active. Hostinger would then continue serving the legacy admin bundle, where `/` redirects to `/login`.

## Deploy
1. Back up production env values/uploads.
2. Replace the project root with the contents of this ZIP. Do not create an extra subfolder.
3. Hostinger settings: root `./`, install `npm install`, build `npm run build`, start `npm start`, entry `server.js`, Node 20/22.
4. Redeploy/restart.
5. Open `/__version`; it must return `V76_DEPLOY_ROOT_FIX_2026_08_05`.
6. Test `/`, `/about`, `/privacy-policy`, and `/admin/login`.

If `/__version` is 404 or reports an older version, Hostinger is still running old root files/branch/deployment.
