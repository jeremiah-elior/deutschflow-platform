import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../utils/http.js';

type AnyRow = Record<string, any>;

type CourseRow = {
  id: string;
  slug: string;
  title_json?: AnyRow | null;
  description_json?: AnyRow | null;
};

type LevelRow = {
  id: string;
  legacy_id?: number | null;
  slug: string;
  title_json?: AnyRow | null;
  description_json?: AnyRow | null;
  sort_order?: number | null;
};

type ChapterRow = {
  id: string;
  legacy_id?: number | null;
  level_id?: string | null;
  slug: string;
  number?: number | null;
  title_json?: AnyRow | null;
  description_json?: AnyRow | null;
  duration_seconds?: number | null;
  is_premium?: boolean | null;
  is_featured?: boolean | null;
  is_active?: boolean | null;
  updated_at?: string | null;
  transcript_de?: string | null;
  notes_json?: AnyRow | null;
  category?: AnyRow | null;
  series?: AnyRow | null;
  chapter_translations?: AnyRow[] | null;
  chapter_assets?: AnyRow[] | null;
  chapter_notes?: AnyRow[] | null;
  chapter_transcripts?: AnyRow[] | null;
  chapter_vocabulary?: AnyRow[] | null;
  chapter_videos?: AnyRow[] | null;
  chapter_quiz_questions?: AnyRow[] | null;
};

const SUPPORTED_APP_LANGS = new Set(['te', 'ta', 'kn']);
const DEFAULT_COURSE_SLUG = 'german';

function normalizeLanguage(input: unknown) {
  const lang = String(input ?? 'te').trim().toLowerCase();
  return SUPPORTED_APP_LANGS.has(lang) ? lang : 'te';
}

function asInt(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clientLessonId(chapter: ChapterRow) {
  return chapter.legacy_id ?? chapter.id;
}

function localized(json: AnyRow | null | undefined, code: string, fallbackCodes: string[] = []) {
  if (!json || typeof json !== 'object') return '';
  const direct = json[code];
  if (typeof direct === 'string' && direct.trim()) return direct;
  for (const key of fallbackCodes) {
    const value = json[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
}

function getTranslation(chapter: ChapterRow, lang: string) {
  return (chapter.chapter_translations ?? [])
    .find((item) => item.language_code === lang && item.is_published !== false) ?? null;
}

function getAnyTranslation(chapter: ChapterRow) {
  return (chapter.chapter_translations ?? []).find((item) => item.is_published !== false) ?? null;
}

function durationMinutes(rawSecondsOrMinutes: number | null | undefined) {
  const value = Number(rawSecondsOrMinutes ?? 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  // Legacy PHP/MySQL used small integer values like 20 to mean 20 minutes.
  // Newer assets may store real seconds. Keep both formats safe.
  if (value <= 180) return Math.round(value);
  return Math.max(1, Math.round(value / 60));
}

function publicAssetUrl(asset: AnyRow | null | undefined) {
  if (!asset) return null;
  return asset.public_url || asset.storage_path || null;
}

function findAsset(chapter: ChapterRow, assetType: string, lang?: string) {
  const assets = (chapter.chapter_assets ?? []).filter((asset) => asset.is_active !== false && asset.asset_type === assetType);
  if (lang) {
    const languageAsset = assets.find((asset) => asset.language_code === lang);
    if (languageAsset) return languageAsset;
  }
  return assets.find((asset) => asset.language_code === null || asset.language_code === undefined) ?? assets[0] ?? null;
}

function getAudioUrl(chapter: ChapterRow, lang: string, fallback = false) {
  const languageAsset = findAsset(chapter, 'audio', lang);
  const languageTranslation = getTranslation(chapter, lang);
  const direct = publicAssetUrl(languageAsset) || languageTranslation?.audio_url || null;
  if (direct) return direct;
  if (!fallback) return null;
  const anyAudioAsset = findAsset(chapter, 'audio');
  const anyTranslation = getAnyTranslation(chapter);
  return publicAssetUrl(anyAudioAsset) || anyTranslation?.audio_url || null;
}

function getCoverUrl(chapter: ChapterRow) {
  const coverAsset = findAsset(chapter, 'cover');
  return publicAssetUrl(coverAsset) || chapter.series?.cover_url || null;
}

function hasMobileVisibleContent(chapter: ChapterRow, lang: string) {
  // Imported legacy lessons are valid mobile lessons.
  // New Supabase placeholder chapters from setup/admin should not appear in the mobile list
  // until they have real language content or media. This prevents empty rows like "Chapter 01"
  // with no audio/title/category from reaching the app.
  if (chapter.legacy_id !== null && chapter.legacy_id !== undefined) return true;
  if (getTranslation(chapter, lang)) return true;
  if (getAudioUrl(chapter, lang, false)) return true;
  if (findAsset(chapter, 'cover')) return true;
  const title = localized(chapter.title_json, lang) || localized(chapter.title_json, 'en');
  const hasGenericSetupTitle = /^chapter\s*\d+$/i.test(title.trim()) || /^chapter-\d+$/i.test(String(chapter.slug ?? ''));
  return Boolean(title && !hasGenericSetupTitle && (chapter.duration_seconds ?? 0) > 0);
}

function buildLessonSummary(chapter: ChapterRow, level: LevelRow | undefined, lang: string, fallback = false) {
  const translation = getTranslation(chapter, lang);
  const fallbackTranslation = fallback ? getAnyTranslation(chapter) : null;
  const nativeTitle = translation?.title || fallbackTranslation?.title || localized(chapter.title_json, lang);
  const titleEn = localized(chapter.title_json, 'en') || chapter.slug;
  const title = nativeTitle || titleEn;
  const coverUrl = getCoverUrl(chapter);

  return {
    id: clientLessonId(chapter),
    uuid: chapter.id,
    legacyId: chapter.legacy_id ?? null,
    slug: chapter.slug,
    title,
    titleNative: nativeTitle,
    nativeLanguage: lang,
    titleEn,
    level: level?.slug ?? '',
    category: chapter.category?.name ?? null,
    categoryIcon: chapter.category?.icon ?? null,
    series: chapter.series?.title ?? null,
    durationMinutes: durationMinutes(chapter.duration_seconds),
    audioUrl: getAudioUrl(chapter, lang, fallback),
    coverUrl,
    manualCoverUrl: coverUrl,
    isPremium: Boolean(chapter.is_premium),
    isFeatured: Boolean(chapter.is_featured),
    updatedAt: chapter.updated_at ?? null
  };
}

async function getGermanCourse() {
  const { data, error } = await supabaseAdmin
    .from('courses')
    .select('id,slug,title_json,description_json')
    .eq('slug', DEFAULT_COURSE_SLUG)
    .maybeSingle();
  if (error) throw new HttpError(500, 'course_fetch_failed', error.message);
  if (!data) throw new HttpError(404, 'course_not_found');
  return data as CourseRow;
}

async function getLevelsForCourse(courseId: string, levelSlug?: string) {
  let query = supabaseAdmin
    .from('course_levels')
    .select('id,legacy_id,slug,title_json,description_json,sort_order')
    .eq('course_id', courseId)
    .eq('is_active', true)
    .order('sort_order');
  if (levelSlug) query = query.eq('slug', levelSlug.toUpperCase());
  const { data, error } = await query;
  if (error) throw new HttpError(500, 'levels_fetch_failed', error.message);
  return (data ?? []) as LevelRow[];
}

const chapterSelect = `
  id,legacy_id,level_id,slug,number,title_json,description_json,duration_seconds,is_premium,is_featured,is_active,updated_at,transcript_de,notes_json,
  category:course_categories(id,name,icon,description),
  series:course_series(id,title,subtitle,cover_url),
  chapter_translations(*),
  chapter_assets(*),
  chapter_notes(*),
  chapter_transcripts(*),
  chapter_vocabulary(*,translations:chapter_vocabulary_translations(*)),
  chapter_videos(*),
  chapter_quiz_questions(*)
`;

async function getChaptersForLevels(levelIds: string[]) {
  if (!levelIds.length) return [] as ChapterRow[];
  const { data, error } = await supabaseAdmin
    .from('chapters')
    .select(chapterSelect)
    .in('level_id', levelIds)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw new HttpError(500, 'chapters_fetch_failed', error.message);
  return (data ?? []) as ChapterRow[];
}

async function getChapterByClientId(id: string) {
  const numericId = asInt(id);
  let query = supabaseAdmin.from('chapters').select(chapterSelect).limit(1);
  query = numericId !== null && String(numericId) === id
    ? query.eq('legacy_id', numericId)
    : query.eq('id', id);
  const { data, error } = await query;
  if (error) throw new HttpError(500, 'chapter_fetch_failed', error.message);
  const chapter = ((data ?? [])[0] ?? null) as ChapterRow | null;
  if (!chapter) throw new HttpError(404, 'lesson_not_found');
  return chapter;
}

async function getLevelMap(courseId: string) {
  const levels = await getLevelsForCourse(courseId);
  return new Map(levels.map((level) => [level.id, level]));
}

export async function getMobileLessons(params: { lang?: unknown; level?: unknown; legacy?: unknown }) {
  const lang = normalizeLanguage(params.lang);
  const requestedLevel = params.level ? String(params.level).toUpperCase() : undefined;
  const course = await getGermanCourse();
  const levels = await getLevelsForCourse(course.id, requestedLevel);
  const levelMap = new Map(levels.map((level) => [level.id, level]));
  const chapters = await getChaptersForLevels(levels.map((level) => level.id));
  const lessons = chapters
    .filter((chapter) => hasMobileVisibleContent(chapter, lang))
    .map((chapter) => buildLessonSummary(chapter, levelMap.get(String(chapter.level_id)), lang, false));
  if (String(params.legacy ?? '') === '1') return lessons;
  return { success: true, language: lang, lessons };
}

export async function getMobileLessonOverview(id: string, langInput: unknown, fallbackInput?: unknown) {
  const lang = normalizeLanguage(langInput);
  const fallback = String(fallbackInput ?? '') === '1';
  const course = await getGermanCourse();
  const levelMap = await getLevelMap(course.id);
  const chapter = await getChapterByClientId(id);
  const overview = buildLessonSummary(chapter, levelMap.get(String(chapter.level_id)), lang, fallback);
  const isFallback = fallback && !getTranslation(chapter, lang) && Boolean(getAnyTranslation(chapter));
  return { success: true, language: lang, lessonId: clientLessonId(chapter), ...(isFallback ? { fallbackLanguage: getAnyTranslation(chapter)?.language_code, isFallback: true } : {}), overview };
}

function videoMatches(video: AnyRow, lang: string, fallback: boolean) {
  // v70 migration adds language_code. Existing old video rows are marked te.
  // Null language_code is treated as shared/non-localized content.
  if (video.is_enabled === false) return false;
  if (!video.language_code) return true;
  if (video.language_code === lang) return true;
  return fallback;
}

export async function getMobileLessonVideos(id: string, langInput: unknown, fallbackInput?: unknown) {
  const lang = normalizeLanguage(langInput);
  const fallback = String(fallbackInput ?? '') === '1';
  const chapter = await getChapterByClientId(id);
  const videos = (chapter.chapter_videos ?? [])
    .filter((video) => videoMatches(video, lang, fallback))
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((video) => ({
      id: video.legacy_id ?? video.id,
      uuid: video.id,
      title: video.title ?? 'Video Overview',
      videoUrl: video.video_url,
      thumbnailUrl: video.thumbnail_url ?? null,
      durationSeconds: video.duration_seconds ?? 0,
      isEnabled: video.is_enabled !== false,
      isPremium: Boolean(video.is_premium),
      sortOrder: video.sort_order ?? 0
    }));
  return { success: true, language: lang, lessonId: clientLessonId(chapter), videos, updatedAt: chapter.updated_at ?? null };
}

function vocabularyNative(vocab: AnyRow, lang: string, fallback: boolean) {
  const translation = (vocab.translations ?? []).find((item: AnyRow) => item.language_code === lang);
  if (translation?.meaning) return translation.meaning;
  const direct = vocab.meaning_json?.[lang];
  if (typeof direct === 'string' && direct.trim()) return direct;
  if (!fallback) return '';
  const fallbackTranslation = (vocab.translations ?? []).find((item: AnyRow) => item.meaning);
  return fallbackTranslation?.meaning || vocab.meaning_json?.te || vocab.meaning_json?.en || '';
}

export async function getMobileLessonVocabulary(id: string, langInput: unknown, fallbackInput?: unknown) {
  const lang = normalizeLanguage(langInput);
  const fallback = String(fallbackInput ?? '') === '1';
  const chapter = await getChapterByClientId(id);
  const vocabulary = (chapter.chapter_vocabulary ?? [])
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((vocab) => ({
      id: vocab.legacy_id ?? vocab.id,
      uuid: vocab.id,
      german: vocab.german,
      english: vocab.english ?? vocab.meaning_json?.en ?? '',
      native: vocabularyNative(vocab, lang, fallback),
      article: vocab.article ?? null,
      plural: vocab.plural ?? null,
      category: vocab.category ?? null,
      example: vocab.example ?? null,
      exampleNative: vocab.example_native ?? null,
      isImportant: Boolean(vocab.is_important ?? false),
      sortOrder: vocab.sort_order ?? 0
    }))
    .filter((vocab) => fallback || vocab.native || vocab.english || vocab.german);
  return { success: true, language: lang, lessonId: clientLessonId(chapter), vocabulary, updatedAt: chapter.updated_at ?? null };
}

export async function getMobileLessonNotes(id: string, langInput: unknown, fallbackInput?: unknown) {
  const lang = normalizeLanguage(langInput);
  const fallback = String(fallbackInput ?? '') === '1';
  const chapter = await getChapterByClientId(id);
  const languageNote = (chapter.chapter_notes ?? []).find((note) => note.language_code === lang);
  const fallbackNote = fallback ? (chapter.chapter_notes ?? []).find((note) => note.content) : null;
  const notesNative = languageNote?.content || fallbackNote?.content || localized(chapter.notes_json, lang) || (fallback ? localized(chapter.notes_json, 'te') : '');
  const notesEn = localized(chapter.notes_json, 'en');
  const isFallback = Boolean(fallback && !languageNote && fallbackNote);
  return {
    success: true,
    language: lang,
    ...(isFallback ? { fallbackLanguage: fallbackNote?.language_code, isFallback: true } : {}),
    lessonId: clientLessonId(chapter),
    notes: notesNative || '',
    notesNative: notesNative || '',
    notesEn: notesEn || '',
    updatedAt: chapter.updated_at ?? null
  };
}

function parseTranscriptContent(content: string, fallbackId: string, languageCode: string, sortOrder: number) {
  const trimmed = (content || '').trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item, index) => ({
        id: item.id ?? `${fallbackId}-${index}`,
        startTime: Number(item.startTime ?? item.start_time ?? item.start ?? 0),
        endTime: Number(item.endTime ?? item.end_time ?? item.end ?? 0),
        text: item.text ?? item.german ?? '',
        nativeText: item.nativeText ?? item.native_text ?? item.native ?? item.translation ?? '',
        languageCode,
        sortOrder: Number(item.sortOrder ?? item.sort_order ?? index)
      }));
    }
  } catch {
    // Plain text transcript: return one row.
  }
  return [{
    id: fallbackId,
    startTime: 0,
    endTime: 0,
    text: languageCode === 'de' ? trimmed : '',
    nativeText: languageCode === 'de' ? '' : trimmed,
    languageCode,
    sortOrder
  }];
}

export async function getMobileLessonTranscript(id: string, langInput: unknown, fallbackInput?: unknown) {
  const lang = normalizeLanguage(langInput);
  const fallback = String(fallbackInput ?? '') === '1';
  const chapter = await getChapterByClientId(id);
  const transcriptRows = (chapter.chapter_transcripts ?? [])
    .filter((row) => row.language_code === lang || row.language_code === 'de' || fallback)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  let transcript = transcriptRows.flatMap((row) => parseTranscriptContent(row.content, row.legacy_id ?? row.id, row.language_code, row.sort_order ?? 0));
  if (!transcript.length && chapter.transcript_de) {
    transcript = parseTranscriptContent(chapter.transcript_de, `${clientLessonId(chapter)}-de`, 'de', 0);
  }
  return { success: true, language: lang, lessonId: clientLessonId(chapter), transcript, updatedAt: chapter.updated_at ?? null };
}

function optionArray(options: AnyRow | null | undefined) {
  const source = options ?? {};
  if (Array.isArray(source)) return source;
  return ['a', 'b', 'c', 'd']
    .map((key) => source[key] ?? source[key.toUpperCase()])
    .filter((value) => value !== undefined && value !== null);
}

function answerIndex(correctOption: unknown) {
  const key = String(correctOption ?? '').toLowerCase();
  const index = ['a', 'b', 'c', 'd'].indexOf(key);
  return index >= 0 ? index : 0;
}

function quizMatches(quiz: AnyRow, lang: string, fallback: boolean) {
  if (quiz.is_active === false) return false;
  if (!quiz.language_code) return true;
  if (quiz.language_code === lang) return true;
  return fallback;
}

export async function getMobileLessonQuiz(id: string, langInput: unknown, fallbackInput?: unknown) {
  const lang = normalizeLanguage(langInput);
  const fallback = String(fallbackInput ?? '') === '1';
  const chapter = await getChapterByClientId(id);
  const quiz = (chapter.chapter_quiz_questions ?? [])
    .filter((item) => quizMatches(item, lang, fallback))
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((item) => ({
      id: item.legacy_id ?? item.id,
      uuid: item.id,
      question: item.question,
      options: optionArray(item.options_json),
      answerIndex: answerIndex(item.correct_option),
      explanation: item.explanation ?? '',
      sortOrder: item.sort_order ?? 0
    }));
  return { success: true, language: lang, lessonId: clientLessonId(chapter), quiz, updatedAt: chapter.updated_at ?? null };
}

export async function getMobileLessonDetail(params: { id?: unknown; lang?: unknown; section?: unknown; fallback?: unknown }) {
  const lessonId = String(params.id ?? '').trim();
  if (!lessonId) throw new HttpError(400, 'lesson_id_required');
  const section = String(params.section ?? '').trim().toLowerCase();
  if (!section) {
    const [overview, videos, vocabulary, notes, transcript, quiz] = await Promise.all([
      getMobileLessonOverview(lessonId, params.lang, params.fallback),
      getMobileLessonVideos(lessonId, params.lang, params.fallback),
      getMobileLessonVocabulary(lessonId, params.lang, params.fallback),
      getMobileLessonNotes(lessonId, params.lang, params.fallback),
      getMobileLessonTranscript(lessonId, params.lang, params.fallback),
      getMobileLessonQuiz(lessonId, params.lang, params.fallback)
    ]);
    return {
      success: true,
      language: overview.language,
      lessonId: overview.lessonId,
      overview: overview.overview,
      videos: videos.videos,
      vocabulary: vocabulary.vocabulary,
      notes: notes.notes,
      notesNative: notes.notesNative,
      notesEn: notes.notesEn,
      transcript: transcript.transcript,
      quiz: quiz.quiz
    };
  }
  if (section === 'overview') return getMobileLessonOverview(lessonId, params.lang, params.fallback);
  if (section === 'videos') return getMobileLessonVideos(lessonId, params.lang, params.fallback);
  if (section === 'vocabulary') return getMobileLessonVocabulary(lessonId, params.lang, params.fallback);
  if (section === 'notes') return getMobileLessonNotes(lessonId, params.lang, params.fallback);
  if (section === 'transcript') return getMobileLessonTranscript(lessonId, params.lang, params.fallback);
  if (section === 'quiz') return getMobileLessonQuiz(lessonId, params.lang, params.fallback);
  throw new HttpError(400, 'unsupported_section');
}

export async function getMobileCategories() {
  const course = await getGermanCourse();
  const { data, error } = await supabaseAdmin
    .from('course_categories')
    .select('id,legacy_id,name,icon,description,is_active,sort_order')
    .eq('course_id', course.id)
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw new HttpError(500, 'categories_fetch_failed', error.message);
  return { success: true, categories: (data ?? []).map((item: AnyRow) => ({ id: item.legacy_id ?? item.id, uuid: item.id, name: item.name, icon: item.icon, description: item.description, sortOrder: item.sort_order ?? 0 })) };
}

export async function getMobileLevels() {
  const course = await getGermanCourse();
  const levels = await getLevelsForCourse(course.id);
  return { success: true, levels: levels.map((level) => ({ id: level.legacy_id ?? level.id, uuid: level.id, code: level.slug, title: localized(level.title_json, 'en') || level.slug, description: localized(level.description_json, 'en'), sortOrder: level.sort_order ?? 0 })) };
}

export async function getMobileSeries() {
  const course = await getGermanCourse();
  const { data, error } = await supabaseAdmin
    .from('course_series')
    .select('id,legacy_id,title,subtitle,description,cover_url,is_featured,is_active')
    .eq('course_id', course.id)
    .eq('is_active', true)
    .order('title');
  if (error) throw new HttpError(500, 'series_fetch_failed', error.message);
  return { success: true, series: (data ?? []).map((item: AnyRow) => ({ id: item.legacy_id ?? item.id, uuid: item.id, title: item.title, subtitle: item.subtitle, description: item.description, coverUrl: item.cover_url, isFeatured: Boolean(item.is_featured) })) };
}
