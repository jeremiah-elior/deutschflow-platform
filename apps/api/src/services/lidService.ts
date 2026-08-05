import { gzipSync } from 'node:zlib';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { LiDStudyFileSchema, type LiDManifest } from '@deutschflow/shared';
import { execute, insertRow, row, rows, updateRow, withTransaction } from '../config/db.js';
import { HttpError } from '../utils/http.js';
import { downloadStorageText, publicUrl, uploadTextFile } from '../utils/storage.js';
import { sha256Buffer } from '../utils/hash.js';

export const ImportLiDJsonInput = z.object({ storagePath:z.string().min(1), version:z.string().min(1).optional(), title:z.string().optional() });
export const LiDAssetInput = z.object({ catalogId:z.string().uuid().optional().nullable(), assetType:z.enum(['image','intro_video','tips_audio','sample_json','exam_info','ui_asset','audio_track']), languageCode:z.string().optional().nullable(), key:z.string().min(1), storagePath:z.string().min(1), sizeBytes:z.number().int().nonnegative().optional().nullable(), sha256:z.string().optional().nullable(), version:z.string().default('1'), isActive:z.boolean().default(true) });

export async function listLiDCatalogs(){ return rows<any>('SELECT * FROM lid_catalogs ORDER BY created_at DESC'); }
export async function getActiveLiDCatalog(){ return row<any>('SELECT * FROM lid_catalogs WHERE is_active=1 ORDER BY created_at DESC LIMIT 1'); }

export async function importLiDJson(input:z.infer<typeof ImportLiDJsonInput>,actorId?:string){
 const parsed=ImportLiDJsonInput.parse(input); const raw=await downloadStorageText(parsed.storagePath); const studyFile=LiDStudyFileSchema.parse(JSON.parse(raw));
 const totalCards=studyFile.metadata.total_cards??studyFile.metadata.question_count??studyFile.cards.length;
 const generalCards=studyFile.metadata.general_cards??studyFile.metadata.general_question_count??studyFile.cards.filter(c=>c.part==='general').length;
 const stateCards=studyFile.metadata.state_cards??studyFile.metadata.state_question_count??studyFile.cards.filter(c=>c.part==='state').length;
 const version=parsed.version??studyFile.metadata.catalog_stand??new Date().toISOString().slice(0,10); const catalogId=randomUUID();
 await execute('UPDATE lid_catalogs SET is_active=0');
 const catalog=await insertRow<any>('lid_catalogs',{id:catalogId,version,title:parsed.title??studyFile.metadata.title??'BAMF 2025 Study Material',total_cards:totalCards,general_cards:generalCards,state_cards:stateCards,source_storage_path:parsed.storagePath,source_file_url:publicUrl(parsed.storagePath),schema_version:'2',metadata_json:studyFile.metadata,is_active:true,created_by:actorId??null},false);
 const mapped=studyFile.cards.map(card=>[randomUUID(),catalogId,card.catalog_id,card.part,card.state??null,card.number,card.page??null,JSON.stringify(card.question),JSON.stringify(card.choices),card.answer,JSON.stringify(card.correct_choice),JSON.stringify(card.learn??{}),card.study_material?JSON.stringify(card.study_material):null,card.requires_image?1:0,card.image_note??null]);
 await withTransaction(async conn=>{ for(let i=0;i<mapped.length;i+=200){const batch=mapped.slice(i,i+200);const ph=batch.map(()=>'(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',');await conn.query(`INSERT INTO lid_cards(id,catalog_id,catalog_key,part,state,number,page,question_json,choices_json,answer_key,correct_choice_json,learn_json,study_material_json,requires_image,image_note) VALUES ${ph}`,batch.flat());} });
 return {catalog,importedCards:mapped.length};
}

export async function saveLiDAsset(input:z.infer<typeof LiDAssetInput>){
 const p=LiDAssetInput.parse(input); const catalogId=p.catalogId??(await getActiveLiDCatalog())?.id??null;
 const existing=await row<any>('SELECT * FROM lid_assets WHERE ((catalog_id=? ) OR (catalog_id IS NULL AND ? IS NULL)) AND asset_type=? AND ((language_code=? ) OR (language_code IS NULL AND ? IS NULL)) AND asset_key=? LIMIT 1',[catalogId,catalogId,p.assetType,p.languageCode??null,p.languageCode??null,p.key]);
 const payload={catalog_id:catalogId,asset_type:p.assetType,language_code:p.languageCode??null,asset_key:p.key,storage_path:p.storagePath,public_url:publicUrl(p.storagePath),size_bytes:p.sizeBytes??null,sha256:p.sha256??null,version:p.version,is_active:p.isActive};
 return existing?updateRow('lid_assets',existing.id,payload):insertRow('lid_assets',payload);
}

function getLocalizedPack(cards:any[],lang:string){return{metadata:{generated_at:new Date().toISOString(),lang,total_cards:cards.length,note:'German official question text is always included. Learning/help fields include available localized content.'},cards:cards.map(card=>({id:card.number,catalog_id:card.catalog_key,part:card.part,state:card.state,number:card.number,page:card.page,question:{de:card.question_json?.de??null,en:card.question_json?.en??null,[lang]:card.question_json?.[lang]??null},choices:(card.choices_json??[]).map((choice:any)=>({key:choice.key,de:choice.de,en:choice.en??null,[lang]:choice?.[lang]??null})),answer:card.answer_key,correct_choice:card.correct_choice_json,requires_image:Boolean(card.requires_image),image_note:card.image_note,learn:card.learn_json,study_material:card.study_material_json}))};}

export async function publishLiDManifest(languageCode='te'){
 const catalog=await getActiveLiDCatalog(); if(!catalog) throw new HttpError(404,'no_active_lid_catalog'); const cards=await rows<any>('SELECT * FROM lid_cards WHERE catalog_id=? ORDER BY part,number',[catalog.id]);
 const pack=getLocalizedPack(cards,languageCode);const jsonBuffer=Buffer.from(JSON.stringify(pack));const gzBuffer=gzipSync(jsonBuffer);const versionSafe=String(catalog.version).replace(/[^a-zA-Z0-9._-]/g,'_');const cardsPath=`lid/${versionSafe}/cards_${languageCode}.json.gz`;const cardsUrl=await uploadTextFile(cardsPath,gzBuffer,'application/gzip');
 const assets=await rows<any>('SELECT * FROM lid_assets WHERE is_active=1 AND (catalog_id=? OR catalog_id IS NULL)',[catalog.id]); const media:Record<string,any>={};const samples:Record<string,any>={};const imageItems:Record<string,string>={};let examInfo:any=null;
 for(const asset of assets){const descriptor={key:asset.asset_key,url:asset.public_url??publicUrl(asset.storage_path),storagePath:asset.storage_path,sha256:asset.sha256,sizeBytes:asset.size_bytes,version:asset.version};if(asset.asset_type==='image')imageItems[asset.asset_key]=asset.storage_path.split('/').pop();if(asset.asset_type==='intro_video')media.introVideo=descriptor;if(asset.asset_type==='tips_audio')media[`tipsAudio_${asset.language_code??'default'}`]=descriptor;if(asset.asset_type==='audio_track')media[`audioTrack_${asset.asset_key}`]=descriptor;if(asset.asset_type==='sample_json')samples[asset.asset_key]=descriptor;if(asset.asset_type==='exam_info')examInfo=descriptor;}
 const manifest:LiDManifest={module:'lid_test',schemaVersion:2,version:catalog.version,languages:[languageCode],catalog:{id:catalog.id,totalCards:catalog.total_cards,generalCards:catalog.general_cards,stateCards:catalog.state_cards},cards:{key:`cards_${languageCode}`,url:cardsUrl,storagePath:cardsPath,sha256:sha256Buffer(gzBuffer),sizeBytes:gzBuffer.byteLength,contentType:'application/gzip',version:catalog.version},media,images:{baseUrl:publicUrl('lid/images/').replace(/%2F/g,'/'),items:imageItems},samples,examInfo};
 const manifestPath=`lid/${versionSafe}/manifest_${languageCode}.json`;const manifestUrl=await uploadTextFile(manifestPath,JSON.stringify(manifest,null,2),'application/json');await insertRow('content_releases',{module:'lid_test',version:catalog.version,language_code:languageCode,manifest_json:manifest,manifest_storage_path:manifestPath,manifest_public_url:manifestUrl,is_active:true});return{manifest,manifestPath,manifestUrl,cardsPath,cardsUrl};
}

export async function getPublishedLiDManifest(languageCode='te'){const data=await row<any>('SELECT * FROM content_releases WHERE module=? AND language_code=? AND is_active=1 ORDER BY published_at DESC LIMIT 1',['lid_test',languageCode]);return data?.manifest_json??null;}
