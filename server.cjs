// DeutschFlow Hostinger root entry file.
// V78: build happens during deployment only. Runtime never invokes npm.
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');

const VERSION = 'V88_MOBILE_AUDIO_RESUME_CORE_2026_08_11';
const compiledServer = resolve(process.cwd(), 'apps/api/dist/server.js');
const adminIndex = resolve(process.cwd(), 'dist/index.html');

console.log(`DeutschFlow ${VERSION}`);
console.log('DeutschFlow cwd:', process.cwd());
console.log('DeutschFlow API build:', compiledServer, existsSync(compiledServer));
console.log('DeutschFlow web build:', adminIndex, existsSync(adminIndex));

if (!existsSync(compiledServer) || !existsSync(adminIndex)) {
  console.error('DeutschFlow deployment build output is missing.');
  console.error('Hostinger must run the project build during DEPLOYMENT, not at runtime.');
  console.error('Expected: apps/api/dist/server.js and dist/index.html');
  process.exit(1);
}

import(pathToFileURL(compiledServer).href).catch((error) => {
  console.error('DeutschFlow API failed to start. Check database/environment variables.');
  console.error(error);
  process.exit(1);
});
