import { spawnSync } from 'node:child_process';

console.log('DeutschFlow V78 deployment install: building API + public/admin web app');
const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true, env: process.env });
if (result.error) {
  console.error(result.error);
  process.exit(1);
}
if (result.status !== 0) {
  console.error(`DeutschFlow deployment build failed with code ${result.status}`);
  process.exit(result.status ?? 1);
}
console.log('DeutschFlow V78 deployment build completed.');
