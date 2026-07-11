import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from './http.js';

export function publicUrl(storagePath: string) {
  const cleanBase = env.PUBLIC_CONTENT_BASE_URL.replace(/\/$/, '');
  return `${cleanBase}/${storagePath.replace(/^\//, '')}`;
}

export async function uploadTextFile(storagePath: string, content: string | Buffer, contentType: string) {
  const { error } = await supabaseAdmin.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(storagePath, content, { upsert: true, contentType });
  if (error) throw new HttpError(500, 'storage_upload_failed', error.message);
  return publicUrl(storagePath);
}

export async function downloadStorageText(storagePath: string) {
  const { data, error } = await supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).download(storagePath);
  if (error || !data) throw new HttpError(404, 'storage_file_not_found', error?.message);
  return await data.text();
}
