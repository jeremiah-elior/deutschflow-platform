// Hostinger root entry file for DeutschFlow single-domain deployment.
// V72 media uploads redirect + PHP-compatible mobile APIs + side-inspector admin workflow + auto-build entry.
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');

const VERSION = 'V75_PUBLIC_SITE_BUILD_FIX_2026_08_04';
const compiledServer = resolve(process.cwd(), 'apps/api/dist/server.js');
const adminIndex = resolve(process.cwd(), 'dist/index.html');
const buildStamp = resolve(process.cwd(), 'dist/.deutschflow-build-version');
const EXPECTED_ADMIN_BUILD = 'V75_PUBLIC_SITE_BUILD_2026_08_04';

console.log(`DeutschFlow ${VERSION}`);
console.log('DeutschFlow cwd:', process.cwd());
console.log('DeutschFlow expected API build:', compiledServer);
console.log('DeutschFlow expected admin build:', adminIndex);

function run(command, args) {
  console.log(`DeutschFlow running: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NPM_CONFIG_PRODUCTION: 'false',
      npm_config_production: 'false'
    }
  });
  if (result.error) {
    console.error(`DeutschFlow command failed to start: ${command}`, result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`DeutschFlow command failed with code ${result.status}: ${command} ${args.join(' ')}`);
    process.exit(result.status || 1);
  }
}

function currentAdminBuildExists() {
  if (!existsSync(adminIndex) || !existsSync(buildStamp)) return false;
  try {
    return readFileSync(buildStamp, 'utf8').trim() === EXPECTED_ADMIN_BUILD;
  } catch {
    return false;
  }
}

function ensureBuild() {
  const apiExists = existsSync(compiledServer);
  const adminExists = existsSync(adminIndex);
  const adminCurrent = currentAdminBuildExists();
  console.log('DeutschFlow build check:', { apiExists, adminExists, adminCurrent, expected: EXPECTED_ADMIN_BUILD });

  if (apiExists && adminCurrent) {
    console.log('DeutschFlow current build output found. Starting API server...');
    return;
  }

  console.log('DeutschFlow build output missing or stale. Running npm run build...');
  // npm install is intentionally not run here to avoid reinstall loops on Hostinger.
  // Hostinger should run npm install before this entry file. Build tools are installed when NPM_CONFIG_PRODUCTION=false.
  run('npm', ['run', 'build']);

  if (!existsSync(compiledServer)) {
    console.error('DeutschFlow API build still not found after build attempt:', compiledServer);
    console.error('This means Hostinger did not install/build workspace packages correctly. Check deployment build logs.');
    process.exit(1);
  }
  if (!currentAdminBuildExists()) {
    console.error('DeutschFlow admin build is missing or stale after build attempt:', adminIndex);
    console.error('This means the admin Vite build/copy step failed. Check deployment build logs.');
    process.exit(1);
  }
}

ensureBuild();

import(pathToFileURL(compiledServer).href).catch((error) => {
  console.error('DeutschFlow API failed to start after build succeeded. Check environment variables and runtime logs.');
  console.error(error);
  process.exit(1);
});
