import { randomBytes } from 'node:crypto';
import { extname } from 'node:path';
import { z } from 'zod';
import { saveStorageFile, publicUrl } from '../utils/storage.js';

export const SignUploadInput = z.object({
  folder: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().optional(),
  upsert: z.boolean().default(true)
});

function safePart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'file';
}

export async function storeAdminUpload(file: Express.Multer.File, folderInput: string) {
  const folder = String(folderInput || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (!folder || folder.includes('..')) throw new Error('Invalid upload folder');
  const originalExt = extname(file.originalname || '').toLowerCase().replace(/[^.a-z0-9]/g, '');
  const base = safePart((file.originalname || 'file').replace(/\.[^.]+$/, ''));
  const name = `${Date.now()}_${randomBytes(4).toString('hex')}_${base}${originalExt}`;
  const storagePath = `${folder}/${name}`;
  await saveStorageFile(storagePath, file.buffer);
  return {
    storagePath,
    publicUrl: publicUrl(storagePath),
    contentType: file.mimetype || 'application/octet-stream',
    sizeBytes: file.size
  };
}
