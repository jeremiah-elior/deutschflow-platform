import { z } from 'zod';
import { nanoid } from 'nanoid';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../utils/http.js';
import { publicUrl } from '../utils/storage.js';

export const SignUploadInput = z.object({
  folder: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  upsert: z.boolean().default(true)
});

function safeName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 160);
}

export async function createSignedUpload(input: z.infer<typeof SignUploadInput>) {
  const parsed = SignUploadInput.parse(input);
  const folder = parsed.folder.replace(/^\/+|\/+$/g, '').replace(/\.\./g, '');
  const filename = safeName(parsed.filename);
  const storagePath = `${folder}/${Date.now()}_${nanoid(8)}_${filename}`;

  const { data, error } = await supabaseAdmin.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: parsed.upsert });

  if (error || !data) throw new HttpError(500, 'signed_upload_failed', error?.message);

  return {
    token: data.token,
    signedUrl: data.signedUrl,
    path: data.path ?? storagePath,
    storagePath: data.path ?? storagePath,
    publicUrl: publicUrl(data.path ?? storagePath),
    bucket: env.SUPABASE_STORAGE_BUCKET
  };
}
