// Hostinger root entry file for DeutschFlow single-domain deployment.
// CommonJS-safe and auto-builds missing dist files before loading Express API.
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');

const compiledServer = resolve(process.cwd(), 'apps/api/dist/server.js');
const adminIndex = resolve(process.cwd(), 'dist/index.html');

function runBuildIfNeeded() {
  if (existsSync(compiledServer) && existsSync(adminIndex)) {
    console.log('DeutschFlow build output found. Starting API server...');
    return;
  }

  console.log('DeutschFlow build output not found. Running npm run build...');
  const result = spawnSync('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NPM_CONFIG_PRODUCTION: 'false',
      npm_config_production: 'false'
    }
  });

  if (result.status !== 0) {
    console.error('DeutschFlow build failed. Check Hostinger deployment/build logs.');
    process.exit(result.status || 1);
  }
}

runBuildIfNeeded();

if (!existsSync(compiledServer)) {
  console.error('DeutschFlow API build still not found after build attempt:', compiledServer);
  process.exit(1);
}

import(pathToFileURL(compiledServer).href).catch((error) => {
  console.error('DeutschFlow API failed to start. Check environment variables and build output.');
  console.error(error);
  process.exit(1);
});
