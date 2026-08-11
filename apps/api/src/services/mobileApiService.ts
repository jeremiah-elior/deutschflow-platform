import { rows } from '../config/db.js';
import { getCourseBySlug, getLevels, hydrateChapters, getHydratedChapterByClientId, type ChapterRelations } from './chapterDataService.js';
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
  level_slug?: string | null;
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
const RETIRED_MEDIA_HOSTS = new Set(['silver-llama-257051.hostingersite.com', 'deutsch.berlinpulse.eu']);
const SUMMARY_RELATIONS: ChapterRelations = { translations: true, assets: true, videos: true };

function publicAppBaseUrl() {
  const explicit = process.env.PUBLIC_APP_BASE_URL || '';
  const corsFirst = String(process.env.CORS_ORIGIN || '').split(',')[0]?.trim() || '';
  return (explicit || corsFirst || '').replace(/\/$/, '');
}

function normalizeMediaUrl(value: unknown) {
  if (typeof value !== 'string') return null;
  let raw = value.trim();
  if (!raw) return null;
  const appBase = publicAppBaseUrl();
  raw = raw.replace(/\\/g, '/');

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    if (RETIRED_MEDIA_HOSTS.has(host)) {
      const path = `${parsed.pathname}${parsed.search}`;
      return appBase ? `${appBase}${path}` : path;
    }
    if (host.endsWith('.supabase.co') && parsed.pathname.includes('/storage/v1/object/public/content/')) {
      const suffix = parsed.pathname.split('/storage/v1/object/public/content/')[1] || '';
      const path = `/uploads/content/${suffix}${parsed.search}`;
      return appBase ? `${appBase}${path}` : path;
    }
    if (host === 'mydeutschflow.de') {
      const path = `${parsed.pathname}${parsed.search}`;
      return appBase ? `${appBase}${path}` : raw;
    }
    return raw;
  } catch {
    // Relative storage key. Normalize below.
  }

  if (raw.startsWith('/api/uploads/')) raw = raw.slice('/api'.length);
  if (raw.startsWith('api/uploads/')) raw = `/${raw.slice('api/'.length)}`;
  if (raw.startsWith('/uploads/')) return appBase ? `${appBase}${raw}` : raw;
  if (raw.startsWith('uploads/')) return appBase ? `${appBase}/${raw}` : `/${raw}`;

  raw = raw.replace(/^\/+/, '');
  if (raw.startsWith('content/')) {
    const path = `/uploads/${raw}`;
    return appBase ? `${appBase}${path}` : path;
  }
  if (/^(courses|lid|manifests)\//.test(raw)) {
    const path = `/uploads/content/${raw}`;
    return appBase ? `${appBase}${path}` : path;
  }
  return raw;
}

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
    .find((item) => item.language_code === lang && Boolean(item.is_published)) ?? null;
}

function getAnyTranslation(chapter: ChapterRow) {
  return (chapter.chapter_translations ?? []).find((item) => Boolean(item.is_published)) ?? null;
}

function durationMinutes(rawSecondsOrMinutes: number | null | undefined) {
  const value = Number(rawSecondsOrMinutes ?? 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  // Legacy PHP/MySQL used small integer values like 20 to mean 20 minutes.
  // Newer assets may store real seconds. Keep both formats safe.
  if (value <= 180) return Math.round(value);
  return Math.max(1, Math.round(value / 60));
}


function durationMilliseconds(rawSecondsOrMinutes: unknown) {
  const value = Number(rawSecondsOrMinutes ?? 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  // Imported legacy audio rows store values such as 20 for "20 minutes".
  // New uploads may store true seconds. Keep both forms deterministic.
  const seconds = value <= 180 ? value * 60 : value;
  return Math.round(seconds * 1000);
}

function withVersion(url: string | null, version: string) {
  if (!url) return null;
  if (!version) return url;
  try {
    const parsed = new URL(url, publicAppBaseUrl() || undefined);
    parsed.searchParams.set('v', version);
    return parsed.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${encodeURIComponent(version)}`;
  }
}

function publicAssetUrl(asset: AnyRow | null | undefined) {
  if (!asset) return null;
  return normalizeMediaUrl(asset.storage_path || asset.public_url || null);
}

function findAsset(chapter: ChapterRow, assetType: string, lang?: string) {
  const assets = (chapter.chapter_assets ?? []).filter((asset) => Boolean(asset.is_active) && asset.asset_type === assetType);
  if (lang) {
    const languageAsset = assets.find((asset) => asset.language_code === lang);
    if (languageAsset) return languageAsset;
  }
  return assets.find((asset) => asset.language_code === null || asset.language_code === undefined) ?? assets[0] ?? null;
}

function findExactLanguageAsset(chapter: ChapterRow, assetType: string, lang: string) {
  return (chapter.chapter_assets ?? [])
    .filter((asset) => Boolean(asset.is_active) && asset.asset_type === assetType && asset.language_code === lang)
    .sort((a, b) => String(b.updated_at ?? b.created_at ?? '').localeCompare(String(a.updated_at ?? a.created_at ?? '')))[0] ?? null;
}

function getAudioUrl(chapter: ChapterRow, lang: string, _fallback = false) {
  // V89: chapter_assets is the only audio source. Never fall back to
  // chapter_translations.audio_url or to a different language.
  return normalizeMediaUrl(publicAssetUrl(findExactLanguageAsset(chapter, 'audio', lang)));
}

function getCoverUrl(chapter: ChapterRow) {
  const coverAsset = findAsset(chapter, 'cover');
  return normalizeMediaUrl(publicAssetUrl(coverAsset) || chapter.series?.cover_url || null);
}

function hasMobileVisibleContent(chapter: ChapterRow, lang: string) {
  // Imported legacy lessons are valid mobile lessons.
  // New placeholder chapters from setup/admin should not appear in the mobile list
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


function videoMatches(video: AnyRow, lang: string, fallback: boolean) {
  // v70 migration adds language_code. Existing old video rows are marked te.
  // Null language_code is treated as shared/non-localized content.
  if (!Boolean(video.is_enabled)) return false;
  if (!video.language_code) return true;
  if (video.language_code === lang) return true;
  return fallback;
}

function getPrimaryVideo(chapter: ChapterRow, lang: string, fallback = false) {
  return (chapter.chapter_videos ?? [])
    .filter((video) => videoMatches(video, lang, fallback))
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))[0] ?? null;
}

function videoSummary(video: AnyRow | null | undefined) {
  if (!video) {
    return {
      videoUrl: null,
      videoThumbnailUrl: null,
      videoDurationSeconds: 0,
      hasVideo: false
    };
  }
  return {
    videoUrl: normalizeMediaUrl(video.video_url) ?? null,
    videoThumbnailUrl: normalizeMediaUrl(video.thumbnail_url) ?? null,
    videoDurationSeconds: Number(video.duration_seconds ?? 0),
    hasVideo: Boolean(normalizeMediaUrl(video.video_url))
  };
}

function buildLessonSummary(chapter: ChapterRow, level: LevelRow | undefined, lang: string, fallback = false) {
  const translation = getTranslation(chapter, lang);
  const fallbackTranslation = fallback ? getAnyTranslation(chapter) : null;
  const nativeTitle = translation?.title || fallbackTranslation?.title || localized(chapter.title_json, lang);
  const titleEn = localized(chapter.title_json, 'en') || chapter.slug;
  const title = nativeTitle || titleEn;
  const coverUrl = getCoverUrl(chapter);
  const primaryVideo = getPrimaryVideo(chapter, lang, fallback);
  const primaryVideoSummary = videoSummary(primaryVideo);
  const audioAsset = findExactLanguageAsset(chapter, 'audio', lang);
  const rawAudioUrl = normalizeMediaUrl(publicAssetUrl(audioAsset));
  const audioVersion = audioAsset?.sha256 ? `sha256:${audioAsset.sha256}` : String(audioAsset?.version ?? audioAsset?.updated_at ?? '1');
  const audioDurationMs = durationMilliseconds(audioAsset?.duration_seconds ?? chapter.duration_seconds);
  const audio = rawAudioUrl ? {
    url: withVersion(rawAudioUrl, audioVersion),
    version: audioVersion,
    durationMs: audioDurationMs,
    sizeBytes: Number(audioAsset?.size_bytes ?? 0) || null,
    language: lang
  } : null;

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
    durationMinutes: durationMinutes(audioAsset?.duration_seconds ?? chapter.duration_seconds),
    audio,
    audioUrl: audio?.url ?? null,
    audioVersion: audio?.version ?? null,
    audioDurationMs: audio?.durationMs ?? 0,
    coverUrl,
    manualCoverUrl: coverUrl,
    videoUrl: primaryVideoSummary.videoUrl,
    videoThumbnailUrl: primaryVideoSummary.videoThumbnailUrl || coverUrl,
    videoDurationSeconds: primaryVideoSummary.videoDurationSeconds,
    hasVideo: primaryVideoSummary.hasVideo,
    isPremium: Boolean(chapter.is_premium),
    isFeatured: Boolean(chapter.is_featured),
    updatedAt: chapter.updated_at ?? null
  };
}

async function getGermanCourse() {
  const data = await getCourseBySlug(DEFAULT_COURSE_SLUG, true);
  if (!data) throw new HttpError(404, 'course_not_found');
  return data as CourseRow;
}

async function getLevelsForCourse(courseId: string, levelSlug?: string) {
  return (await getLevels(courseId, levelSlug, true)) as LevelRow[];
}

async function getChaptersForLevels(levelIds: string[], relations?: ChapterRelations) {
  if (!levelIds.length) return [] as ChapterRow[];
  const placeholders = levelIds.map(() => '?').join(',');
  return (await hydrateChapters(`c.level_id IN (${placeholders})`, levelIds, true, relations)) as ChapterRow[];
}

async function getChapterByClientId(id: string, relations?: ChapterRelations) {
  const chapter = await getHydratedChapterByClientId(id, relations) as ChapterRow | null;
  if (!chapter) throw new HttpError(404, 'lesson_not_found');
  return chapter;
}

async function getLevelMap(courseId: string) {
  const levels = await getLevelsForCourse(courseId);
  return new Map(levels.map((level) => [level.id, level]));
}

function levelRowFromChapter(chapter: ChapterRow): LevelRow | undefined {
  const slug = String(chapter.level_slug ?? '').trim();
  if (!slug) return undefined;
  return { id: String(chapter.level_id ?? slug), slug };
}

export async function getMobileLessons(params: { lang?: unknown; level?: unknown; legacy?: unknown }) {
  const lang = normalizeLanguage(params.lang);
  const requestedLevel = params.level ? String(params.level).trim().toUpperCase() : '';

  // V89 core mobile bootstrap: ONE database query returns exactly the metadata
  // required by Home + Player first paint. No notes/vocabulary/transcript/quiz/video
  // hydration and no N+1 relation fan-out.
  //
  // The selected-language audio asset is authoritative. We intentionally do not
  // fall back to another language because Telugu/Tamil/Kannada audio can have
  // different duration/content and resume positions are language-specific.
  const sql = `
    SELECT
      c.id, c.legacy_id, c.slug, c.number, c.title_json, c.description_json,
      c.duration_seconds, c.is_premium, c.is_featured, c.is_active, c.updated_at,
      l.slug AS level_slug,
      cat.name AS category_name, cat.icon AS category_icon,
      s.title AS series_title, s.cover_url AS series_cover_url,
      ct.title AS translation_title,
      aa.id AS audio_asset_id,
      aa.storage_path AS audio_storage_path,
      aa.public_url AS audio_public_url,
      aa.duration_seconds AS audio_duration_seconds,
      aa.size_bytes AS audio_size_bytes,
      aa.sha256 AS audio_sha256,
      aa.version AS audio_version,
      aa.updated_at AS audio_updated_at,
      ca.storage_path AS cover_storage_path,
      ca.public_url AS cover_public_url,
      pv.video_url AS video_url,
      pv.thumbnail_url AS video_thumbnail_url,
      pv.duration_seconds AS video_duration_seconds,
      pv.is_premium AS video_is_premium
    FROM chapters c
    JOIN course_levels l ON l.id=c.level_id AND l.is_active=1
    JOIN courses co ON co.id=l.course_id AND co.is_active=1
    LEFT JOIN course_categories cat ON cat.id=c.category_id
    LEFT JOIN course_series s ON s.id=c.series_id
    LEFT JOIN chapter_translations ct
      ON ct.chapter_id=c.id AND ct.language_code=? AND ct.is_published=1
    LEFT JOIN chapter_assets aa ON aa.id=(
      SELECT a2.id FROM chapter_assets a2
      WHERE a2.chapter_id=c.id
        AND a2.asset_type='audio'
        AND a2.language_code=?
        AND a2.is_active=1
      ORDER BY a2.updated_at DESC, a2.created_at DESC
      LIMIT 1
    )
    LEFT JOIN chapter_assets ca ON ca.id=(
      SELECT c2.id FROM chapter_assets c2
      WHERE c2.chapter_id=c.id
        AND c2.asset_type='cover'
        AND c2.is_active=1
      ORDER BY (c2.language_code IS NULL) DESC, c2.updated_at DESC, c2.created_at DESC
      LIMIT 1
    )
    LEFT JOIN chapter_videos pv ON pv.id=(
      SELECT v2.id FROM chapter_videos v2
      WHERE v2.chapter_id=c.id
        AND v2.is_enabled=1
        AND (v2.language_code=? OR v2.language_code IS NULL)
      ORDER BY (v2.language_code=?) DESC, v2.sort_order, v2.updated_at DESC
      LIMIT 1
    )
    WHERE co.slug=? AND c.is_active=1
      ${requestedLevel ? 'AND UPPER(l.slug)=UPPER(?)' : ''}
    ORDER BY c.sort_order, c.number`;

  const queryParams: any[] = [lang, lang, lang, lang, DEFAULT_COURSE_SLUG];
  if (requestedLevel) queryParams.push(requestedLevel);
  const mobileRows = await rows<any>(sql, queryParams);

  const lessons = mobileRows
    .map((item) => {
      const nativeTitle = String(item.translation_title ?? '').trim() || localized(item.title_json, lang);
      const titleEn = localized(item.title_json, 'en') || String(item.slug ?? '');
      const title = nativeTitle || titleEn;

      // storage_path is the canonical media identity because it is written by the
      // upload pipeline. public_url can be stale after a host/domain migration.
      const audioUrlRaw = item.audio_storage_path || null;
      const audioUrl = normalizeMediaUrl(audioUrlRaw);
      const rawAudioVersion = String(item.audio_sha256 ? `sha256:${item.audio_sha256}` : (item.audio_version ?? item.audio_updated_at ?? item.updated_at ?? '')).trim();
      const audioVersion = rawAudioVersion || '1';
      const audioDurationMs = durationMilliseconds(item.audio_duration_seconds ?? item.duration_seconds);
      const coverUrl = normalizeMediaUrl(item.cover_storage_path || item.cover_public_url || item.series_cover_url || null);

      const hasRealTitle = Boolean(title && !/^chapter\s*\d+$/i.test(title.trim()));
      const visible = item.legacy_id !== null && item.legacy_id !== undefined
        ? true
        : Boolean(nativeTitle || audioUrl || coverUrl || hasRealTitle);

      if (!visible) return null;

      const audio = audioUrl ? {
        url: withVersion(audioUrl, audioVersion),
        version: audioVersion,
        durationMs: audioDurationMs,
        sizeBytes: Number(item.audio_size_bytes ?? 0) || null,
        language: lang
      } : null;

      return {
        id: item.legacy_id ?? item.id,
        uuid: item.id,
        legacyId: item.legacy_id ?? null,
        slug: item.slug,
        title,
        titleNative: nativeTitle,
        nativeLanguage: lang,
        titleEn,
        level: item.level_slug ?? '',
        category: item.category_name ?? null,
        categoryIcon: item.category_icon ?? null,
        series: item.series_title ?? null,
        durationMinutes: durationMinutes(item.audio_duration_seconds ?? item.duration_seconds),
        audio,
        // Keep audioUrl for old mobile builds while V65+ consumes `audio`.
        audioUrl: audio?.url ?? null,
        audioVersion: audio?.version ?? null,
        audioDurationMs: audio?.durationMs ?? 0,
        coverUrl,
        manualCoverUrl: coverUrl,
        videoUrl: normalizeMediaUrl(item.video_url) ?? null,
        videoThumbnailUrl: normalizeMediaUrl(item.video_thumbnail_url) ?? coverUrl,
        videoDurationSeconds: Number(item.video_duration_seconds ?? 0),
        hasVideo: Boolean(normalizeMediaUrl(item.video_url)),
        videoPremium: Boolean(item.video_is_premium),
        isPremium: Boolean(item.is_premium),
        isFeatured: Boolean(item.is_featured),
        updatedAt: item.updated_at ?? null
      };
    })
    .filter(Boolean);

  if (String(params.legacy ?? '') === '1') return lessons;
  return {
    success: true,
    schemaVersion: 2,
    language: lang,
    lessons,
    generatedAt: new Date().toISOString()
  };
}

export async function getMobileLessonOverview(id: string, langInput: unknown, fallbackInput?: unknown) {
  const lang = normalizeLanguage(langInput);
  const fallback = String(fallbackInput ?? '') === '1';
  const chapter = await getChapterByClientId(id, SUMMARY_RELATIONS);
  const overview = buildLessonSummary(chapter, levelRowFromChapter(chapter), lang, fallback);
  const isFallback = fallback && !getTranslation(chapter, lang) && Boolean(getAnyTranslation(chapter));
  return { success: true, language: lang, lessonId: clientLessonId(chapter), ...(isFallback ? { fallbackLanguage: getAnyTranslation(chapter)?.language_code, isFallback: true } : {}), overview };
}
export async function getMobileLessonVideos(id: string, langInput: unknown, fallbackInput?: unknown) {
  const lang = normalizeLanguage(langInput);
  const fallback = String(fallbackInput ?? '') === '1';
  const chapter = await getChapterByClientId(id, { videos: true });
  const videos = (chapter.chapter_videos ?? [])
    .filter((video) => videoMatches(video, lang, fallback))
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((video) => ({
      id: video.legacy_id ?? video.id,
      uuid: video.id,
      title: video.title ?? 'Video Overview',
      videoUrl: normalizeMediaUrl(video.video_url),
      thumbnailUrl: normalizeMediaUrl(video.thumbnail_url) ?? null,
      durationSeconds: video.duration_seconds ?? 0,
      isEnabled: Boolean(video.is_enabled),
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
  const chapter = await getChapterByClientId(id, { vocabulary: true });
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
  const chapter = await getChapterByClientId(id, { notes: true });
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
  const chapter = await getChapterByClientId(id, { transcripts: true });
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
  if (!Boolean(quiz.is_active)) return false;
  if (!quiz.language_code) return true;
  if (quiz.language_code === lang) return true;
  return fallback;
}

export async function getMobileLessonQuiz(id: string, langInput: unknown, fallbackInput?: unknown) {
  const lang = normalizeLanguage(langInput);
  const fallback = String(fallbackInput ?? '') === '1';
  const chapter = await getChapterByClientId(id, { quiz: true });
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
  const data = await rows<any>('SELECT id,legacy_id,name,icon,description,is_active,sort_order FROM course_categories WHERE course_id=? AND is_active=1 ORDER BY sort_order', [course.id]);
  return { success: true, categories: data.map((item: AnyRow) => ({ id: item.legacy_id ?? item.id, uuid: item.id, name: item.name, icon: item.icon, description: item.description, sortOrder: item.sort_order ?? 0 })) };
}

export async function getMobileLevels() {
  const course = await getGermanCourse();
  const levels = await getLevelsForCourse(course.id);
  return { success: true, levels: levels.map((level) => ({ id: level.legacy_id ?? level.id, uuid: level.id, code: level.slug, title: localized(level.title_json, 'en') || level.slug, description: localized(level.description_json, 'en'), sortOrder: level.sort_order ?? 0 })) };
}

export async function getMobileSeries() {
  const course = await getGermanCourse();
  const data = await rows<any>('SELECT id,legacy_id,title,subtitle,description,cover_url,is_featured,is_active FROM course_series WHERE course_id=? AND is_active=1 ORDER BY title', [course.id]);
  return { success: true, series: data.map((item: AnyRow) => ({ id: item.legacy_id ?? item.id, uuid: item.id, title: item.title, subtitle: item.subtitle, description: item.description, coverUrl: normalizeMediaUrl(item.cover_url), isFeatured: Boolean(item.is_featured) })) };
}
