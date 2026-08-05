import { z } from 'zod';
import type { CourseLevelManifest } from '@deutschflow/shared';
import { randomUUID } from 'node:crypto';
import { execute, insertRow, row, rows, updateRow } from '../config/db.js';
import { HttpError } from '../utils/http.js';
import { publicUrl, uploadTextFile } from '../utils/storage.js';
import { getCourseBySlug, getLevels, hydrateChapters } from './chapterDataService.js';

const LocalizedJson = z.record(z.string(), z.string().nullable()).default({});
export const LanguageInput = z.object({ code:z.string().min(2).max(10), name:z.string().min(1), nativeName:z.string().optional().nullable(), isActive:z.boolean().default(true), sortOrder:z.number().int().default(0) });
export const CourseInput = z.object({ slug:z.string().min(1), title:LocalizedJson, description:LocalizedJson.optional(), isActive:z.boolean().default(true), sortOrder:z.number().int().default(0) });
export const LevelInput = z.object({ courseId:z.string().uuid(), slug:z.string().min(1), title:LocalizedJson, description:LocalizedJson.optional(), isActive:z.boolean().default(true), sortOrder:z.number().int().default(0) });
export const ChapterInput = z.object({ levelId:z.string().uuid(), slug:z.string().min(1), number:z.number().int().positive(), title:LocalizedJson, description:LocalizedJson.optional(), isActive:z.boolean().default(true), sortOrder:z.number().int().default(0) });
export const ChapterAssetInput = z.object({ chapterId:z.string().uuid(), languageCode:z.string().min(2).nullable().optional(), assetType:z.string().min(1), storagePath:z.string().min(1), durationSeconds:z.number().int().nonnegative().optional().nullable(), sizeBytes:z.number().int().nonnegative().optional().nullable(), sha256:z.string().optional().nullable(), version:z.string().default('1'), isActive:z.boolean().default(true) });

export async function listLanguages(){ return rows<any>('SELECT * FROM languages ORDER BY sort_order, code'); }
export async function upsertLanguage(input:z.infer<typeof LanguageInput>){
 const p=LanguageInput.parse(input); await execute(`INSERT INTO languages(code,name,native_name,is_active,sort_order) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),native_name=VALUES(native_name),is_active=VALUES(is_active),sort_order=VALUES(sort_order),updated_at=CURRENT_TIMESTAMP(6)`,[p.code,p.name,p.nativeName??null,p.isActive?1:0,p.sortOrder]); return row<any>('SELECT * FROM languages WHERE code=?',[p.code]);
}
export async function listCourses(){
 const courses=await rows<any>('SELECT * FROM courses ORDER BY sort_order');
 const [levels,categories,series]=await Promise.all([rows<any>('SELECT * FROM course_levels ORDER BY sort_order'),rows<any>('SELECT * FROM course_categories ORDER BY sort_order'),rows<any>('SELECT * FROM course_series ORDER BY title')]);
 return courses.map(c=>({...c,levels:levels.filter(x=>x.course_id===c.id),categories:categories.filter(x=>x.course_id===c.id),series:series.filter(x=>x.course_id===c.id)}));
}
export async function createCourse(input:z.infer<typeof CourseInput>){ const p=CourseInput.parse(input); return insertRow('courses',{slug:p.slug,title_json:p.title,description_json:p.description??{},is_active:p.isActive,sort_order:p.sortOrder}); }
export async function createLevel(input:z.infer<typeof LevelInput>){ const p=LevelInput.parse(input); return insertRow('course_levels',{course_id:p.courseId,slug:p.slug,title_json:p.title,description_json:p.description??{},is_active:p.isActive,sort_order:p.sortOrder}); }
export async function createChapter(input:z.infer<typeof ChapterInput>){ const p=ChapterInput.parse(input); return insertRow('chapters',{level_id:p.levelId,slug:p.slug,number:p.number,title_json:p.title,description_json:p.description??{},notes_json:{},is_active:p.isActive,sort_order:p.sortOrder}); }
export async function saveChapterAsset(input:z.infer<typeof ChapterAssetInput>){
 const p=ChapterAssetInput.parse(input); const lang=p.languageCode??null;
 const existing=await row<any>('SELECT * FROM chapter_assets WHERE chapter_id=? AND asset_type=? AND ((language_code=? ) OR (language_code IS NULL AND ? IS NULL)) LIMIT 1',[p.chapterId,p.assetType,lang,lang]);
 const payload={chapter_id:p.chapterId,language_code:lang,asset_type:p.assetType,storage_path:p.storagePath,public_url:publicUrl(p.storagePath),duration_seconds:p.durationSeconds??null,size_bytes:p.sizeBytes??null,sha256:p.sha256??null,version:p.version,is_active:p.isActive};
 return existing?updateRow('chapter_assets',existing.id,payload):insertRow('chapter_assets',payload);
}

export async function buildCourseLevelManifest(courseSlug:string,levelSlug:string,languageCode:string){
 const course=await getCourseBySlug(courseSlug,true); if(!course) throw new HttpError(404,'course_not_found');
 const level=(await getLevels(course.id,levelSlug,true))[0]; if(!level) throw new HttpError(404,'level_not_found');
 const chapters=await hydrateChapters('c.level_id=?',[level.id],true);
 const version=new Date().toISOString();
 const manifest:CourseLevelManifest={module:'course_level',schemaVersion:1,courseSlug,levelSlug,languageCode,version,chapters:chapters.map((chapter:any)=>({
   id:chapter.id,slug:chapter.slug,number:chapter.number,title:chapter.title_json??{},description:chapter.description_json??{},durationSeconds:chapter.duration_seconds??0,isPremium:Boolean(chapter.is_premium),isFeatured:Boolean(chapter.is_featured),category:chapter.category??null,series:chapter.series??null,
   translations:(chapter.chapter_translations??[]).filter((x:any)=>x.language_code===languageCode),notes:(chapter.chapter_notes??[]).filter((x:any)=>x.language_code===languageCode),transcripts:(chapter.chapter_transcripts??[]).filter((x:any)=>x.language_code===languageCode||x.language_code==='de'),vocabulary:chapter.chapter_vocabulary??[],videos:(chapter.chapter_videos??[]).filter((x:any)=>x.is_enabled),quiz:(chapter.chapter_quiz_questions??[]).filter((x:any)=>x.is_active),legacy:{transcriptDe:chapter.transcript_de??null,notes:chapter.notes_json??{},vocabulary:chapter.vocabulary_json??null},assets:(chapter.chapter_assets??[]).filter((a:any)=>a.is_active&&(!a.language_code||a.language_code===languageCode||a.asset_type==='cover')).map((a:any)=>({key:a.asset_type,url:a.public_url||publicUrl(a.storage_path),storagePath:a.storage_path,sha256:a.sha256,sizeBytes:a.size_bytes,version:a.version}))
 }))};
 const storagePath=`manifests/courses/${courseSlug}/${levelSlug}/${languageCode}/manifest.json`; const url=await uploadTextFile(storagePath,JSON.stringify(manifest,null,2),'application/json');
 await insertRow('content_releases',{module:'course_level',version,language_code:languageCode,manifest_json:manifest,manifest_storage_path:storagePath,manifest_public_url:url,is_active:true,published_at:new Date()},true);
 return {manifest,storagePath,url};
}
