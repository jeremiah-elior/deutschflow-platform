import axios from 'axios';
import { supabase } from './supabase';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function signUpload(file: File, folder: string) {
  const { data } = await api.post('/v1/admin/uploads/sign', {
    folder,
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    upsert: true
  });

  const upload = data.upload;
  const { error } = await supabase.storage.from(upload.bucket).uploadToSignedUrl(upload.storagePath, upload.token, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: true
  });

  if (error) throw new Error(error.message);
  return upload;
}
