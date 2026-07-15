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
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false
}));
app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((value) => value.trim()), credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(publicRoutes);
app.use(adminRoutes);
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
}
else {
    console.warn('Admin UI dist folder not found. API will run without serving the React admin. Run npm run build first for single-domain deployment.');
}
app.use(errorHandler);
app.listen(env.PORT, () => {
    console.log(`DeutschFlow API running on http://localhost:${env.PORT}`);
});
