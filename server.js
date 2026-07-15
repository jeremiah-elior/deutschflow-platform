import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const compiledServer = resolve(process.cwd(), 'apps/api/dist/server.js');

if (!existsSync(compiledServer)) {
  console.error('DeutschFlow API build not found:', compiledServer);
  console.error('Run npm run build before starting, or set Hostinger build command to: npm run build');
  process.exit(1);
}

await import(compiledServer);
