import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { env } from '../config/env.js';
import { HttpError } from './http.js';

const root = resolve(process.cwd(), env.UPLOADS_DIR);

function cleanStoragePath(storagePath: string) {
  const normalized = String(storagePath || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('..') || normalized.startsWith('.')) throw new HttpError(400, 'invalid_storage_path');
  return normalized;
}

export function storageAbsolutePath(storagePath: string) {
  const clean = cleanStoragePath(storagePath);
  const absolute = resolve(root, clean);
  if (absolute !== root && !absolute.startsWith(root + sep)) throw new HttpError(400, 'invalid_storage_path');
  return absolute;
}

export function publicUrl(storagePath: string) {
  const clean = cleanStoragePath(storagePath);
  const path = `/uploads/content/${clean.split('/').map(encodeURIComponent).join('/')}`;
  return env.PUBLIC_APP_BASE_URL ? `${env.PUBLIC_APP_BASE_URL}${path}` : path;
}

export async function saveStorageFile(storagePath: string, data: Buffer | string) {
  const absolute = storageAbsolutePath(storagePath);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, data);
  return publicUrl(storagePath);
}

export async function uploadTextFile(storagePath: string, body: string | Buffer, _contentType = 'application/json') {
  return await saveStorageFile(storagePath, body);
}

export async function downloadStorageText(storagePath: string) {
  const absolute = storageAbsolutePath(storagePath);
  if (!existsSync(absolute)) throw new HttpError(404, 'storage_file_not_found');
  return await readFile(absolute, 'utf8');
}
