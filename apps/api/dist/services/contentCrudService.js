import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../utils/http.js';
import { publicUrl } from '../utils/storage.js';
const Uuid = z.string().uuid();
const LocalizedJson = z.record(z.string(), z.string().nullable()).default({});
const AnyJson = z.record(z.string(), z.any()).default({});
function titleFromJson(value, fallback = 'Untitled') {
    if (!value || typeof value !== 'object')
        return fallback;
    return value.en || value.de || value.te || value.ta || value.kn || Object.values(value).find(Boolean) || fallback;
}
function snakePatch(input, map) {
    const output = {};
    for (const [from, to] of Object.entries(map)) {
        if (Object.prototype.hasOwnProperty.call(input, from))
            output[to] = input[from];
    }
    return output;
}
async function one(request, code) {
    const { data, error } = await request.select().single();
    if (error)
        throw new HttpError(500, code, error.message);
    return data;
}
async function deleted(request, code) {
    const { error } = await request;
    if (error)
        throw new HttpError(500, code, error.message);
    return { deleted: true };
}
export async function listAdminContentOptions() {
    const [{ data: languages, error: langError }, { data: courses, error: courseError }, { data: chapters, error: chapterError }, { data: categories, error: categoryError }, { data: series, error: seriesError }] = await Promise.all([
        supabaseAdmin.from('languages').select('code,name,native_name,is_active,sort_order').order('sort_order'),
        supabaseAdmin.from('courses').select('id,slug,title_json,levels:course_levels(id,slug,title_json,sort_order,is_active)').order('sort_order'),
        supabaseAdmin.from('chapters').select('id,slug,number,title_json,is_active,level:course_levels(id,slug,title_json,course:courses(id,slug,title_json))').order('sort_order').order('number'),
        supabaseAdmin.from('course_categories').select('id,course_id,name,icon,description,is_active,sort_order').order('sort_order'),
        supabaseAdmin.from('course_series').select('id,course_id,title,subtitle,description,is_featured,is_active').order('title')
    ]);
    if (langError)
        throw new HttpError(500, 'languages_options_failed', langError.message);
    if (courseError)
        throw new HttpError(500, 'courses_options_failed', courseError.message);
    if (chapterError)
        throw new HttpError(500, 'chapters_options_failed', chapterError.message);
    if (categoryError)
        throw new HttpError(500, 'categories_options_failed', categoryError.message);
    if (seriesError)
        throw new HttpError(500, 'series_options_failed', seriesError.message);
    return {
        languages: languages ?? [],
        courses: courses ?? [],
        categories: categories ?? [],
        series: series ?? [],
        chapters: (chapters ?? []).map((chapter) => ({
            id: chapter.id,
            slug: chapter.slug,
            number: chapter.number,
            title: titleFromJson(chapter.title_json, chapter.slug),
            titleJson: chapter.title_json ?? {},
            isActive: chapter.is_active,
            levelId: chapter.level?.id ?? null,
            level: chapter.level?.slug ?? null,
            courseId: chapter.level?.course?.id ?? null,
            course: chapter.level?.course?.slug ?? null,
            label: `${chapter.level?.slug ?? ''} · ${String(chapter.number).padStart(2, '0')} · ${titleFromJson(chapter.title_json, chapter.slug)}`
        }))
    };
}
export const CoursePatchInput = z.object({
    slug: z.string().min(1).optional(),
    title: LocalizedJson.optional(),
    description: LocalizedJson.optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional()
});
export const LevelPatchInput = z.object({
    courseId: Uuid.optional(),
    slug: z.string().min(1).optional(),
    title: LocalizedJson.optional(),
    description: LocalizedJson.optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional()
});
export const ChapterPatchInput = z.object({
    levelId: Uuid.optional(),
    categoryId: Uuid.nullable().optional(),
    seriesId: Uuid.nullable().optional(),
    slug: z.string().min(1).optional(),
    number: z.number().int().positive().optional(),
    title: LocalizedJson.optional(),
    description: LocalizedJson.optional(),
    durationSeconds: z.number().int().nonnegative().optional(),
    isPremium: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
    transcriptDe: z.string().nullable().optional(),
    notesJson: AnyJson.optional(),
    vocabularyJson: z.any().optional()
});
export const CategoryInput = z.object({
    courseId: Uuid,
    name: z.string().min(1),
    icon: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0)
});
export const CategoryPatchInput = CategoryInput.partial();
export const SeriesInput = z.object({
    courseId: Uuid,
    title: z.string().min(1),
    subtitle: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    coverUrl: z.string().nullable().optional(),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(true)
});
export const SeriesPatchInput = SeriesInput.partial();
export const VocabularyInput = z.object({
    chapterId: Uuid,
    german: z.string().min(1),
    english: z.string().nullable().optional(),
    meaning: AnyJson.optional(),
    sortOrder: z.number().int().default(0)
});
export const VocabularyPatchInput = VocabularyInput.partial();
export const NoteInput = z.object({
    chapterId: Uuid,
    languageCode: z.string().min(2),
    content: z.string().min(1)
});
export const NotePatchInput = NoteInput.partial();
export const VideoInput = z.object({
    chapterId: Uuid,
    title: z.string().min(1).default('Video Overview'),
    videoUrl: z.string().min(1),
    thumbnailUrl: z.string().nullable().optional(),
    durationSeconds: z.number().int().nonnegative().default(0),
    isEnabled: z.boolean().default(true),
    isPremium: z.boolean().default(false),
    showAsPreview: z.boolean().default(false),
    sortOrder: z.number().int().default(0)
});
export const VideoPatchInput = VideoInput.partial();
export const QuizInput = z.object({
    chapterId: Uuid,
    sourceTable: z.string().default('admin'),
    question: z.string().min(1),
    options: AnyJson,
    correctOption: z.string().min(1),
    explanation: z.string().nullable().optional(),
    sortOrder: z.number().int().default(0),
    isActive: z.boolean().default(true)
});
export const QuizPatchInput = QuizInput.partial();
export const AssetPatchInput = z.object({
    chapterId: Uuid.optional(),
    languageCode: z.string().nullable().optional(),
    assetType: z.string().min(1).optional(),
    storagePath: z.string().min(1).optional(),
    durationSeconds: z.number().int().nonnegative().nullable().optional(),
    sizeBytes: z.number().int().nonnegative().nullable().optional(),
    sha256: z.string().nullable().optional(),
    version: z.string().optional(),
    isActive: z.boolean().optional()
});
export async function updateCourse(id, input) {
    const parsed = CoursePatchInput.parse(input);
    const payload = snakePatch(parsed, { slug: 'slug', title: 'title_json', description: 'description_json', isActive: 'is_active', sortOrder: 'sort_order' });
    return one(supabaseAdmin.from('courses').update(payload).eq('id', id), 'course_update_failed');
}
export async function deleteCourse(id) { return deleted(supabaseAdmin.from('courses').delete().eq('id', id), 'course_delete_failed'); }
export async function updateLevel(id, input) {
    const parsed = LevelPatchInput.parse(input);
    const payload = snakePatch(parsed, { courseId: 'course_id', slug: 'slug', title: 'title_json', description: 'description_json', isActive: 'is_active', sortOrder: 'sort_order' });
    return one(supabaseAdmin.from('course_levels').update(payload).eq('id', id), 'level_update_failed');
}
export async function deleteLevel(id) { return deleted(supabaseAdmin.from('course_levels').delete().eq('id', id), 'level_delete_failed'); }
export async function updateChapter(id, input) {
    const parsed = ChapterPatchInput.parse(input);
    const payload = snakePatch(parsed, {
        levelId: 'level_id', categoryId: 'category_id', seriesId: 'series_id', slug: 'slug', number: 'number', title: 'title_json', description: 'description_json',
        durationSeconds: 'duration_seconds', isPremium: 'is_premium', isFeatured: 'is_featured', isActive: 'is_active', transcriptDe: 'transcript_de', notesJson: 'notes_json', vocabularyJson: 'vocabulary_json'
    });
    return one(supabaseAdmin.from('chapters').update(payload).eq('id', id), 'chapter_update_failed');
}
export async function deleteChapter(id) { return deleted(supabaseAdmin.from('chapters').delete().eq('id', id), 'chapter_delete_failed'); }
export async function createCategory(input) {
    const parsed = CategoryInput.parse(input);
    return one(supabaseAdmin.from('course_categories').insert({ course_id: parsed.courseId, name: parsed.name, icon: parsed.icon ?? null, description: parsed.description ?? null, is_active: parsed.isActive, sort_order: parsed.sortOrder }), 'category_create_failed');
}
export async function updateCategory(id, input) {
    const parsed = CategoryPatchInput.parse(input);
    const payload = snakePatch(parsed, { courseId: 'course_id', name: 'name', icon: 'icon', description: 'description', isActive: 'is_active', sortOrder: 'sort_order' });
    return one(supabaseAdmin.from('course_categories').update(payload).eq('id', id), 'category_update_failed');
}
export async function deleteCategory(id) { return deleted(supabaseAdmin.from('course_categories').delete().eq('id', id), 'category_delete_failed'); }
export async function createSeries(input) {
    const parsed = SeriesInput.parse(input);
    return one(supabaseAdmin.from('course_series').insert({ course_id: parsed.courseId, title: parsed.title, subtitle: parsed.subtitle ?? null, description: parsed.description ?? null, cover_url: parsed.coverUrl ?? null, is_featured: parsed.isFeatured, is_active: parsed.isActive }), 'series_create_failed');
}
export async function updateSeries(id, input) {
    const parsed = SeriesPatchInput.parse(input);
    const payload = snakePatch(parsed, { courseId: 'course_id', title: 'title', subtitle: 'subtitle', description: 'description', coverUrl: 'cover_url', isFeatured: 'is_featured', isActive: 'is_active' });
    return one(supabaseAdmin.from('course_series').update(payload).eq('id', id), 'series_update_failed');
}
export async function deleteSeries(id) { return deleted(supabaseAdmin.from('course_series').delete().eq('id', id), 'series_delete_failed'); }
export async function createVocabulary(input) {
    const parsed = VocabularyInput.parse(input);
    return one(supabaseAdmin.from('chapter_vocabulary').insert({ chapter_id: parsed.chapterId, german: parsed.german, english: parsed.english ?? null, meaning_json: parsed.meaning ?? {}, sort_order: parsed.sortOrder }), 'vocabulary_create_failed');
}
export async function updateVocabulary(id, input) {
    const parsed = VocabularyPatchInput.parse(input);
    const payload = snakePatch(parsed, { chapterId: 'chapter_id', german: 'german', english: 'english', meaning: 'meaning_json', sortOrder: 'sort_order' });
    return one(supabaseAdmin.from('chapter_vocabulary').update(payload).eq('id', id), 'vocabulary_update_failed');
}
export async function deleteVocabulary(id) { return deleted(supabaseAdmin.from('chapter_vocabulary').delete().eq('id', id), 'vocabulary_delete_failed'); }
export async function createNote(input) {
    const parsed = NoteInput.parse(input);
    return one(supabaseAdmin.from('chapter_notes').upsert({ chapter_id: parsed.chapterId, language_code: parsed.languageCode, content: parsed.content }, { onConflict: 'chapter_id,language_code' }), 'note_save_failed');
}
export async function updateNote(id, input) {
    const parsed = NotePatchInput.parse(input);
    const payload = snakePatch(parsed, { chapterId: 'chapter_id', languageCode: 'language_code', content: 'content' });
    return one(supabaseAdmin.from('chapter_notes').update(payload).eq('id', id), 'note_update_failed');
}
export async function deleteNote(id) { return deleted(supabaseAdmin.from('chapter_notes').delete().eq('id', id), 'note_delete_failed'); }
export async function createVideo(input) {
    const parsed = VideoInput.parse(input);
    return one(supabaseAdmin.from('chapter_videos').insert({ chapter_id: parsed.chapterId, title: parsed.title, video_url: parsed.videoUrl, thumbnail_url: parsed.thumbnailUrl ?? null, duration_seconds: parsed.durationSeconds, is_enabled: parsed.isEnabled, is_premium: parsed.isPremium, show_as_preview: parsed.showAsPreview, sort_order: parsed.sortOrder }), 'video_create_failed');
}
export async function updateVideo(id, input) {
    const parsed = VideoPatchInput.parse(input);
    const payload = snakePatch(parsed, { chapterId: 'chapter_id', title: 'title', videoUrl: 'video_url', thumbnailUrl: 'thumbnail_url', durationSeconds: 'duration_seconds', isEnabled: 'is_enabled', isPremium: 'is_premium', showAsPreview: 'show_as_preview', sortOrder: 'sort_order' });
    return one(supabaseAdmin.from('chapter_videos').update(payload).eq('id', id), 'video_update_failed');
}
export async function deleteVideo(id) { return deleted(supabaseAdmin.from('chapter_videos').delete().eq('id', id), 'video_delete_failed'); }
export async function createQuiz(input) {
    const parsed = QuizInput.parse(input);
    return one(supabaseAdmin.from('chapter_quiz_questions').insert({ chapter_id: parsed.chapterId, source_table: parsed.sourceTable, question: parsed.question, options_json: parsed.options, correct_option: parsed.correctOption, explanation: parsed.explanation ?? null, sort_order: parsed.sortOrder, is_active: parsed.isActive }), 'quiz_create_failed');
}
export async function updateQuiz(id, input) {
    const parsed = QuizPatchInput.parse(input);
    const payload = snakePatch(parsed, { chapterId: 'chapter_id', sourceTable: 'source_table', question: 'question', options: 'options_json', correctOption: 'correct_option', explanation: 'explanation', sortOrder: 'sort_order', isActive: 'is_active' });
    return one(supabaseAdmin.from('chapter_quiz_questions').update(payload).eq('id', id), 'quiz_update_failed');
}
export async function deleteQuiz(id) { return deleted(supabaseAdmin.from('chapter_quiz_questions').delete().eq('id', id), 'quiz_delete_failed'); }
export async function listChapterAssets(query) {
    let request = supabaseAdmin
        .from('chapter_assets')
        .select('id,chapter_id,language_code,asset_type,storage_path,public_url,duration_seconds,size_bytes,version,is_active,created_at,chapter:chapters(id,slug,number,title_json,level:course_levels(slug,title_json,course:courses(slug,title_json)))')
        .order('created_at', { ascending: false });
    if (query.chapterId)
        request = request.eq('chapter_id', query.chapterId);
    if (query.language)
        request = request.eq('language_code', query.language);
    if (query.assetType)
        request = request.eq('asset_type', query.assetType);
    const { data, error } = await request;
    if (error)
        throw new HttpError(500, 'chapter_assets_fetch_failed', error.message);
    return (data ?? []).map((asset) => ({
        ...asset,
        public_url: asset.public_url ?? publicUrl(asset.storage_path),
        chapter: asset.chapter ? {
            id: asset.chapter.id,
            slug: asset.chapter.slug,
            number: asset.chapter.number,
            title: titleFromJson(asset.chapter.title_json, asset.chapter.slug),
            level: asset.chapter.level?.slug ?? null,
            course: asset.chapter.level?.course?.slug ?? null
        } : null
    }));
}
export async function updateChapterAsset(id, input) {
    const parsed = AssetPatchInput.parse(input);
    const payload = snakePatch(parsed, { chapterId: 'chapter_id', languageCode: 'language_code', assetType: 'asset_type', storagePath: 'storage_path', durationSeconds: 'duration_seconds', sizeBytes: 'size_bytes', sha256: 'sha256', version: 'version', isActive: 'is_active' });
    if (payload.storage_path && !payload.public_url)
        payload.public_url = publicUrl(payload.storage_path);
    return one(supabaseAdmin.from('chapter_assets').update(payload).eq('id', id), 'chapter_asset_update_failed');
}
export async function deleteChapterAsset(id) { return deleted(supabaseAdmin.from('chapter_assets').delete().eq('id', id), 'chapter_asset_delete_failed'); }
