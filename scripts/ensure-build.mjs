import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const apiServer = resolve(process.cwd(), 'apps/api/dist/server.js');
const adminIndex = resolve(process.cwd(), 'dist/index.html');

if (existsSync(apiServer) && existsSync(adminIndex)) {
  console.log('DeutschFlow build output found.');
  process.exit(0);
}

console.log('DeutschFlow build output missing. Running npm run build before start...');
const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
if (result.status !== 0) {
  console.error('DeutschFlow build failed before start. Check Hostinger deployment logs.');
  process.exit(result.status ?? 1);
}
