import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const RawEnvSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.string().default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().optional(),
  DB_SSL: z.enum(['true', 'false']).default('false'),
  PUBLIC_APP_BASE_URL: z.string().optional(),
  UPLOADS_DIR: z.string().default('uploads/content'),
  ADMIN_JWT_SECRET: z.string().optional(),
  ADMIN_COOKIE_NAME: z.string().default('df_admin'),
  ENABLE_DEV_ADMIN_BYPASS: z.enum(['true', 'false']).default('false'),
  GOOGLE_SPEECH_ENABLED: z.enum(['true', 'false']).default('false'),
  GOOGLE_SERVICE_ACCOUNT_JSON: z.string().default(''),
  GOOGLE_SERVICE_ACCOUNT_JSON_BASE64: z.string().default(''),
  GOOGLE_TTS_VOICE: z.string().default('de-DE-Chirp3-HD-Leda'),
  GOOGLE_TTS_SPEAKING_RATE: z.coerce.number().min(0.25).max(2).default(0.86),
  SPEECH_UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(2500000)
});

const rawEnv = RawEnvSchema.parse(process.env);
export const configWarnings: string[] = [];

function required(name: keyof typeof rawEnv, fallback: string) {
  const value = rawEnv[name];
  if (!value || String(value).trim() === '') {
    configWarnings.push(`${String(name)} is missing`);
    return fallback;
  }
  return String(value);
}

const publicAppBaseUrl = (rawEnv.PUBLIC_APP_BASE_URL || rawEnv.CORS_ORIGIN.split(',')[0] || '').trim().replace(/\/+$/, '');
if (!publicAppBaseUrl) configWarnings.push('PUBLIC_APP_BASE_URL is missing');

export const env = {
  PORT: rawEnv.PORT,
  NODE_ENV: rawEnv.NODE_ENV,
  CORS_ORIGIN: rawEnv.CORS_ORIGIN,
  DB_HOST: required('DB_HOST', '127.0.0.1'),
  DB_PORT: rawEnv.DB_PORT,
  DB_USER: required('DB_USER', 'root'),
  DB_PASSWORD: required('DB_PASSWORD', ''),
  DB_NAME: required('DB_NAME', 'deutschflow'),
  DB_SSL: rawEnv.DB_SSL === 'true',
  PUBLIC_APP_BASE_URL: publicAppBaseUrl,
  UPLOADS_DIR: rawEnv.UPLOADS_DIR,
  ADMIN_JWT_SECRET: required('ADMIN_JWT_SECRET', 'CHANGE-ME-IN-PRODUCTION'),
  ADMIN_COOKIE_NAME: rawEnv.ADMIN_COOKIE_NAME,
  ENABLE_DEV_ADMIN_BYPASS: rawEnv.ENABLE_DEV_ADMIN_BYPASS,
  GOOGLE_SPEECH_ENABLED: rawEnv.GOOGLE_SPEECH_ENABLED === 'true',
  GOOGLE_SERVICE_ACCOUNT_JSON: rawEnv.GOOGLE_SERVICE_ACCOUNT_JSON,
  GOOGLE_SERVICE_ACCOUNT_JSON_BASE64: rawEnv.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64,
  GOOGLE_TTS_VOICE: rawEnv.GOOGLE_TTS_VOICE,
  GOOGLE_TTS_SPEAKING_RATE: rawEnv.GOOGLE_TTS_SPEAKING_RATE,
  SPEECH_UPLOAD_MAX_BYTES: rawEnv.SPEECH_UPLOAD_MAX_BYTES
};

export const isProduction = env.NODE_ENV === 'production';
if (isProduction && env.ADMIN_JWT_SECRET === 'CHANGE-ME-IN-PRODUCTION') configWarnings.push('ADMIN_JWT_SECRET must be changed in production');

if (env.GOOGLE_SPEECH_ENABLED && !env.GOOGLE_SERVICE_ACCOUNT_JSON.trim() && !env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64.trim() && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  configWarnings.push('Google speech is enabled but no service-account credentials/ADC path is configured');
}
