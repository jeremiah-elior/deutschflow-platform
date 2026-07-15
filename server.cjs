// Hostinger root entry file for DeutschFlow single-domain deployment.
// This file is intentionally CommonJS because many Node hosts run root server.js
// as CommonJS unless package.json has "type": "module".
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');

const compiledServer = resolve(process.cwd(), 'apps/api/dist/server.js');

if (!existsSync(compiledServer)) {
  console.error('DeutschFlow API build not found:', compiledServer);
  console.error('Run npm run build before starting, or set Hostinger build command to: npm run build');
  process.exit(1);
}

import(pathToFileURL(compiledServer).href).catch((error) => {
  console.error('DeutschFlow API failed to start. Check environment variables and build output.');
  console.error(error);
  process.exit(1);
});
