import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { env } from './env.js';
const serverSupabaseOptions = {
    auth: { autoRefreshToken: false, persistSession: false },
    // Hostinger may run Node.js 20, which does not provide the WebSocket global
    // expected by the current Supabase realtime client. We do not use realtime in
    // this API, but Supabase still initializes the realtime client internally.
    // Passing ws here keeps the backend compatible with Node 20 and Node 22.
    realtime: { transport: WebSocket }
};
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, serverSupabaseOptions);
export const supabaseAnon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, serverSupabaseOptions);
