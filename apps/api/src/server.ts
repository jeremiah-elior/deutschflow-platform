import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { errorHandler } from './utils/http.js';
import { publicRoutes } from './routes/publicRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';

const app = express();

const VERSION = 'V90_ADMIN_ASSET_DRAWER_FIX_2026_08_12';
console.log(`DeutschFlow API ${VERSION}`);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));
app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((value) => value.trim()), credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use(publicRoutes);
app.use(adminRoutes);

// Server-side compatibility redirects. These run before the SPA fallback so
// old bookmarks never render the legacy login route.
app.get('/login', (_req, res) => res.redirect(302, '/admin/login'));
for (const path of ['languages', 'courses', 'chapters', 'vocabulary', 'notes', 'videos', 'quiz', 'taxonomy', 'lid', 'media', 'settings']) {
  app.get(`/${path}`, (_req, res) => res.redirect(302, `/admin/${path}`));
}

// V77 content storage. UPLOADS_DIR may be relative to the app root or an absolute
// persistent Hostinger path. It always maps publicly to /uploads/content/*.
const contentUploadsDir = resolve(process.cwd(), env.UPLOADS_DIR);
if (existsSync(contentUploadsDir)) {
  console.log(`Serving DeutschFlow content from ${contentUploadsDir}`);
  app.use('/uploads/content', express.static(contentUploadsDir, {
    index: false,
    maxAge: env.NODE_ENV === 'production' ? '1y' : 0,
    immutable: env.NODE_ENV === 'production',
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Accept-Ranges', 'bytes');
      if (env.NODE_ENV === 'production') res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }));
}

// Serve all DeutschFlow uploads from the same persistent uploads root.
// If UPLOADS_DIR is /.../public_html/uploads/content, its parent is
// /.../public_html/uploads, so covers/videos can live beside content.
// There is deliberately NO redirect to the retired silver-llama host.
const uploadsRootDir = resolve(contentUploadsDir, '..');
if (existsSync(uploadsRootDir)) {
  console.log(`Serving DeutschFlow uploads root from ${uploadsRootDir}`);
  app.use('/uploads', express.static(uploadsRootDir, {
    index: false,
    maxAge: env.NODE_ENV === 'production' ? '1y' : 0,
    immutable: env.NODE_ENV === 'production',
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Accept-Ranges', 'bytes');
      if (env.NODE_ENV === 'production') res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }));
}

app.use('/uploads', (req, res) => {
  const safeOriginalUrl = req.originalUrl.replace(/\\/g, '/');
  if (safeOriginalUrl.includes('..')) {
    return res.status(400).json({ success: false, error: 'invalid_media_path' });
  }
  return res.status(404).json({ success: false, error: 'media_file_not_found', path: safeOriginalUrl });
});

function findAdminDistPath() {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // Hostinger/single-domain build copies apps/admin/dist to repo-root dist.
    resolve(process.cwd(), 'dist'),
    // Local monorepo build output if running from repo root.
    resolve(process.cwd(), 'apps/admin/dist'),
    // If the process is started from apps/api.
    resolve(process.cwd(), '../../dist'),
    resolve(process.cwd(), '../admin/dist'),
    // Relative to compiled apps/api/dist/server.js.
    resolve(here, '../../../dist'),
    resolve(here, '../../admin/dist')
  ];

  return candidates.find((candidate) => existsSync(resolve(candidate, 'index.html')));
}

const adminDistPath = findAdminDistPath();

if (adminDistPath) {
  console.log(`Serving DeutschFlow admin UI from ${adminDistPath}`);
  app.use(express.static(adminDistPath, {
    index: false,
    maxAge: env.NODE_ENV === 'production' ? '1h' : 0
  }));

  app.get('*', (req, res, next) => {
    // Keep API/health errors as API errors. Only frontend routes should fall back to index.html.
    if (req.path === '/health' || req.path.startsWith('/v1/') || req.path.startsWith('/api/')) {
      return next();
    }

    return res.sendFile(resolve(adminDistPath, 'index.html'));
  });
} else {
  console.warn('Admin UI dist folder not found. API will run without serving the React admin. Run npm run build first for single-domain deployment.');
}

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`DeutschFlow API running on http://localhost:${env.PORT}`);
});
