#!/usr/bin/env node
/*
  Import the old Hostinger/phpMyAdmin MySQL dump into the new Phase 2 Supabase schema.

  Usage:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-legacy-mysql.mjs /path/u832879198_deutschflow.sql

  Before running:
    1. Run supabase/migrations/001_initial_schema.sql
    2. Run supabase/migrations/002_legacy_mysql_content_schema.sql
*/
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const dumpPath = process.argv[2];
if (!dumpPath) {
  console.error('Usage: node scripts/import-legacy-mysql.mjs /path/to/u832879198_deutschflow.sql');
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: WebSocket }
});
const sql = fs.readFileSync(path.resolve(dumpPath), 'utf8');

function parseValue(raw) {
  if (raw === undefined) return null;
  const s = raw.trim();
  if (/^NULL$/i.test(s)) return null;
  if (/^current_timestamp\(\)$/i.test(s)) return null;
  if (s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1)
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  }
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

function splitTopLevelTuples(valuesSql) {
  const tuples = [];
  let inString = false;
  let escape = false;
  let depth = 0;
  let start = -1;
  for (let i = 0; i < valuesSql.length; i++) {
    const ch = valuesSql[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === "'") inString = false;
      continue;
    }
    if (ch === "'") { inString = true; continue; }
    if (ch === '(') {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (ch === ')') {
      depth--;
      if (depth === 0 && start >= 0) tuples.push(valuesSql.slice(start, i));
    }
  }
  return tuples;
}

function splitTuple(tupleSql) {
  const values = [];
  let inString = false;
  let escape = false;
  let start = 0;
  for (let i = 0; i < tupleSql.length; i++) {
    const ch = tupleSql[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === "'") inString = false;
      continue;
    }
    if (ch === "'") { inString = true; continue; }
    if (ch === ',') {
      values.push(parseValue(tupleSql.slice(start, i)));
      start = i + 1;
    }
  }
  values.push(parseValue(tupleSql.slice(start)));
  return values;
}

function findInsertStatements(tableName) {
  const prefix = 'INSERT INTO `' + tableName + '`';
  const statements = [];
  let searchFrom = 0;
  while (true) {
    const start = sql.indexOf(prefix, searchFrom);
    if (start === -1) break;
    let inString = false;
    let escape = false;
    let end = start;
    for (; end < sql.length; end++) {
      const ch = sql[end];
      if (inString) {
        if (escape) escape = false;
        else if (ch === '\\') escape = true;
        else if (ch === "'") inString = false;
        continue;
      }
      if (ch === "'") { inString = true; continue; }
      if (ch === ';') {
        statements.push(sql.slice(start, end + 1));
        searchFrom = end + 1;
        break;
      }
    }
    if (end >= sql.length) break;
  }
  return statements;
}

function getTableRows(tableName) {
  const rows = [];
  for (const statement of findInsertStatements(tableName)) {
    const match = statement.match(new RegExp("INSERT INTO `" + tableName + "` \\(([^)]+)\\) VALUES\\s*([\\s\\S]*);$"));
    if (!match) continue;
    const columns = match[1].split(',').map((c) => c.trim().replace(/`/g, ''));
    const tuples = splitTopLevelTuples(match[2]);
    for (const tuple of tuples) {
      const values = splitTuple(tuple);
      const row = {};
      columns.forEach((column, index) => row[column] = values[index] ?? null);
      rows.push(row);
    }
  }
  return rows;
}

async function upsertOne(table, payload, onConflict, select = 'id') {
  const { data, error } = await supabase.from(table).upsert(payload, { onConflict }).select(select).single();
  if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  return data;
}

async function upsertMany(table, rows, onConflict) {
  if (!rows.length) return [];
  const { data, error } = await supabase.from(table).upsert(rows, { onConflict }).select();
  if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  return data ?? [];
}

function b(value) { return Boolean(Number(value)); }
function j(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}
function slugify(value, fallback) {
  return String(value || fallback || '')
    .trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || String(fallback);
}

const old = {
  languages: getTableRows('supported_languages'),
  levels: getTableRows('levels'),
  categories: getTableRows('categories'),
  series: getTableRows('series'),
  lessons: getTableRows('lessons'),
  lessonTranslations: getTableRows('lesson_translations'),
  lessonNotes: getTableRows('lesson_notes'),
  lessonTranscripts: getTableRows('lesson_transcripts'),
  lessonVocabulary: getTableRows('lesson_vocabulary'),
  lessonVocabularyTranslations: getTableRows('lesson_vocabulary_translations'),
  lessonVideos: getTableRows('lesson_videos'),
  quizQuestions: getTableRows('quiz_questions'),
  lessonQuizQuestions: getTableRows('lesson_quiz_questions')
};

console.log('Parsed old MySQL dump:', Object.fromEntries(Object.entries(old).map(([k, v]) => [k, v.length])));

const course = await upsertOne('courses', {
  slug: 'german',
  title_json: { en: 'German Course' },
  description_json: { en: 'DeutschFlow German learning content migrated from the old backend.' },
  is_active: true,
  sort_order: 1
}, 'slug');

await upsertMany('languages', old.languages.map((row) => ({
  code: row.code,
  name: row.name_en,
  native_name: row.name_native,
  sort_order: row.sort_order ?? 0,
  is_active: b(row.is_active ?? 1)
})), 'code');

const levelMap = new Map();
for (const row of old.levels) {
  const data = await upsertOne('course_levels', {
    course_id: course.id,
    legacy_id: row.id,
    slug: row.code,
    title_json: { en: row.title },
    description_json: {},
    sort_order: row.sort_order ?? 0,
    is_active: b(row.is_active ?? 1)
  }, 'legacy_id');
  levelMap.set(Number(row.id), data.id);
}

const categoryMap = new Map();
for (const row of old.categories) {
  const data = await upsertOne('course_categories', {
    course_id: course.id,
    legacy_id: row.id,
    name: row.name,
    icon: row.icon,
    description: row.description,
    is_active: b(row.is_active ?? 1),
    sort_order: row.id ?? 0
  }, 'course_id,legacy_id');
  categoryMap.set(Number(row.id), data.id);
}

const seriesMap = new Map();
for (const row of old.series) {
  const data = await upsertOne('course_series', {
    course_id: course.id,
    legacy_id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    cover_url: row.cover_url,
    is_featured: b(row.is_featured ?? 0),
    is_active: b(row.is_active ?? 1)
  }, 'course_id,legacy_id');
  seriesMap.set(Number(row.id), data.id);
}

const chapterMap = new Map();
for (const row of old.lessons) {
  const levelId = levelMap.get(Number(row.level_id));
  if (!levelId) continue;
  const title = { en: row.title_en ?? '', te: row.title_te ?? null };
  const data = await upsertOne('chapters', {
    level_id: levelId,
    legacy_id: row.id,
    category_id: row.category_id ? categoryMap.get(Number(row.category_id)) ?? null : null,
    series_id: row.series_id ? seriesMap.get(Number(row.series_id)) ?? null : null,
    slug: row.slug || slugify(row.title_en, `lesson-${row.id}`),
    number: row.sort_order || row.id,
    title_json: title,
    description_json: {},
    duration_seconds: row.duration_seconds ?? 0,
    is_premium: b(row.is_premium ?? 0),
    is_featured: b(row.is_featured ?? 0),
    transcript_de: row.transcript_de ?? null,
    notes_json: { en: row.notes_en ?? null, te: row.notes_te ?? null },
    vocabulary_json: j(row.vocabulary_json, null),
    sort_order: row.sort_order ?? row.id,
    is_active: b(row.is_published ?? 0)
  }, 'legacy_id');
  chapterMap.set(Number(row.id), data.id);

  const assets = [];
  if (row.audio_url) assets.push({ chapter_id: data.id, language_code: 'te', asset_type: 'audio', storage_path: row.audio_url, public_url: row.audio_url, duration_seconds: row.duration_seconds ?? null, version: 'legacy', is_active: true });
  if (row.cover_url) assets.push({ chapter_id: data.id, language_code: null, asset_type: 'cover', storage_path: row.cover_url, public_url: row.cover_url, version: 'legacy', is_active: true });
  if (assets.length) await upsertMany('chapter_assets', assets, 'chapter_id,asset_type,language_code');
}

await upsertMany('chapter_translations', old.lessonTranslations.map((row) => ({
  chapter_id: chapterMap.get(Number(row.lesson_id)),
  legacy_id: row.id,
  language_code: row.language_code,
  title: row.title,
  notes: row.notes,
  audio_url: row.audio_url,
  is_published: b(row.is_published ?? 0)
})).filter((row) => row.chapter_id), 'legacy_id');

for (const row of old.lessonTranslations) {
  const chapterId = chapterMap.get(Number(row.lesson_id));
  if (chapterId && row.audio_url) {
    await upsertMany('chapter_assets', [{ chapter_id: chapterId, language_code: row.language_code, asset_type: 'audio', storage_path: row.audio_url, public_url: row.audio_url, version: 'legacy', is_active: b(row.is_published ?? 1) }], 'chapter_id,asset_type,language_code');
  }
}

await upsertMany('chapter_notes', old.lessonNotes.map((row) => ({
  chapter_id: chapterMap.get(Number(row.lesson_id)),
  legacy_id: row.id,
  language_code: row.language_code,
  content: row.content
})).filter((row) => row.chapter_id), 'legacy_id');

await upsertMany('chapter_transcripts', old.lessonTranscripts.map((row) => ({
  chapter_id: chapterMap.get(Number(row.lesson_id)),
  legacy_id: row.id,
  language_code: row.language_code,
  content: row.content,
  sort_order: row.sort_order ?? 0
})).filter((row) => row.chapter_id), 'legacy_id');

const vocabMap = new Map();
for (const row of old.lessonVocabulary) {
  const chapterId = chapterMap.get(Number(row.lesson_id));
  if (!chapterId) continue;
  const data = await upsertOne('chapter_vocabulary', {
    chapter_id: chapterId,
    legacy_id: row.id,
    german: row.german,
    english: row.english,
    meaning_json: { en: row.english ?? null, te: row.telugu ?? null },
    sort_order: row.sort_order ?? 0
  }, 'legacy_id');
  vocabMap.set(Number(row.id), data.id);
}

await upsertMany('chapter_vocabulary_translations', old.lessonVocabularyTranslations.map((row) => ({
  vocabulary_id: vocabMap.get(Number(row.vocabulary_id)),
  legacy_id: row.id,
  language_code: row.language_code,
  meaning: row.meaning
})).filter((row) => row.vocabulary_id), 'legacy_id');

await upsertMany('chapter_videos', old.lessonVideos.map((row) => ({
  chapter_id: chapterMap.get(Number(row.lesson_id)),
  legacy_id: row.id,
  title: row.title,
  video_url: row.video_url,
  thumbnail_url: row.thumbnail_url,
  duration_seconds: row.duration_seconds ?? 0,
  is_enabled: b(row.is_enabled ?? 1),
  is_premium: b(row.is_premium ?? 1),
  show_as_preview: b(row.show_as_preview ?? 0),
  sort_order: row.sort_order ?? 0
})).filter((row) => row.chapter_id), 'legacy_id');

function quizPayload(row, sourceTable) {
  const letter = typeof row.correct_option === 'number'
    ? ['a', 'b', 'c', 'd'][Math.max(0, Number(row.correct_option) - 1)]
    : String(row.correct_option || 'A').toLowerCase();
  return {
    chapter_id: chapterMap.get(Number(row.lesson_id)),
    legacy_id: row.id,
    source_table: sourceTable,
    question: row.question,
    options_json: {
      a: row.option_a,
      b: row.option_b,
      c: row.option_c,
      d: row.option_d
    },
    correct_option: letter,
    explanation: row.explanation,
    sort_order: row.sort_order ?? 0,
    is_active: b(row.is_active ?? row.is_enabled ?? 1)
  };
}
await upsertMany('chapter_quiz_questions', old.quizQuestions.map((row) => quizPayload(row, 'quiz_questions')).filter((row) => row.chapter_id), 'source_table,legacy_id');
await upsertMany('chapter_quiz_questions', old.lessonQuizQuestions.map((row) => quizPayload(row, 'lesson_quiz_questions')).filter((row) => row.chapter_id), 'source_table,legacy_id');

console.log('Legacy import complete.');
console.log({
  languages: old.languages.length,
  levels: old.levels.length,
  categories: old.categories.length,
  series: old.series.length,
  lessons: old.lessons.length,
  translations: old.lessonTranslations.length,
  notes: old.lessonNotes.length,
  transcripts: old.lessonTranscripts.length,
  vocabulary: old.lessonVocabulary.length,
  videos: old.lessonVideos.length,
  quiz: old.quizQuestions.length + old.lessonQuizQuestions.length
});
