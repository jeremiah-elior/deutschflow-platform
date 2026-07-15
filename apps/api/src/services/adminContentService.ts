import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../utils/http.js';

function titleFromJson(value: any, fallback = 'Untitled') {
  if (!value || typeof value !== 'object') return fallback;
  return value.en || value.de || value.te || value.ta || value.kn || Object.values(value).find(Boolean) || fallback;
}

async function tableCount(table: string) {
  const { count, error } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new HttpError(500, `${table}_count_failed`, error.message);
  return count ?? 0;
}

export async function getAdminOverview() {
  const [
    languages,
    courses,
    levels,
    chapters,
    categories,
    series,
    notes,
    transcripts,
    vocabulary,
    videos,
    quiz,
    chapterAssets,
    lidCatalogs,
    lidCards,
    releases
  ] = await Promise.all([
    tableCount('languages'),
    tableCount('courses'),
    tableCount('course_levels'),
    tableCount('chapters'),
    tableCount('course_categories'),
    tableCount('course_series'),
    tableCount('chapter_notes'),
    tableCount('chapter_transcripts'),
    tableCount('chapter_vocabulary'),
    tableCount('chapter_videos'),
    tableCount('chapter_quiz_questions'),
    tableCount('chapter_assets'),
    tableCount('lid_catalogs'),
    tableCount('lid_cards'),
    tableCount('content_releases')
  ]);

  const { data: recentChapters, error: recentError } = await supabaseAdmin
    .from('chapters')
    .select('id,slug,number,title_json,is_active,updated_at,level:course_levels(slug,title_json,course:courses(slug,title_json))')
    .order('updated_at', { ascending: false })
    .limit(6);
  if (recentError) throw new HttpError(500, 'recent_chapters_failed', recentError.message);

  const { data: latestReleases, error: releaseError } = await supabaseAdmin
    .from('content_releases')
    .select('id,module,version,language_code,manifest_public_url,published_at,is_active')
    .order('published_at', { ascending: false })
    .limit(6);
  if (releaseError) throw new HttpError(500, 'latest_releases_failed', releaseError.message);

  return {
    counts: {
      languages,
      courses,
      levels,
      chapters,
      categories,
      series,
      notes,
      transcripts,
      vocabulary,
      videos,
      quiz,
      chapterAssets,
      lidCatalogs,
      lidCards,
      releases
    },
    health: {
      courseContentReady: chapters > 0,
      vocabularyReady: vocabulary > 0,
      mediaReady: videos > 0 || chapterAssets > 0,
      lidReady: lidCatalogs > 0 && lidCards > 0,
      publishedContentReady: releases > 0
    },
    recentChapters: (recentChapters ?? []).map((chapter: any) => ({
      id: chapter.id,
      slug: chapter.slug,
      number: chapter.number,
      title: titleFromJson(chapter.title_json, chapter.slug),
      level: chapter.level?.slug ?? null,
      course: chapter.level?.course?.slug ?? null,
      isActive: chapter.is_active,
      updatedAt: chapter.updated_at
    })),
    latestReleases: latestReleases ?? []
  };
}

export async function listAdminChapters(query: { level?: string; search?: string; active?: string }) {
  let request = supabaseAdmin
    .from('chapters')
    .select('id,legacy_id,slug,number,title_json,description_json,duration_seconds,is_premium,is_featured,is_active,updated_at,level:course_levels(id,slug,title_json,course:courses(id,slug,title_json)),category:course_categories(id,name,icon),series:course_series(id,title,subtitle),chapter_translations(id,language_code,title,is_published,audio_url),chapter_notes(id,language_code),chapter_vocabulary(id),chapter_videos(id,is_enabled,is_premium),chapter_quiz_questions(id,is_active)')
    .order('sort_order', { ascending: true })
    .order('number', { ascending: true });

  if (query.level) request = request.eq('level.slug', query.level);
  if (query.active === 'true') request = request.eq('is_active', true);
  if (query.active === 'false') request = request.eq('is_active', false);

  const { data, error } = await request;
  if (error) throw new HttpError(500, 'chapters_fetch_failed', error.message);

  const search = query.search?.trim().toLowerCase();
  const rows = (data ?? []).map((chapter: any) => ({
    id: chapter.id,
    legacyId: chapter.legacy_id,
    slug: chapter.slug,
    number: chapter.number,
    title: titleFromJson(chapter.title_json, chapter.slug),
    titleJson: chapter.title_json ?? {},
    descriptionJson: chapter.description_json ?? {},
    durationSeconds: chapter.duration_seconds ?? 0,
    isPremium: Boolean(chapter.is_premium),
    isFeatured: Boolean(chapter.is_featured),
    isActive: Boolean(chapter.is_active),
    updatedAt: chapter.updated_at,
    course: chapter.level?.course?.slug ?? null,
    level: chapter.level?.slug ?? null,
    category: chapter.category ?? null,
    series: chapter.series ?? null,
    translations: chapter.chapter_translations ?? [],
    counts: {
      translations: (chapter.chapter_translations ?? []).length,
      notes: (chapter.chapter_notes ?? []).length,
      vocabulary: (chapter.chapter_vocabulary ?? []).length,
      videos: (chapter.chapter_videos ?? []).length,
      quiz: (chapter.chapter_quiz_questions ?? []).length
    }
  }));

  return search ? rows.filter((row: any) => JSON.stringify(row).toLowerCase().includes(search)) : rows;
}

export async function listAdminVocabulary(query: { search?: string; chapterId?: string; limit?: string }) {
  let request = supabaseAdmin
    .from('chapter_vocabulary')
    .select('id,legacy_id,german,english,meaning_json,sort_order,chapter:chapters(id,slug,number,title_json,level:course_levels(slug,title_json,course:courses(slug,title_json)))')
    .order('sort_order', { ascending: true })
    .limit(Math.min(Number(query.limit ?? 500), 1000));

  if (query.chapterId) request = request.eq('chapter_id', query.chapterId);
  const search = query.search?.trim();
  if (search) {
    const safe = search.replaceAll(',', ' ');
    request = request.or(`german.ilike.%${safe}%,english.ilike.%${safe}%`);
  }

  const { data, error } = await request;
  if (error) throw new HttpError(500, 'vocabulary_fetch_failed', error.message);

  return (data ?? []).map((item: any) => ({
    id: item.id,
    legacyId: item.legacy_id,
    german: item.german,
    english: item.english,
    meaning: item.meaning_json ?? {},
    sortOrder: item.sort_order,
    chapter: item.chapter ? {
      id: item.chapter.id,
      slug: item.chapter.slug,
      number: item.chapter.number,
      title: titleFromJson(item.chapter.title_json, item.chapter.slug),
      level: item.chapter.level?.slug ?? null,
      course: item.chapter.level?.course?.slug ?? null
    } : null
  }));
}

export async function listAdminNotes(query: { language?: string; chapterId?: string }) {
  let request = supabaseAdmin
    .from('chapter_notes')
    .select('id,legacy_id,language_code,content,updated_at,chapter:chapters(id,slug,number,title_json,level:course_levels(slug,title_json,course:courses(slug,title_json)))')
    .order('updated_at', { ascending: false });
  if (query.language) request = request.eq('language_code', query.language);
  if (query.chapterId) request = request.eq('chapter_id', query.chapterId);

  const { data, error } = await request;
  if (error) throw new HttpError(500, 'notes_fetch_failed', error.message);
  return (data ?? []).map((item: any) => ({
    id: item.id,
    legacyId: item.legacy_id,
    languageCode: item.language_code,
    content: item.content,
    updatedAt: item.updated_at,
    chapter: item.chapter ? {
      id: item.chapter.id,
      slug: item.chapter.slug,
      number: item.chapter.number,
      title: titleFromJson(item.chapter.title_json, item.chapter.slug),
      level: item.chapter.level?.slug ?? null
    } : null
  }));
}

export async function listAdminVideos(query: { chapterId?: string }) {
  let request = supabaseAdmin
    .from('chapter_videos')
    .select('id,legacy_id,title,video_url,thumbnail_url,duration_seconds,is_enabled,is_premium,show_as_preview,sort_order,updated_at,chapter:chapters(id,slug,number,title_json,level:course_levels(slug,title_json,course:courses(slug,title_json)))')
    .order('sort_order', { ascending: true });
  if (query.chapterId) request = request.eq('chapter_id', query.chapterId);

  const { data, error } = await request;
  if (error) throw new HttpError(500, 'videos_fetch_failed', error.message);
  return (data ?? []).map((item: any) => ({
    ...item,
    chapter: item.chapter ? {
      id: item.chapter.id,
      slug: item.chapter.slug,
      number: item.chapter.number,
      title: titleFromJson(item.chapter.title_json, item.chapter.slug),
      level: item.chapter.level?.slug ?? null
    } : null
  }));
}

export async function listAdminQuiz(query: { chapterId?: string }) {
  let request = supabaseAdmin
    .from('chapter_quiz_questions')
    .select('id,legacy_id,source_table,question,options_json,correct_option,explanation,sort_order,is_active,updated_at,chapter:chapters(id,slug,number,title_json,level:course_levels(slug,title_json,course:courses(slug,title_json)))')
    .order('sort_order', { ascending: true });
  if (query.chapterId) request = request.eq('chapter_id', query.chapterId);

  const { data, error } = await request;
  if (error) throw new HttpError(500, 'quiz_fetch_failed', error.message);
  return (data ?? []).map((item: any) => ({
    ...item,
    chapter: item.chapter ? {
      id: item.chapter.id,
      slug: item.chapter.slug,
      number: item.chapter.number,
      title: titleFromJson(item.chapter.title_json, item.chapter.slug),
      level: item.chapter.level?.slug ?? null
    } : null
  }));
}

export async function listAdminCategoriesAndSeries() {
  const [{ data: categories, error: categoryError }, { data: series, error: seriesError }] = await Promise.all([
    supabaseAdmin.from('course_categories').select('*,course:courses(slug,title_json)').order('sort_order'),
    supabaseAdmin.from('course_series').select('*,course:courses(slug,title_json)').order('created_at')
  ]);
  if (categoryError) throw new HttpError(500, 'categories_fetch_failed', categoryError.message);
  if (seriesError) throw new HttpError(500, 'series_fetch_failed', seriesError.message);
  return { categories: categories ?? [], series: series ?? [] };
}
