import { Router } from 'express';
import { asyncHandler, HttpError } from '../utils/http.js';
import { supabaseAdmin } from '../config/supabase.js';
import { configWarnings } from '../config/env.js';
import { buildCourseLevelManifest } from '../services/courseService.js';
import { getPublishedLiDManifest } from '../services/lidService.js';
import { getMobileCategories, getMobileLessonDetail, getMobileLessons, getMobileLevels, getMobileSeries } from '../services/mobileApiService.js';

export const publicRoutes = Router();

publicRoutes.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'deutschflow-api', time: new Date().toISOString(), configWarnings });
});


function sendPretty(req: any, res: any, payload: unknown) {
  res.setHeader('Cache-Control', 'public, max-age=300');
  if (String(req.query.pretty ?? '') === '1') {
    res.type('application/json').send(JSON.stringify(payload, null, 2));
    return;
  }
  res.json(payload);
}

// PHP-compatible mobile APIs on the new Node/Supabase backend.
// These mirror the old production mobile contract so RN/iOS can use one optimized flow:
// lightweight lessons list first, then lazy-loaded lesson sections.
publicRoutes.get('/api/health.php', (_req, res) => {
  res.json({ ok: true, success: true, service: 'deutschflow-api', time: new Date().toISOString(), configWarnings });
});

publicRoutes.get('/api/lessons.php', asyncHandler(async (req, res) => {
  const payload = await getMobileLessons({ lang: req.query.lang, level: req.query.level, legacy: req.query.legacy });
  sendPretty(req, res, payload);
}));

publicRoutes.get('/api/lesson-detail.php', asyncHandler(async (req, res) => {
  const payload = await getMobileLessonDetail({ id: req.query.id, lang: req.query.lang, section: req.query.section, fallback: req.query.fallback });
  sendPretty(req, res, payload);
}));

publicRoutes.get('/api/categories.php', asyncHandler(async (req, res) => {
  const payload = await getMobileCategories();
  sendPretty(req, res, payload);
}));

publicRoutes.get('/api/levels.php', asyncHandler(async (req, res) => {
  const payload = await getMobileLevels();
  sendPretty(req, res, payload);
}));

publicRoutes.get('/api/series.php', asyncHandler(async (req, res) => {
  const payload = await getMobileSeries();
  sendPretty(req, res, payload);
}));

publicRoutes.get('/api/index.php', asyncHandler(async (req, res) => {
  const endpoint = String(req.query.endpoint ?? '').trim().toLowerCase();
  if (String(req.query.debug ?? '') === '1') {
    return sendPretty(req, res, { success: true, router: 'node-compatible-api', endpoint, query: req.query });
  }
  if (endpoint === 'lessons') {
    return sendPretty(req, res, await getMobileLessons({ lang: req.query.lang, level: req.query.level, legacy: req.query.legacy }));
  }
  if (endpoint === 'lesson-detail' || endpoint === 'lesson_detail') {
    return sendPretty(req, res, await getMobileLessonDetail({ id: req.query.id, lang: req.query.lang, section: req.query.section, fallback: req.query.fallback }));
  }
  if (endpoint === 'categories') return sendPretty(req, res, await getMobileCategories());
  if (endpoint === 'levels') return sendPretty(req, res, await getMobileLevels());
  if (endpoint === 'series') return sendPretty(req, res, await getMobileSeries());
  throw new HttpError(404, 'endpoint_not_found');
}));

publicRoutes.get('/v1/languages', asyncHandler(async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('languages').select('*').order('sort_order');
  if (error) throw new HttpError(500, 'languages_fetch_failed', error.message);
  res.json({ languages: data ?? [] });
}));

publicRoutes.get('/v1/catalog', asyncHandler(async (req, res) => {
  const lang = String(req.query.lang ?? 'te');
  const { data: languages, error: languagesError } = await supabaseAdmin.from('languages').select('*').eq('is_active', true).order('sort_order');
  if (languagesError) throw new HttpError(500, 'languages_fetch_failed', languagesError.message);
  const { data: courses, error: coursesError } = await supabaseAdmin
    .from('courses')
    .select('slug,title_json,description_json,is_active,levels:course_levels(slug,title_json,description_json,is_active)')
    .eq('is_active', true)
    .order('sort_order');
  if (coursesError) throw new HttpError(500, 'courses_fetch_failed', coursesError.message);
  const lidManifest = await getPublishedLiDManifest(lang);
  res.json({ schemaVersion: 1, requestedLanguage: lang, languages: languages ?? [], courses: courses ?? [], lidManifestAvailable: Boolean(lidManifest) });
}));

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
