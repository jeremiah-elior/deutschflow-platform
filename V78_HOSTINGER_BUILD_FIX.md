# DeutschFlow V78 – Hostinger build/runtime fix

## Why V77/V76 could return 503
The root server attempted to run `npm run build` at application runtime when compiled output was missing. Hostinger exposes npm during the deployment/build phase, but npm commands are not intended to be executed by the running application process. A runtime `npm` call therefore returned code 127 and the process exited.

## V78 changes
- Runtime `server.js` never invokes npm.
- `postinstall`/deployment performs the build.
- Build tool dependencies were promoted to production dependencies so Hostinger can compile even when it installs production-only packages.
- Deployment now fails early if compilation fails instead of going live and returning 503.
- Version endpoint should report `V78_MYSQL_HOSTINGER_BUILD_FIX_2026_08_05`.

## GitHub deployment
1. Replace the repository files with V78.
2. Delete any old `package-lock.json` from the repository before this first V78 deployment if it belongs to V76/V77. Hostinger can regenerate dependency resolution from the updated workspace package files.
3. Commit and push to the configured branch (`main`).
4. Redeploy. Keep Express / Node 20.x / root `./` / entry `server.js`.
5. Do not run npm commands from File Manager/SSH. Hostinger runs install/build as part of deployment.

## Verify
`curl -s https://mydeutschflow.de/__version`

Expected version: `V78_MYSQL_HOSTINGER_BUILD_FIX_2026_08_05`.
