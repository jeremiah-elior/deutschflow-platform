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
import {
  AssetPatchInput,
  CategoryInput,
  CategoryPatchInput,
  createCategory,
  createNote,
  createQuiz,
  createSeries,
  createVideo,
  createVocabulary,
  deleteCategory,
  deleteChapter,
  deleteChapterAsset,
  deleteCourse,
  deleteLevel,
  deleteNote,
  deleteQuiz,
  deleteSeries,
  deleteVideo,
  deleteVocabulary,
  listAdminContentOptions,
  listChapterAssets,
  NoteInput,
  NotePatchInput,
  QuizInput,
  QuizPatchInput,
  SeriesInput,
  SeriesPatchInput,
  updateCategory,
  updateChapter,
  updateChapterAsset,
  updateCourse,
  updateLevel,
  updateNote,
  updateQuiz,
  updateSeries,
  updateVideo,
  updateVocabulary,
  VocabularyInput,
  VocabularyPatchInput,
  VideoInput,
  VideoPatchInput,
  CoursePatchInput,
  LevelPatchInput,
  ChapterPatchInput
} from '../services/contentCrudService.js';

export const adminRoutes = Router();
adminRoutes.use('/v1/admin', requireAdmin);

adminRoutes.get('/v1/admin/me', (req, res) => {
  res.json({ user: req.user });
});

adminRoutes.get('/v1/admin/content-options', asyncHandler(async (_req, res) => {
  res.json(await listAdminContentOptions());
}));


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

adminRoutes.delete('/v1/admin/languages/:code', asyncHandler(async (req, res) => {
  res.json({ language: await upsertLanguage(LanguageInput.parse({ code: req.params.code, name: req.params.code, isActive: false, sortOrder: 999 })) });
}));

adminRoutes.get('/v1/admin/courses', asyncHandler(async (_req, res) => {
  res.json({ courses: await listCourses() });
}));

adminRoutes.post('/v1/admin/courses', asyncHandler(async (req, res) => {
  res.json({ course: await createCourse(CourseInput.parse(req.body)) });
}));

adminRoutes.patch('/v1/admin/courses/:id', asyncHandler(async (req, res) => {
  res.json({ course: await updateCourse(req.params.id, CoursePatchInput.parse(req.body)) });
}));

adminRoutes.delete('/v1/admin/courses/:id', asyncHandler(async (req, res) => {
  res.json(await deleteCourse(req.params.id));
}));

adminRoutes.post('/v1/admin/levels', asyncHandler(async (req, res) => {
  res.json({ level: await createLevel(LevelInput.parse(req.body)) });
}));

adminRoutes.patch('/v1/admin/levels/:id', asyncHandler(async (req, res) => {
  res.json({ level: await updateLevel(req.params.id, LevelPatchInput.parse(req.body)) });
}));

adminRoutes.delete('/v1/admin/levels/:id', asyncHandler(async (req, res) => {
  res.json(await deleteLevel(req.params.id));
}));

adminRoutes.post('/v1/admin/chapters', asyncHandler(async (req, res) => {
  res.json({ chapter: await createChapter(ChapterInput.parse(req.body)) });
}));

adminRoutes.patch('/v1/admin/chapters/:id', asyncHandler(async (req, res) => {
  res.json({ chapter: await updateChapter(req.params.id, ChapterPatchInput.parse(req.body)) });
}));

adminRoutes.delete('/v1/admin/chapters/:id', asyncHandler(async (req, res) => {
  res.json(await deleteChapter(req.params.id));
}));

adminRoutes.get('/v1/admin/chapter-assets', asyncHandler(async (req, res) => {
  res.json({ assets: await listChapterAssets(req.query as any) });
}));

adminRoutes.post('/v1/admin/chapter-assets', asyncHandler(async (req, res) => {
  res.json({ asset: await saveChapterAsset(ChapterAssetInput.parse(req.body)) });
}));

adminRoutes.patch('/v1/admin/chapter-assets/:id', asyncHandler(async (req, res) => {
  res.json({ asset: await updateChapterAsset(req.params.id, AssetPatchInput.parse(req.body)) });
}));

adminRoutes.delete('/v1/admin/chapter-assets/:id', asyncHandler(async (req, res) => {
  res.json(await deleteChapterAsset(req.params.id));
}));

adminRoutes.post('/v1/admin/uploads/sign', asyncHandler(async (req, res) => {
  res.json({ upload: await createSignedUpload(SignUploadInput.parse(req.body)) });
}));

adminRoutes.post('/v1/admin/courses/:courseSlug/levels/:levelSlug/publish', asyncHandler(async (req, res) => {
  const body = z.object({ languageCode: z.string().default('te') }).parse(req.body ?? {});
  const result = await buildCourseLevelManifest(req.params.courseSlug, req.params.levelSlug, body.languageCode);
  res.json(result);
}));


adminRoutes.post('/v1/admin/vocabulary', asyncHandler(async (req, res) => {
  res.json({ item: await createVocabulary(VocabularyInput.parse(req.body)) });
}));
adminRoutes.patch('/v1/admin/vocabulary/:id', asyncHandler(async (req, res) => {
  res.json({ item: await updateVocabulary(req.params.id, VocabularyPatchInput.parse(req.body)) });
}));
adminRoutes.delete('/v1/admin/vocabulary/:id', asyncHandler(async (req, res) => {
  res.json(await deleteVocabulary(req.params.id));
}));

adminRoutes.post('/v1/admin/notes', asyncHandler(async (req, res) => {
  res.json({ note: await createNote(NoteInput.parse(req.body)) });
}));
adminRoutes.patch('/v1/admin/notes/:id', asyncHandler(async (req, res) => {
  res.json({ note: await updateNote(req.params.id, NotePatchInput.parse(req.body)) });
}));
adminRoutes.delete('/v1/admin/notes/:id', asyncHandler(async (req, res) => {
  res.json(await deleteNote(req.params.id));
}));

adminRoutes.post('/v1/admin/videos', asyncHandler(async (req, res) => {
  res.json({ video: await createVideo(VideoInput.parse(req.body)) });
}));
adminRoutes.patch('/v1/admin/videos/:id', asyncHandler(async (req, res) => {
  res.json({ video: await updateVideo(req.params.id, VideoPatchInput.parse(req.body)) });
}));
adminRoutes.delete('/v1/admin/videos/:id', asyncHandler(async (req, res) => {
  res.json(await deleteVideo(req.params.id));
}));

adminRoutes.post('/v1/admin/quiz', asyncHandler(async (req, res) => {
  res.json({ question: await createQuiz(QuizInput.parse(req.body)) });
}));
adminRoutes.patch('/v1/admin/quiz/:id', asyncHandler(async (req, res) => {
  res.json({ question: await updateQuiz(req.params.id, QuizPatchInput.parse(req.body)) });
}));
adminRoutes.delete('/v1/admin/quiz/:id', asyncHandler(async (req, res) => {
  res.json(await deleteQuiz(req.params.id));
}));

adminRoutes.post('/v1/admin/categories', asyncHandler(async (req, res) => {
  res.json({ category: await createCategory(CategoryInput.parse(req.body)) });
}));
adminRoutes.patch('/v1/admin/categories/:id', asyncHandler(async (req, res) => {
  res.json({ category: await updateCategory(req.params.id, CategoryPatchInput.parse(req.body)) });
}));
adminRoutes.delete('/v1/admin/categories/:id', asyncHandler(async (req, res) => {
  res.json(await deleteCategory(req.params.id));
}));

adminRoutes.post('/v1/admin/series', asyncHandler(async (req, res) => {
  res.json({ series: await createSeries(SeriesInput.parse(req.body)) });
}));
adminRoutes.patch('/v1/admin/series/:id', asyncHandler(async (req, res) => {
  res.json({ series: await updateSeries(req.params.id, SeriesPatchInput.parse(req.body)) });
}));
adminRoutes.delete('/v1/admin/series/:id', asyncHandler(async (req, res) => {
  res.json(await deleteSeries(req.params.id));
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
