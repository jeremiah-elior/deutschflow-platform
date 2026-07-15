import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../utils/http.js';
import { publicUrl, uploadTextFile } from '../utils/storage.js';
const LocalizedJson = z.record(z.string(), z.string().nullable()).default({});
export const LanguageInput = z.object({
    code: z.string().min(2).max(10),
    name: z.string().min(1),
    nativeName: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0)
});
export const CourseInput = z.object({
    slug: z.string().min(1),
    title: LocalizedJson,
    description: LocalizedJson.optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0)
});
export const LevelInput = z.object({
    courseId: z.string().uuid(),
    slug: z.string().min(1),
    title: LocalizedJson,
    description: LocalizedJson.optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0)
});
export const ChapterInput = z.object({
    levelId: z.string().uuid(),
    slug: z.string().min(1),
    number: z.number().int().positive(),
    title: LocalizedJson,
    description: LocalizedJson.optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0)
});
export const ChapterAssetInput = z.object({
    chapterId: z.string().uuid(),
    languageCode: z.string().min(2),
    assetType: z.string().min(1),
    storagePath: z.string().min(1),
    durationSeconds: z.number().int().nonnegative().optional().nullable(),
    sizeBytes: z.number().int().nonnegative().optional().nullable(),
    sha256: z.string().optional().nullable(),
    version: z.string().default('1'),
    isActive: z.boolean().default(true)
});
export async function listLanguages() {
    const { data, error } = await supabaseAdmin.from('languages').select('*').order('sort_order');
    if (error)
        throw new HttpError(500, 'languages_fetch_failed', error.message);
    return data;
}
export async function upsertLanguage(input) {
    const parsed = LanguageInput.parse(input);
    const payload = {
        code: parsed.code,
        name: parsed.name,
        native_name: parsed.nativeName ?? null,
        is_active: parsed.isActive,
        sort_order: parsed.sortOrder
    };
    const { data, error } = await supabaseAdmin.from('languages').upsert(payload, { onConflict: 'code' }).select().single();
    if (error)
        throw new HttpError(500, 'language_save_failed', error.message);
    return data;
}
export async function listCourses() {
    const { data, error } = await supabaseAdmin
        .from('courses')
        .select('*, levels:course_levels(*), categories:course_categories(*), series:course_series(*)')
        .order('sort_order');
    if (error)
        throw new HttpError(500, 'courses_fetch_failed', error.message);
    return data;
}
export async function createCourse(input) {
    const parsed = CourseInput.parse(input);
    const { data, error } = await supabaseAdmin.from('courses').insert({
        slug: parsed.slug,
        title_json: parsed.title,
        description_json: parsed.description ?? {},
        is_active: parsed.isActive,
        sort_order: parsed.sortOrder
    }).select().single();
    if (error)
        throw new HttpError(500, 'course_create_failed', error.message);
    return data;
}
export async function createLevel(input) {
    const parsed = LevelInput.parse(input);
    const { data, error } = await supabaseAdmin.from('course_levels').insert({
        course_id: parsed.courseId,
        slug: parsed.slug,
        title_json: parsed.title,
        description_json: parsed.description ?? {},
        is_active: parsed.isActive,
        sort_order: parsed.sortOrder
    }).select().single();
    if (error)
        throw new HttpError(500, 'level_create_failed', error.message);
    return data;
}
export async function createChapter(input) {
    const parsed = ChapterInput.parse(input);
    const { data, error } = await supabaseAdmin.from('chapters').insert({
        level_id: parsed.levelId,
        slug: parsed.slug,
        number: parsed.number,
        title_json: parsed.title,
        description_json: parsed.description ?? {},
        is_active: parsed.isActive,
        sort_order: parsed.sortOrder
    }).select().single();
    if (error)
        throw new HttpError(500, 'chapter_create_failed', error.message);
    return data;
}
export async function saveChapterAsset(input) {
    const parsed = ChapterAssetInput.parse(input);
    const { data, error } = await supabaseAdmin.from('chapter_assets').upsert({
        chapter_id: parsed.chapterId,
        language_code: parsed.languageCode,
        asset_type: parsed.assetType,
        storage_path: parsed.storagePath,
        public_url: publicUrl(parsed.storagePath),
        duration_seconds: parsed.durationSeconds ?? null,
        size_bytes: parsed.sizeBytes ?? null,
        sha256: parsed.sha256 ?? null,
        version: parsed.version,
        is_active: parsed.isActive
    }, { onConflict: 'chapter_id,asset_type,language_code' }).select().single();
    if (error)
        throw new HttpError(500, 'chapter_asset_save_failed', error.message);
    return data;
}
export async function buildCourseLevelManifest(courseSlug, levelSlug, languageCode) {
    const { data: course, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('id,slug')
        .eq('slug', courseSlug)
        .eq('is_active', true)
        .single();
    if (courseError || !course)
        throw new HttpError(404, 'course_not_found');
    const { data: level, error: levelError } = await supabaseAdmin
        .from('course_levels')
        .select('id,slug')
        .eq('course_id', course.id)
        .eq('slug', levelSlug)
        .eq('is_active', true)
        .single();
    if (levelError || !level)
        throw new HttpError(404, 'level_not_found');
    const { data: chapters, error: chapterError } = await supabaseAdmin
        .from('chapters')
        .select('id,slug,number,title_json,description_json,duration_seconds,is_premium,is_featured,transcript_de,notes_json,vocabulary_json,category:course_categories(id,name,icon,description),series:course_series(id,title,subtitle,cover_url),chapter_assets(*),chapter_translations(*),chapter_notes(*),chapter_transcripts(*),chapter_vocabulary(*,translations:chapter_vocabulary_translations(*)),chapter_videos(*),chapter_quiz_questions(*)')
        .eq('level_id', level.id)
        .eq('is_active', true)
        .order('number');
    if (chapterError)
        throw new HttpError(500, 'chapters_fetch_failed', chapterError.message);
    const version = new Date().toISOString();
    const manifest = {
        module: 'course_level',
        schemaVersion: 1,
        courseSlug,
        levelSlug,
        languageCode,
        version,
        chapters: (chapters ?? []).map((chapter) => ({
            id: chapter.id,
            slug: chapter.slug,
            number: chapter.number,
            title: chapter.title_json ?? {},
            description: chapter.description_json ?? {},
            durationSeconds: chapter.duration_seconds ?? 0,
            isPremium: Boolean(chapter.is_premium),
            isFeatured: Boolean(chapter.is_featured),
            category: chapter.category ?? null,
            series: chapter.series ?? null,
            translations: (chapter.chapter_translations ?? []).filter((item) => item.language_code === languageCode),
            notes: (chapter.chapter_notes ?? []).filter((item) => item.language_code === languageCode),
            transcripts: (chapter.chapter_transcripts ?? []).filter((item) => item.language_code === languageCode || item.language_code === 'de'),
            vocabulary: chapter.chapter_vocabulary ?? [],
            videos: (chapter.chapter_videos ?? []).filter((item) => item.is_enabled),
            quiz: (chapter.chapter_quiz_questions ?? []).filter((item) => item.is_active),
            legacy: {
                transcriptDe: chapter.transcript_de ?? null,
                notes: chapter.notes_json ?? {},
                vocabulary: chapter.vocabulary_json ?? null
            },
            assets: (chapter.chapter_assets ?? [])
                .filter((asset) => asset.is_active && (!asset.language_code || asset.language_code === languageCode || asset.asset_type === 'cover'))
                .map((asset) => ({
                key: asset.asset_type,
                url: asset.public_url ?? publicUrl(asset.storage_path),
                storagePath: asset.storage_path,
                sha256: asset.sha256,
                sizeBytes: asset.size_bytes,
                version: asset.version
            }))
        }))
    };
    const storagePath = `manifests/courses/${courseSlug}/${levelSlug}/${languageCode}/manifest.json`;
    const url = await uploadTextFile(storagePath, JSON.stringify(manifest, null, 2), 'application/json');
    const { error: releaseError } = await supabaseAdmin.from('content_releases').insert({
        module: 'course_level',
        version,
        language_code: languageCode,
        manifest_json: manifest,
        manifest_storage_path: storagePath,
        manifest_public_url: url,
        is_active: true
    });
    if (releaseError)
        throw new HttpError(500, 'release_save_failed', releaseError.message);
    return { manifest, storagePath, url };
}
