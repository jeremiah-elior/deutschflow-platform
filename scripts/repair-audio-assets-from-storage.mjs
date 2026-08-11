#!/usr/bin/env node
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { resolve, join, posix } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((raw) => {
  const value = raw.replace(/^--/, '');
  const i = value.indexOf('=');
  return i >= 0 ? [value.slice(0, i), value.slice(i + 1)] : [value, true];
}));

const apply = args.apply === true || args.apply === 'true';
const course = String(args.course || 'german');
const level = String(args.level || 'A1');
const languages = String(args.languages || 'te,ta,kn').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
const audioExt = new Set(['.m4a', '.mp3', '.aac', '.wav']);

for (const key of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'UPLOADS_DIR']) {
  if (!process.env[key]) {
    console.error(`Missing ${key}`);
    process.exit(1);
  }
}

const uploadsRoot = resolve(process.cwd(), process.env.UPLOADS_DIR);
const publicBase = String(process.env.PUBLIC_APP_BASE_URL || '').replace(/\/$/, '');

function publicUrl(storagePath) {
  const encoded = storagePath.split('/').map(encodeURIComponent).join('/');
  return `${publicBase}/uploads/content/${encoded}`;
}

function ext(name) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

async function sha256File(filePath) {
  return new Promise((resolveHash, reject) => {
    const hash = createHash('sha256');
    const input = createReadStream(filePath);
    input.on('error', reject);
    input.on('data', (chunk) => hash.update(chunk));
    input.on('end', () => resolveHash(hash.digest('hex')));
  });
}

async function newestAudioFile(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
  const candidates = [];
  for (const entry of entries) {
    if (!entry.isFile() || !audioExt.has(ext(entry.name))) continue;
    const absolute = join(dir, entry.name);
    const info = await stat(absolute);
    candidates.push({ name: entry.name, absolute, mtimeMs: info.mtimeMs, size: info.size });
  }
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs || b.name.localeCompare(a.name));
  return candidates[0] || null;
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  ssl: process.env.DB_SSL === 'true' ? {} : undefined
});

let found = 0;
let changed = 0;
let missing = 0;

try {
  const [chapters] = await conn.query(`
    SELECT c.id,c.slug,c.number,l.slug AS level_slug,co.slug AS course_slug
    FROM chapters c
    JOIN course_levels l ON l.id=c.level_id
    JOIN courses co ON co.id=l.course_id
    WHERE co.slug=? AND UPPER(l.slug)=UPPER(?) AND c.is_active=1
    ORDER BY c.sort_order,c.number`, [course, level]);

  console.log(`DeutschFlow audio asset repair ${apply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Storage root: ${uploadsRoot}`);
  console.log(`Course/level: ${course}/${level} languages=${languages.join(',')}`);

  for (const chapter of chapters) {
    for (const lang of languages) {
      const relativeDir = posix.join('courses', chapter.course_slug, chapter.level_slug, chapter.slug, 'audio', lang);
      const diskDir = join(uploadsRoot, ...relativeDir.split('/'));
      const file = await newestAudioFile(diskDir);
      if (!file) {
        missing += 1;
        console.log(`MISS ${chapter.level_slug} #${chapter.number} ${chapter.slug} [${lang}] no physical audio`);
        continue;
      }
      found += 1;
      const storagePath = posix.join(relativeDir, file.name);
      const hash = await sha256File(file.absolute);
      const version = `sha256:${hash}`;

      const [rows] = await conn.query(`
        SELECT * FROM chapter_assets
        WHERE chapter_id=? AND asset_type='audio' AND language_code=?
        ORDER BY is_active DESC,updated_at DESC,created_at DESC`, [chapter.id, lang]);
      const current = rows[0] || null;
      const same = current && current.storage_path === storagePath && current.sha256 === hash && Number(current.is_active) === 1;
      console.log(`${same ? 'OK  ' : 'FIX '} ${chapter.level_slug} #${chapter.number} ${chapter.slug} [${lang}]`);
      console.log(`     disk: ${storagePath}`);
      if (current) console.log(`     db  : ${current.storage_path}`);
      else console.log('     db  : <no chapter_assets row>');

      if (!same) changed += 1;
      if (!apply) continue;

      await conn.beginTransaction();
      try {
        let id = current?.id || randomUUID();
        if (current) {
          await conn.execute(`
            UPDATE chapter_assets
            SET storage_path=?,public_url=?,size_bytes=?,sha256=?,version=?,is_active=1,updated_at=CURRENT_TIMESTAMP(6)
            WHERE id=?`, [storagePath, publicUrl(storagePath), file.size, hash, version, id]);
        } else {
          await conn.execute(`
            INSERT INTO chapter_assets
              (id,chapter_id,language_code,asset_type,storage_path,public_url,size_bytes,sha256,version,is_active)
            VALUES (?,?,?,'audio',?,?,?,?,?,1)`,
            [id, chapter.id, lang, storagePath, publicUrl(storagePath), file.size, hash, version]);
        }
        await conn.execute(`
          UPDATE chapter_assets SET is_active=0,updated_at=CURRENT_TIMESTAMP(6)
          WHERE chapter_id=? AND asset_type='audio' AND language_code=? AND id<>?`, [chapter.id, lang, id]);
        await conn.commit();
      } catch (error) {
        await conn.rollback();
        throw error;
      }
    }
  }

  console.log(`\nPhysical audio found: ${found}`);
  console.log(`Rows needing change: ${changed}`);
  console.log(`Folders without audio: ${missing}`);
  if (!apply && changed > 0) {
    console.log('\nDry run only. Apply with:');
    console.log(`npm run repair:audio-assets -- --apply --course=${course} --level=${level} --languages=${languages.join(',')}`);
  }
  if (apply) {
    console.log('\nRepair applied. Publish each language manifest, then run npm run verify:mobile-audio.');
  }
} finally {
  await conn.end();
}
