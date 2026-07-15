import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/adminAuth.js';
import { asyncHandler } from '../utils/http.js';
import { createSignedUpload, SignUploadInput } from '../services/uploadService.js';
import {
  buildCourseLevelManifest,
  ChapterAssetInput,
  ChapterInput,
  CourseInput,
  createChapter,
  createCourse,
  createLevel,
  LanguageInput,
  LevelInput,
  listCourses,
  listLanguages,
  saveChapterAsset,
  upsertLanguage
} from '../services/courseService.js';
import {
  importLiDJson,
  ImportLiDJsonInput,
  listLiDCatalogs,
  LiDAssetInput,
  publishLiDManifest,
  saveLiDAsset
} from '../services/lidService.js';
import {
  getAdminOverview,
  listAdminCategoriesAndSeries,
  listAdminChapters,
  listAdminNotes,
  listAdminQuiz,
  listAdminVideos,
  listAdminVocabulary
} from '../services/adminContentService.js';

export const adminRoutes = Router();
adminRoutes.use('/v1/admin', requireAdmin);

adminRoutes.get('/v1/admin/me', (req, res) => {
  res.json({ user: req.user });
});


adminRoutes.get('/v1/admin/overview', asyncHandler(async (_req, res) => {
  res.json(await getAdminOverview());
}));

adminRoutes.get('/v1/admin/chapters', asyncHandler(async (req, res) => {
  res.json({ chapters: await listAdminChapters(req.query as any) });
}));

adminRoutes.get('/v1/admin/vocabulary', asyncHandler(async (req, res) => {
  res.json({ vocabulary: await listAdminVocabulary(req.query as any) });
}));

adminRoutes.get('/v1/admin/notes', asyncHandler(async (req, res) => {
  res.json({ notes: await listAdminNotes(req.query as any) });
}));

adminRoutes.get('/v1/admin/videos', asyncHandler(async (req, res) => {
  res.json({ videos: await listAdminVideos(req.query as any) });
}));

adminRoutes.get('/v1/admin/quiz', asyncHandler(async (req, res) => {
  res.json({ quiz: await listAdminQuiz(req.query as any) });
}));

adminRoutes.get('/v1/admin/content-taxonomy', asyncHandler(async (_req, res) => {
  res.json(await listAdminCategoriesAndSeries());
}));

adminRoutes.get('/v1/admin/languages', asyncHandler(async (_req, res) => {
  res.json({ languages: await listLanguages() });
}));

adminRoutes.post('/v1/admin/languages', asyncHandler(async (req, res) => {
  res.json({ language: await upsertLanguage(LanguageInput.parse(req.body)) });
}));

adminRoutes.get('/v1/admin/courses', asyncHandler(async (_req, res) => {
  res.json({ courses: await listCourses() });
}));

adminRoutes.post('/v1/admin/courses', asyncHandler(async (req, res) => {
  res.json({ course: await createCourse(CourseInput.parse(req.body)) });
}));

adminRoutes.post('/v1/admin/levels', asyncHandler(async (req, res) => {
  res.json({ level: await createLevel(LevelInput.parse(req.body)) });
}));

adminRoutes.post('/v1/admin/chapters', asyncHandler(async (req, res) => {
  res.json({ chapter: await createChapter(ChapterInput.parse(req.body)) });
}));

adminRoutes.post('/v1/admin/chapter-assets', asyncHandler(async (req, res) => {
  res.json({ asset: await saveChapterAsset(ChapterAssetInput.parse(req.body)) });
}));

adminRoutes.post('/v1/admin/uploads/sign', asyncHandler(async (req, res) => {
  res.json({ upload: await createSignedUpload(SignUploadInput.parse(req.body)) });
}));

adminRoutes.post('/v1/admin/courses/:courseSlug/levels/:levelSlug/publish', asyncHandler(async (req, res) => {
  const body = z.object({ languageCode: z.string().default('te') }).parse(req.body ?? {});
  const result = await buildCourseLevelManifest(req.params.courseSlug, req.params.levelSlug, body.languageCode);
  res.json(result);
}));

adminRoutes.get('/v1/admin/lid/catalogs', asyncHandler(async (_req, res) => {
  res.json({ catalogs: await listLiDCatalogs() });
}));

adminRoutes.post('/v1/admin/lid/import-json', asyncHandler(async (req, res) => {
  const result = await importLiDJson(ImportLiDJsonInput.parse(req.body), req.user?.id);
  res.json(result);
}));

adminRoutes.post('/v1/admin/lid/assets', asyncHandler(async (req, res) => {
  res.json({ asset: await saveLiDAsset(LiDAssetInput.parse(req.body)) });
}));

adminRoutes.post('/v1/admin/lid/publish', asyncHandler(async (req, res) => {
  const body = z.object({ languageCode: z.string().default('te') }).parse(req.body ?? {});
  res.json(await publishLiDManifest(body.languageCode));
}));
