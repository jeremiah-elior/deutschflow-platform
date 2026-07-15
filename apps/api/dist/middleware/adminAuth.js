import { env, isProduction } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../utils/http.js';
export async function requireAdmin(req, _res, next) {
    try {
        if (!isProduction && env.ENABLE_DEV_ADMIN_BYPASS === 'true') {
            req.user = { id: '00000000-0000-0000-0000-000000000000', email: 'dev@deutschflow.local', role: 'super_admin' };
            return next();
        }
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
        if (!token)
            throw new HttpError(401, 'missing_bearer_token');
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !data.user)
            throw new HttpError(401, 'invalid_token');
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('admin_profiles')
            .select('role,is_active')
            .eq('user_id', data.user.id)
            .maybeSingle();
        if (profileError)
            throw new HttpError(500, 'admin_profile_lookup_failed', profileError.message);
        if (!profile?.is_active)
            throw new HttpError(403, 'admin_access_denied');
        req.user = { id: data.user.id, email: data.user.email ?? undefined, role: profile.role };
        return next();
    }
    catch (err) {
        return next(err);
    }
}
