import { Router } from 'express';
import multer from 'multer';
import { asyncHandler, HttpError } from '../utils/http.js';
import { rows, row, pingDatabase } from '../config/db.js';
import { configWarnings, env } from '../config/env.js';
import { buildCourseLevelManifest } from '../services/courseService.js';
import { getActiveLiDCatalog, getPublishedLiDManifest } from '../services/lidService.js';
import { getMobileCategories, getMobileLessonDetail, getMobileLessons, getMobileLevels, getMobileSeries } from '../services/mobileApiService.js';
import { getReadingPracticeAsset, recognizeReadingAudio } from '../services/speechPracticeService.js';

export const publicRoutes=Router();
const VERSION='V88_MOBILE_AUDIO_RESUME_CORE_2026_08_11';
publicRoutes.get('/health',asyncHandler(async(_req,res)=>{let database:any={ok:false};try{database=await pingDatabase();}catch(e){database={ok:false,error:e instanceof Error?e.message:String(e)}}res.json({ok:database.ok,service:'deutschflow-api',version:VERSION,time:new Date().toISOString(),database,configWarnings});}));
publicRoutes.get('/__version',(_req,res)=>{res.setHeader('Cache-Control','no-store');res.json({app:'DeutschFlow',version:VERSION,database:'mysql'});});
function sendPretty(req:any,res:any,payload:unknown){res.setHeader('Cache-Control','public, max-age=30, stale-while-revalidate=300');if(String(req.query.pretty??'')==='1'){res.type('application/json').send(JSON.stringify(payload,null,2));return;}res.json(payload);}
publicRoutes.get('/api/health.php',asyncHandler(async(_req,res)=>res.json({ok:true,success:true,service:'deutschflow-api',database:await pingDatabase(),time:new Date().toISOString(),configWarnings})));
publicRoutes.get('/api/lessons.php',asyncHandler(async(req,res)=>sendPretty(req,res,await getMobileLessons({lang:req.query.lang,level:req.query.level,legacy:req.query.legacy}))));
publicRoutes.get('/v1/mobile/lessons',asyncHandler(async(req,res)=>{const started=Date.now();const payload=await getMobileLessons({lang:req.query.lang,level:req.query.level,legacy:req.query.legacy});const elapsed=Date.now()-started;res.setHeader('Cache-Control','public, max-age=30, stale-while-revalidate=300');res.setHeader('Server-Timing',`app;dur=${elapsed}`);res.setHeader('X-DeutschFlow-API-Ms',String(elapsed));res.json(payload);}));
publicRoutes.get('/api/lesson-detail.php',asyncHandler(async(req,res)=>sendPretty(req,res,await getMobileLessonDetail({id:req.query.id,lang:req.query.lang,section:req.query.section,fallback:req.query.fallback}))));
publicRoutes.get('/api/categories.php',asyncHandler(async(req,res)=>sendPretty(req,res,await getMobileCategories())));
publicRoutes.get('/api/levels.php',asyncHandler(async(req,res)=>sendPretty(req,res,await getMobileLevels())));
publicRoutes.get('/api/series.php',asyncHandler(async(req,res)=>sendPretty(req,res,await getMobileSeries())));

const speechUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2_500_000, files: 1 }
});
const speechRateWindows = new Map<string, { count: number; resetAt: number }>();
function allowSpeechRequest(ip: string) {
  const now = Date.now();
  const key = ip || 'unknown';
  const current = speechRateWindows.get(key);
  if (!current || current.resetAt <= now) {
    speechRateWindows.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (current.count >= 40) return false;
  current.count += 1;
  return true;
}

publicRoutes.get('/api/practice/speech-status.php', (_req,res)=>{
  const credentialsConfigured = Boolean(env.GOOGLE_SERVICE_ACCOUNT_JSON.trim() || env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64.trim() || process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const chirpUsesLocalPlaybackRate = /-Chirp3-HD-/i.test(env.GOOGLE_TTS_VOICE);
  res.setHeader('Cache-Control','no-store');
  res.json({
    success:true,
    enabled:env.GOOGLE_SPEECH_ENABLED,
    credentialsConfigured,
    voice:env.GOOGLE_TTS_VOICE,
    playbackRate:env.GOOGLE_TTS_SPEAKING_RATE,
    synthesisRateSentToGoogle:chirpUsesLocalPlaybackRate ? null : env.GOOGLE_TTS_SPEAKING_RATE,
    chirpUsesLocalPlaybackRate,
    version:VERSION
  });
});

publicRoutes.get('/api/practice/reading.php', asyncHandler(async(req,res)=>{
  const lessonId=String(req.query.lessonId??req.query.id??'').trim();
  if(!lessonId) throw new HttpError(400,'lesson_id_required');
  res.setHeader('Cache-Control','public, max-age=3600');
  res.json({success:true,reading:await getReadingPracticeAsset(lessonId)});
}));

publicRoutes.post('/api/practice/speech-recognize.php', speechUpload.single('audio'), asyncHandler(async(req:any,res)=>{
  if(!allowSpeechRequest(String(req.ip??req.socket?.remoteAddress??''))) throw new HttpError(429,'speech_rate_limit');
  if(!req.file?.buffer) throw new HttpError(400,'audio_required');
  const expectedText=String(req.body?.expectedText??'').trim();
  if(!expectedText) throw new HttpError(400,'expected_text_required');
  if(expectedText.length>500) throw new HttpError(400,'expected_text_too_long');
  const recognition=await recognizeReadingAudio(req.file.buffer,expectedText,String(req.file.mimetype??''),String(req.file.originalname??''));
  res.setHeader('Cache-Control','no-store');
  res.json({success:true,language:'de-DE',...recognition});
}));

publicRoutes.get('/api/index.php',asyncHandler(async(req,res)=>{const endpoint=String(req.query.endpoint??'').trim().toLowerCase();if(endpoint==='lessons')return sendPretty(req,res,await getMobileLessons({lang:req.query.lang,level:req.query.level,legacy:req.query.legacy}));if(endpoint==='lesson-detail'||endpoint==='lesson_detail')return sendPretty(req,res,await getMobileLessonDetail({id:req.query.id,lang:req.query.lang,section:req.query.section,fallback:req.query.fallback}));if(endpoint==='categories')return sendPretty(req,res,await getMobileCategories());if(endpoint==='levels')return sendPretty(req,res,await getMobileLevels());if(endpoint==='series')return sendPretty(req,res,await getMobileSeries());throw new HttpError(404,'endpoint_not_found');}));
publicRoutes.get('/v1/languages',asyncHandler(async(_req,res)=>res.json({languages:await rows<any>('SELECT * FROM languages ORDER BY sort_order')})));

async function coursesWithLevels(){const courses=await rows<any>('SELECT * FROM courses WHERE is_active=1 ORDER BY sort_order');const levels=await rows<any>('SELECT * FROM course_levels WHERE is_active=1 ORDER BY sort_order');return courses.map(c=>({...c,levels:levels.filter(l=>l.course_id===c.id).map(l=>({slug:l.slug,title_json:l.title_json,description_json:l.description_json,is_active:Boolean(l.is_active)}))}));}
publicRoutes.get('/v1/catalog',asyncHandler(async(req,res)=>{const lang=String(req.query.lang??'te');res.json({schemaVersion:1,requestedLanguage:lang,languages:await rows<any>('SELECT * FROM languages WHERE is_active=1 ORDER BY sort_order'),courses:await coursesWithLevels(),lidManifestAvailable:Boolean(await getPublishedLiDManifest(lang))});}));
publicRoutes.get('/v1/app/bootstrap',asyncHandler(async(req,res)=>{const lang=String(req.query.lang??'te');const manifest=await getPublishedLiDManifest(lang);res.json({schemaVersion:1,serverTime:new Date().toISOString(),requestedLanguage:lang,languages:await rows<any>('SELECT * FROM languages WHERE is_active=1 ORDER BY sort_order'),courses:await rows<any>('SELECT slug,title_json,is_active FROM courses WHERE is_active=1 ORDER BY sort_order'),modules:{german:{enabled:true},lid:{enabled:Boolean(manifest),manifestAvailable:Boolean(manifest)}}});}));
publicRoutes.get('/v1/courses',asyncHandler(async(_req,res)=>res.json({courses:await coursesWithLevels()})));
publicRoutes.get('/v1/courses/:courseSlug/levels/:levelSlug/manifest',asyncHandler(async(req,res)=>res.json((await buildCourseLevelManifest(req.params.courseSlug,req.params.levelSlug,String(req.query.lang??'te'))).manifest)));
publicRoutes.get('/v1/lid/manifest',asyncHandler(async(req,res)=>{const m=await getPublishedLiDManifest(String(req.query.lang??'te'));if(!m)throw new HttpError(404,'lid_manifest_not_published');res.json(m);}));
publicRoutes.get('/v1/lid/catalog',asyncHandler(async(_req,res)=>{const catalog=await getActiveLiDCatalog();if(!catalog)return res.json({questions:[],topics:[]});const cards=await rows<any>('SELECT * FROM lid_cards WHERE catalog_id=? ORDER BY part,number',[catalog.id]);const questions=cards.map((c:any)=>({id:`lid-${String(c.number).padStart(3,'0')}`,catalogId:c.catalog_key,part:c.part,state:c.state??null,topic:c.learn_json?.title?.de??(c.part==='state'?'Bundesland':'Deutschland'),topicEn:c.learn_json?.title?.en??'',questionDe:c.question_json?.de??'',choicesDe:(c.choices_json??[]).map((x:any)=>({key:String(x.key??'').toUpperCase(),text:x.de??''})),correctKey:String(c.answer_key??'').toUpperCase(),hintEn:c.learn_json?.remember?.en??'',explanationEn:c.learn_json?.short_explanation?.en??'',whyOthersWrongEn:{},memoryTrickEn:c.learn_json?.remember?.en??'',requiresImage:Boolean(c.requires_image),imageUrl:null}));const topicsMap=new Map<string,any>();for(const q of questions){const k=q.topic||'General';const t=topicsMap.get(k)||{id:k.toLowerCase().replace(/[^a-z0-9]+/g,'-'),title:k,subtitle:q.topicEn||'',total:0,completed:0,icon:'book'};t.total++;topicsMap.set(k,t);}res.json({catalog:{id:catalog.id,version:catalog.version,totalCards:catalog.total_cards},questions,topics:[...topicsMap.values()]});}));
