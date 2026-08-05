import mysql, { type PoolConnection, type ResultSetHeader, type RowDataPacket } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z',
  ssl: env.DB_SSL ? {} : undefined
});

const JSON_COLUMNS = new Set([
  'title_json','description_json','notes_json','vocabulary_json','meaning_json','options_json',
  'metadata_json','question_json','choices_json','correct_choice_json','learn_json','study_material_json',
  'manifest_json','value_json','payload_json','answers_json'
]);

export function parseJson(value: any, fallback: any = {}) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(String(value)); } catch { return fallback; }
}

export function decodeRow<T extends Record<string, any>>(row: T): T {
  const out: Record<string, any> = { ...row };
  for (const [key, value] of Object.entries(out)) {
    if (JSON_COLUMNS.has(key) || key.endsWith('_json')) out[key] = parseJson(value, {});
  }
  return out as T;
}

export async function rows<T extends Record<string, any> = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [result] = await pool.query<RowDataPacket[]>(sql, params);
  return result.map((row) => decodeRow(row as T));
}

export async function row<T extends Record<string, any> = any>(sql: string, params: any[] = []): Promise<T | null> {
  const result = await rows<T>(sql, params);
  return result[0] ?? null;
}

export async function execute(sql: string, params: any[] = []): Promise<ResultSetHeader> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
}

function sqlValue(value: any) {
  if (value !== null && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)) return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value;
}

const SAFE_TABLES = new Set([
  'languages','courses','course_levels','course_categories','course_series','chapters','chapter_translations','chapter_assets',
  'chapter_notes','chapter_transcripts','chapter_vocabulary','chapter_vocabulary_translations','chapter_videos','chapter_quiz_questions',
  'lid_catalogs','lid_cards','lid_assets','content_releases','content_assets','app_config','user_progress','lid_attempts','admin_users'
]);

function safeTable(table: string) {
  if (!SAFE_TABLES.has(table)) throw new Error(`Unsafe table: ${table}`);
  return `\`${table}\``;
}

export async function insertRow<T = any>(table: string, payload: Record<string, any>, ensureId = true): Promise<T> {
  const body = { ...payload };
  if (ensureId && !body.id) body.id = randomUUID();
  const keys = Object.keys(body);
  const values = keys.map((key) => sqlValue(body[key]));
  await execute(`INSERT INTO ${safeTable(table)} (${keys.map((k) => `\`${k}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')})`, values);
  if (body.id) return (await row<T & Record<string, any>>(`SELECT * FROM ${safeTable(table)} WHERE id=? LIMIT 1`, [body.id])) as T;
  if (body.code) return (await row<T & Record<string, any>>(`SELECT * FROM ${safeTable(table)} WHERE code=? LIMIT 1`, [body.code])) as T;
  return body as T;
}

export async function updateRow<T = any>(table: string, id: string, payload: Record<string, any>): Promise<T> {
  const keys = Object.keys(payload);
  if (!keys.length) return (await row<T & Record<string, any>>(`SELECT * FROM ${safeTable(table)} WHERE id=? LIMIT 1`, [id])) as T;
  const values = keys.map((key) => sqlValue(payload[key]));
  await execute(`UPDATE ${safeTable(table)} SET ${keys.map((k) => `\`${k}\`=?`).join(',')}, updated_at=CURRENT_TIMESTAMP(6) WHERE id=?`, [...values, id]);
  return (await row<T & Record<string, any>>(`SELECT * FROM ${safeTable(table)} WHERE id=? LIMIT 1`, [id])) as T;
}

export async function deleteRow(table: string, id: string) {
  await execute(`DELETE FROM ${safeTable(table)} WHERE id=?`, [id]);
  return { deleted: true };
}

export async function countRows(table: string): Promise<number> {
  const result = await row<{ count: number }>(`SELECT COUNT(*) AS count FROM ${safeTable(table)}`);
  return Number(result?.count ?? 0);
}

export async function withTransaction<T>(fn: (conn: PoolConnection) => Promise<T>) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function pingDatabase() {
  const started = Date.now();
  await pool.query('SELECT 1');
  return { ok: true, latencyMs: Date.now() - started };
}
