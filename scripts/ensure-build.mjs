import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const apiServer = resolve(process.cwd(), 'apps/api/dist/server.js');
const adminIndex = resolve(process.cwd(), 'dist/index.html');
const buildStamp = resolve(process.cwd(), 'dist/.deutschflow-build-version');
const EXPECTED_BUILD = 'V75_PUBLIC_SITE_BUILD_2026_08_04';

function hasCurrentAdminBuild() {
  if (!existsSync(adminIndex) || !existsSync(buildStamp)) return false;
  try { return readFileSync(buildStamp, 'utf8').trim() === EXPECTED_BUILD; } catch { return false; }
}

if (existsSync(apiServer) && hasCurrentAdminBuild()) {
  console.log(`DeutschFlow current build output found (${EXPECTED_BUILD}).`);
  process.exit(0);
}

console.log(`DeutschFlow build output missing or stale. Expected ${EXPECTED_BUILD}. Running npm run build before start...`);
const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
if (result.status !== 0) {
  console.error('DeutschFlow build failed before start. Check Hostinger deployment logs.');
  process.exit(result.status ?? 1);
}
