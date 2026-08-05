import { rows, row } from '../config/db.js';

function placeholders(values: any[]) { return values.map(() => '?').join(','); }
function groupBy(items: any[], key: string) {
  const map = new Map<string, any[]>();
  for (const item of items) {
    const value = String(item[key] ?? '');
    if (!map.has(value)) map.set(value, []);
    map.get(value)!.push(item);
  }
  return map;
}

export async function getCourseBySlug(slug: string, activeOnly = false) {
  return row<any>(`SELECT * FROM courses WHERE slug=? ${activeOnly ? 'AND is_active=1' : ''} LIMIT 1`, [slug]);
}

export async function getLevels(courseId: string, levelSlug?: string, activeOnly = false) {
  const params: any[] = [courseId];
  let sql = 'SELECT * FROM course_levels WHERE course_id=?';
  if (activeOnly) sql += ' AND is_active=1';
  if (levelSlug) { sql += ' AND UPPER(slug)=UPPER(?)'; params.push(levelSlug); }
  sql += ' ORDER BY sort_order, slug';
  return rows<any>(sql, params);
}

export async function hydrateChapters(whereSql = '1=1', params: any[] = [], activeOnly = false) {
  let sql = `SELECT c.*, cat.id AS cat_id, cat.name AS cat_name, cat.icon AS cat_icon, cat.description AS cat_description,
    s.id AS series_rel_id, s.title AS series_title, s.subtitle AS series_subtitle, s.cover_url AS series_cover_url,
    l.slug AS level_slug, l.title_json AS level_title_json, l.course_id, co.slug AS course_slug, co.title_json AS course_title_json
    FROM chapters c
    JOIN course_levels l ON l.id=c.level_id
    JOIN courses co ON co.id=l.course_id
    LEFT JOIN course_categories cat ON cat.id=c.category_id
    LEFT JOIN course_series s ON s.id=c.series_id
    WHERE ${whereSql}`;
  if (activeOnly) sql += ' AND c.is_active=1';
  sql += ' ORDER BY c.sort_order, c.number';
  const base = await rows<any>(sql, params);
  if (!base.length) return [];
  const ids = base.map((x) => x.id);
  const ph = placeholders(ids);
  const [translations, assets, notes, transcripts, vocab, videos, quiz] = await Promise.all([
    rows<any>(`SELECT * FROM chapter_translations WHERE chapter_id IN (${ph}) ORDER BY created_at`, ids),
    rows<any>(`SELECT * FROM chapter_assets WHERE chapter_id IN (${ph}) ORDER BY created_at`, ids),
    rows<any>(`SELECT * FROM chapter_notes WHERE chapter_id IN (${ph}) ORDER BY updated_at DESC`, ids),
    rows<any>(`SELECT * FROM chapter_transcripts WHERE chapter_id IN (${ph}) ORDER BY sort_order`, ids),
    rows<any>(`SELECT * FROM chapter_vocabulary WHERE chapter_id IN (${ph}) ORDER BY sort_order`, ids),
    rows<any>(`SELECT * FROM chapter_videos WHERE chapter_id IN (${ph}) ORDER BY sort_order`, ids),
    rows<any>(`SELECT * FROM chapter_quiz_questions WHERE chapter_id IN (${ph}) ORDER BY sort_order`, ids)
  ]);
  const vocabIds = vocab.map((x) => x.id);
  const vocabTranslations = vocabIds.length ? await rows<any>(`SELECT * FROM chapter_vocabulary_translations WHERE vocabulary_id IN (${placeholders(vocabIds)})`, vocabIds) : [];
  const vt = groupBy(vocabTranslations, 'vocabulary_id');
  for (const v of vocab) v.translations = vt.get(String(v.id)) ?? [];
  const maps = {
    chapter_translations: groupBy(translations, 'chapter_id'), chapter_assets: groupBy(assets, 'chapter_id'), chapter_notes: groupBy(notes, 'chapter_id'),
    chapter_transcripts: groupBy(transcripts, 'chapter_id'), chapter_vocabulary: groupBy(vocab, 'chapter_id'), chapter_videos: groupBy(videos, 'chapter_id'), chapter_quiz_questions: groupBy(quiz, 'chapter_id')
  };
  return base.map((c) => ({
    ...c,
    category: c.cat_id ? { id: c.cat_id, name: c.cat_name, icon: c.cat_icon, description: c.cat_description } : null,
    series: c.series_rel_id ? { id: c.series_rel_id, title: c.series_title, subtitle: c.series_subtitle, cover_url: c.series_cover_url } : null,
    level: { id: c.level_id, slug: c.level_slug, title_json: c.level_title_json, course: { id: c.course_id, slug: c.course_slug, title_json: c.course_title_json } },
    chapter_translations: maps.chapter_translations.get(String(c.id)) ?? [],
    chapter_assets: maps.chapter_assets.get(String(c.id)) ?? [],
    chapter_notes: maps.chapter_notes.get(String(c.id)) ?? [],
    chapter_transcripts: maps.chapter_transcripts.get(String(c.id)) ?? [],
    chapter_vocabulary: maps.chapter_vocabulary.get(String(c.id)) ?? [],
    chapter_videos: maps.chapter_videos.get(String(c.id)) ?? [],
    chapter_quiz_questions: maps.chapter_quiz_questions.get(String(c.id)) ?? []
  }));
}

export async function getHydratedChapterByClientId(id: string) {
  if (/^\d+$/.test(id)) return (await hydrateChapters('c.legacy_id=?', [Number(id)]))[0] ?? null;
  return (await hydrateChapters('c.id=?', [id]))[0] ?? null;
}
