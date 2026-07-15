import { Router } from 'express';
import { asyncHandler, HttpError } from '../utils/http.js';
import { supabaseAdmin } from '../config/supabase.js';
import { configWarnings } from '../config/env.js';
import { buildCourseLevelManifest } from '../services/courseService.js';
import { getPublishedLiDManifest } from '../services/lidService.js';

export const publicRoutes = Router();

publicRoutes.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'deutschflow-api', time: new Date().toISOString(), configWarnings });
});

publicRoutes.get('/v1/app/bootstrap', asyncHandler(async (req, res) => {
  const lang = String(req.query.lang ?? 'te');
  const { data: languages } = await supabaseAdmin.from('languages').select('*').eq('is_active', true).order('sort_order');
  const { data: courses } = await supabaseAdmin.from('courses').select('slug,title_json,is_active').eq('is_active', true).order('sort_order');
  const lidManifest = await getPublishedLiDManifest(lang);

  res.json({
    schemaVersion: 1,
    serverTime: new Date().toISOString(),
    requestedLanguage: lang,
    languages: languages ?? [],
    courses: courses ?? [],
    modules: {
      german: { enabled: true },
      lid: { enabled: Boolean(lidManifest), manifestAvailable: Boolean(lidManifest) }
    }
  });
}));

publicRoutes.get('/v1/courses', asyncHandler(async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('courses')
    .select('slug,title_json,description_json,levels:course_levels(slug,title_json,description_json)')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw new HttpError(500, 'courses_fetch_failed', error.message);
  res.json({ courses: data ?? [] });
}));

publicRoutes.get('/v1/courses/:courseSlug/levels/:levelSlug/manifest', asyncHandler(async (req, res) => {
  const lang = String(req.query.lang ?? 'te');
  const result = await buildCourseLevelManifest(req.params.courseSlug, req.params.levelSlug, lang);
  res.json(result.manifest);
}));

publicRoutes.get('/v1/lid/manifest', asyncHandler(async (req, res) => {
  const lang = String(req.query.lang ?? 'te');
  const manifest = await getPublishedLiDManifest(lang);
  if (!manifest) throw new HttpError(404, 'lid_manifest_not_published');
  res.json(manifest);
}));
