import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env, isProduction } from '../config/env.js';
import { row } from '../config/db.js';
import { HttpError } from '../utils/http.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email?: string; role?: string };
    }
  }
}

function parseCookies(header: string | undefined) {
  const cookies: Record<string,string> = {};
  for (const pair of String(header || '').split(';')) {
    const idx = pair.indexOf('=');
    if (idx < 0) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

export function createAdminToken(user: { id: string; email: string; role: string }) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role, kind: 'admin' }, env.ADMIN_JWT_SECRET, { expiresIn: '12h', issuer: 'deutschflow' });
}

export function setAdminCookie(res: Response, token: string) {
  res.cookie(env.ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000,
    path: '/'
  });
}

export function clearAdminCookie(res: Response) {
  res.clearCookie(env.ADMIN_COOKIE_NAME, { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/' });
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!isProduction && env.ENABLE_DEV_ADMIN_BYPASS === 'true') {
      req.user = { id: '00000000-0000-0000-0000-000000000000', email: 'dev@deutschflow.local', role: 'super_admin' };
      return next();
    }
    const cookies = parseCookies(req.headers.cookie);
    const bearer = String(req.headers.authorization || '').startsWith('Bearer ') ? String(req.headers.authorization).slice(7) : '';
    const token = cookies[env.ADMIN_COOKIE_NAME] || bearer;
    if (!token) throw new HttpError(401, 'admin_login_required');
    let decoded: any;
    try { decoded = jwt.verify(token, env.ADMIN_JWT_SECRET, { issuer: 'deutschflow' }); }
    catch { throw new HttpError(401, 'invalid_admin_session'); }
    const admin = await row<any>('SELECT id,email,role,is_active FROM admin_users WHERE id=? LIMIT 1', [decoded.sub]);
    if (!admin || !admin.is_active) throw new HttpError(403, 'admin_access_denied');
    req.user = { id: admin.id, email: admin.email, role: admin.role };
    return next();
  } catch (error) { return next(error); }
}
