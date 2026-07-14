import { cpSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('apps/admin/dist');
const target = resolve('dist');

if (!existsSync(source)) {
  console.error(`Admin build output not found at ${source}`);
  process.exit(1);
}

if (existsSync(target)) {
  rmSync(target, { recursive: true, force: true });
}

mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
console.log(`Copied admin build output to ${target}`);
