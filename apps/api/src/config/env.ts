import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.string().default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().default('content'),
  PUBLIC_CONTENT_BASE_URL: z.string().url(),
  ENABLE_DEV_ADMIN_BYPASS: z.enum(['true', 'false']).default('false')
});

export const env = EnvSchema.parse(process.env);
export const isProduction = env.NODE_ENV === 'production';
