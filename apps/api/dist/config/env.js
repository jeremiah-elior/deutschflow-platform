import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();
const RawEnvSchema = z.object({
    PORT: z.coerce.number().default(8080),
    NODE_ENV: z.string().default('development'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    SUPABASE_URL: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_ANON_KEY: z.string().optional(),
    SUPABASE_STORAGE_BUCKET: z.string().default('content'),
    PUBLIC_CONTENT_BASE_URL: z.string().optional(),
    ENABLE_DEV_ADMIN_BYPASS: z.enum(['true', 'false']).default('false')
});
const rawEnv = RawEnvSchema.parse(process.env);
export const configWarnings = [];
function required(name, fallback) {
    const value = rawEnv[name];
    if (!value || String(value).trim() === '') {
        configWarnings.push(`${String(name)} is missing`);
        return fallback;
    }
    return String(value);
}
const supabaseUrl = required('SUPABASE_URL', 'https://placeholder.supabase.co');
const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY', 'missing-service-role-key');
const anonKey = required('SUPABASE_ANON_KEY', 'missing-anon-key');
const publicContentBaseUrl = rawEnv.PUBLIC_CONTENT_BASE_URL && rawEnv.PUBLIC_CONTENT_BASE_URL.trim()
    ? rawEnv.PUBLIC_CONTENT_BASE_URL.trim()
    : `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${rawEnv.SUPABASE_STORAGE_BUCKET}`;
const UrlSchema = z.string().url();
if (!UrlSchema.safeParse(supabaseUrl).success) {
    configWarnings.push('SUPABASE_URL is not a valid URL');
}
if (!UrlSchema.safeParse(publicContentBaseUrl).success) {
    configWarnings.push('PUBLIC_CONTENT_BASE_URL is not a valid URL');
}
export const env = {
    PORT: rawEnv.PORT,
    NODE_ENV: rawEnv.NODE_ENV,
    CORS_ORIGIN: rawEnv.CORS_ORIGIN,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    SUPABASE_ANON_KEY: anonKey,
    SUPABASE_STORAGE_BUCKET: rawEnv.SUPABASE_STORAGE_BUCKET,
    PUBLIC_CONTENT_BASE_URL: publicContentBaseUrl,
    ENABLE_DEV_ADMIN_BYPASS: rawEnv.ENABLE_DEV_ADMIN_BYPASS
};
export const isProduction = env.NODE_ENV === 'production';
