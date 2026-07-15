# Hostinger GitHub deploy check

This package prints `DeutschFlow V63_GITHUB_ACTIVE_2026_07_15` at runtime.

If Hostinger Runtime Logs do not show this exact text, Hostinger is not running this commit/files.

Check:

1. GitHub branch connected in Hostinger is the same branch you pushed.
2. Hostinger latest deployment commit hash equals GitHub latest commit hash.
3. Root directory is `./`.
4. Entry file is `server.js`.
5. Env has `NPM_CONFIG_PRODUCTION=false`.
6. Click `Save and redeploy`.

Expected health URL:

```
https://deutsch.berlinpulse.eu/health
```

Expected response:

```json
{ "ok": true, "service": "deutschflow-api" }
```
