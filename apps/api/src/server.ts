import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './utils/http.js';
import { publicRoutes } from './routes/publicRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((value) => value.trim()), credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use(publicRoutes);
app.use(adminRoutes);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`DeutschFlow API running on http://localhost:${env.PORT}`);
});
