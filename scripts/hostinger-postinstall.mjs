import { spawnSync } from 'node:child_process';

console.log('DeutschFlow V63 postinstall: running build with devDependencies enabled');
const result = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NPM_CONFIG_PRODUCTION: 'false', npm_config_production: 'false' }
});
if (result.status !== 0) {
  console.error('DeutschFlow V63 postinstall build failed. Runtime server.js will try again on start.');
  // Do not fail npm install on Hostinger; let runtime attempt and show detailed logs.
  process.exit(0);
}
console.log('DeutschFlow V63 postinstall build completed.');
