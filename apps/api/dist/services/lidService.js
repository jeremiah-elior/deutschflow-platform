import { gzipSync } from 'node:zlib';
import { z } from 'zod';
import { LiDStudyFileSchema } from '@deutschflow/shared';
import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../utils/http.js';
import { downloadStorageText, publicUrl, uploadTextFile } from '../utils/storage.js';
import { sha256Buffer } from '../utils/hash.js';
export const ImportLiDJsonInput = z.object({
    storagePath: z.string().min(1),
    version: z.string().min(1).optional(),
    title: z.string().optional()
});
export const LiDAssetInput = z.object({
    catalogId: z.string().uuid().optional().nullable(),
    assetType: z.enum(['image', 'intro_video', 'tips_audio', 'sample_json', 'exam_info', 'ui_asset', 'audio_track']),
    languageCode: z.string().optional().nullable(),
    key: z.string().min(1),
    storagePath: z.string().min(1),
    sizeBytes: z.number().int().nonnegative().optional().nullable(),
    sha256: z.string().optional().nullable(),
    version: z.string().default('1'),
    isActive: z.boolean().default(true)
});
export async function listLiDCatalogs() {
    const { data, error } = await supabaseAdmin.from('lid_catalogs').select('*').order('created_at', { ascending: false });
    if (error)
        throw new HttpError(500, 'lid_catalogs_fetch_failed', error.message);
    return data;
}
export async function getActiveLiDCatalog() {
    const { data, error } = await supabaseAdmin
        .from('lid_catalogs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error)
        throw new HttpError(500, 'active_lid_catalog_fetch_failed', error.message);
    return data;
}
export async function importLiDJson(input, actorId) {
    const parsed = ImportLiDJsonInput.parse(input);
    const raw = await downloadStorageText(parsed.storagePath);
    const json = JSON.parse(raw);
    const studyFile = LiDStudyFileSchema.parse(json);
    const totalCards = studyFile.metadata.total_cards ?? studyFile.metadata.question_count ?? studyFile.cards.length;
    const generalCards = studyFile.metadata.general_cards ?? studyFile.metadata.general_question_count ?? studyFile.cards.filter((c) => c.part === 'general').length;
    const stateCards = studyFile.metadata.state_cards ?? studyFile.metadata.state_question_count ?? studyFile.cards.filter((c) => c.part === 'state').length;
    const version = parsed.version ?? studyFile.metadata.catalog_stand ?? new Date().toISOString().slice(0, 10);
    const { data: catalog, error: catalogError } = await supabaseAdmin
        .from('lid_catalogs')
        .insert({
        version,
        title: parsed.title ?? studyFile.metadata.title ?? 'BAMF 2025 Study Material',
        total_cards: totalCards,
        general_cards: generalCards,
        state_cards: stateCards,
        source_storage_path: parsed.storagePath,
        source_file_url: publicUrl(parsed.storagePath),
        schema_version: '2',
        metadata_json: studyFile.metadata,
        is_active: true,
        created_by: actorId ?? null
    })
        .select()
        .single();
    if (catalogError || !catalog)
        throw new HttpError(500, 'lid_catalog_create_failed', catalogError?.message);
    await supabaseAdmin.from('lid_catalogs').update({ is_active: false }).neq('id', catalog.id);
    const rows = studyFile.cards.map((card) => ({
        catalog_id: catalog.id,
        catalog_key: card.catalog_id,
        part: card.part,
        state: card.state,
        number: card.number,
        page: card.page ?? null,
        question_json: card.question,
        choices_json: card.choices,
        answer_key: card.answer,
        correct_choice_json: card.correct_choice,
        learn_json: card.learn,
        study_material_json: card.study_material ?? null,
        requires_image: card.requires_image,
        image_note: card.image_note ?? null
    }));
    for (let i = 0; i < rows.length; i += 500) {
        const batch = rows.slice(i, i + 500);
        const { error } = await supabaseAdmin.from('lid_cards').insert(batch);
        if (error)
            throw new HttpError(500, 'lid_cards_insert_failed', error.message);
    }
    return { catalog, importedCards: rows.length };
}
export async function saveLiDAsset(input) {
    const parsed = LiDAssetInput.parse(input);
    const activeCatalog = parsed.catalogId ? { id: parsed.catalogId } : await getActiveLiDCatalog();
    const { data, error } = await supabaseAdmin.from('lid_assets').upsert({
        catalog_id: activeCatalog?.id ?? null,
        asset_type: parsed.assetType,
        language_code: parsed.languageCode ?? null,
        key: parsed.key,
        storage_path: parsed.storagePath,
        public_url: publicUrl(parsed.storagePath),
        size_bytes: parsed.sizeBytes ?? null,
        sha256: parsed.sha256 ?? null,
        version: parsed.version,
        is_active: parsed.isActive
    }, { onConflict: 'catalog_id,asset_type,language_code,key' }).select().single();
    if (error)
        throw new HttpError(500, 'lid_asset_save_failed', error.message);
    return data;
}
function getLocalizedPack(cards, lang) {
    // Keep German always. Include English and selected language for learning.
    return {
        metadata: {
            generated_at: new Date().toISOString(),
            lang,
            total_cards: cards.length,
            note: 'German official question text is always included. Learning/help fields include available localized content.'
        },
        cards: cards.map((card) => ({
            id: card.number,
            catalog_id: card.catalog_key,
            part: card.part,
            state: card.state,
            number: card.number,
            page: card.page,
            question: {
                de: card.question_json?.de ?? null,
                en: card.question_json?.en ?? null,
                [lang]: card.question_json?.[lang] ?? null
            },
            choices: (card.choices_json ?? []).map((choice) => ({
                key: choice.key,
                de: choice.de,
                en: choice.en ?? null,
                [lang]: choice?.[lang] ?? null
            })),
            answer: card.answer_key,
            correct_choice: card.correct_choice_json,
            requires_image: card.requires_image,
            image_note: card.image_note,
            learn: card.learn_json,
            study_material: card.study_material_json
        }))
    };
}
export async function publishLiDManifest(languageCode = 'te') {
    const catalog = await getActiveLiDCatalog();
    if (!catalog)
        throw new HttpError(404, 'no_active_lid_catalog');
    const { data: cards, error: cardsError } = await supabaseAdmin
        .from('lid_cards')
        .select('*')
        .eq('catalog_id', catalog.id)
        .order('part')
        .order('number');
    if (cardsError)
        throw new HttpError(500, 'lid_cards_fetch_failed', cardsError.message);
    const localizedPack = getLocalizedPack(cards ?? [], languageCode);
    const jsonBuffer = Buffer.from(JSON.stringify(localizedPack));
    const gzBuffer = gzipSync(jsonBuffer);
    const versionSafe = String(catalog.version).replace(/[^a-zA-Z0-9._-]/g, '_');
    const cardsPath = `lid/${versionSafe}/cards_${languageCode}.json.gz`;
    const cardsUrl = await uploadTextFile(cardsPath, gzBuffer, 'application/gzip');
    const { data: assets, error: assetsError } = await supabaseAdmin
        .from('lid_assets')
        .select('*')
        .eq('is_active', true)
        .or(`catalog_id.eq.${catalog.id},catalog_id.is.null`);
    if (assetsError)
        throw new HttpError(500, 'lid_assets_fetch_failed', assetsError.message);
    const media = {};
    const samples = {};
    const imageItems = {};
    let examInfo = null;
    for (const asset of assets ?? []) {
        const descriptor = {
            key: asset.key,
            url: asset.public_url ?? publicUrl(asset.storage_path),
            storagePath: asset.storage_path,
            sha256: asset.sha256,
            sizeBytes: asset.size_bytes,
            version: asset.version
        };
        if (asset.asset_type === 'image')
            imageItems[asset.key] = asset.storage_path.split('/').pop();
        if (asset.asset_type === 'intro_video')
            media.introVideo = descriptor;
        if (asset.asset_type === 'tips_audio')
            media[`tipsAudio_${asset.language_code ?? 'default'}`] = descriptor;
        if (asset.asset_type === 'audio_track')
            media[`audioTrack_${asset.key}`] = descriptor;
        if (asset.asset_type === 'sample_json')
            samples[asset.key] = descriptor;
        if (asset.asset_type === 'exam_info')
            examInfo = descriptor;
    }
    const manifest = {
        module: 'lid_test',
        schemaVersion: 2,
        version: catalog.version,
        languages: [languageCode],
        catalog: {
            id: catalog.id,
            totalCards: catalog.total_cards,
            generalCards: catalog.general_cards,
            stateCards: catalog.state_cards
        },
        cards: {
            key: `cards_${languageCode}`,
            url: cardsUrl,
            storagePath: cardsPath,
            sha256: sha256Buffer(gzBuffer),
            sizeBytes: gzBuffer.byteLength,
            contentType: 'application/gzip',
            version: catalog.version
        },
        media,
        images: {
            baseUrl: publicUrl('lid/images/').replace(/%2F/g, '/'),
            items: imageItems
        },
        samples,
        examInfo
    };
    const manifestPath = `lid/${versionSafe}/manifest_${languageCode}.json`;
    const manifestUrl = await uploadTextFile(manifestPath, JSON.stringify(manifest, null, 2), 'application/json');
    const { error: releaseError } = await supabaseAdmin.from('content_releases').insert({
        module: 'lid_test',
        version: catalog.version,
        language_code: languageCode,
        manifest_json: manifest,
        manifest_storage_path: manifestPath,
        manifest_public_url: manifestUrl,
        is_active: true
    });
    if (releaseError)
        throw new HttpError(500, 'lid_release_save_failed', releaseError.message);
    return { manifest, manifestPath, manifestUrl, cardsPath, cardsUrl };
}
export async function getPublishedLiDManifest(languageCode = 'te') {
    const { data, error } = await supabaseAdmin
        .from('content_releases')
        .select('*')
        .eq('module', 'lid_test')
        .eq('language_code', languageCode)
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error)
        throw new HttpError(500, 'lid_manifest_fetch_failed', error.message);
    if (!data)
        return null;
    return data.manifest_json;
}
