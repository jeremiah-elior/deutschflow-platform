import axios from 'axios';
import { supabase } from './supabase';

function normalizeApiBaseUrl(raw: string | undefined) {
  const browserOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  const fallback = browserOrigin || 'http://localhost:8080';
  let value = (raw || fallback).trim().replace(/\/+$/, '');
  // Admin calls already include /v1, so keep env as the API origin only.
  // If someone enters https://api.example.com/v1, make it safe instead of producing /v1/v1.
  value = value.replace(/\/v1$/i, '');
  return value;
}

export const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const code = error?.response?.data?.error;
    const message = error?.response?.data?.message || error?.message || 'API request failed';
    const url = error?.config?.url ? `${apiBaseUrl}${error.config.url}` : apiBaseUrl;
    throw new Error(status ? `${status} ${code || ''} ${message}`.trim() : `${message}. Check API URL: ${url}`);
  }
);

export async function getApiHealth() {
  const { data } = await api.get('/health');
  return data;
}

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
