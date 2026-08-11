import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const required = ['DB_HOST','DB_USER','DB_PASSWORD','DB_NAME'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing ${key}`);
    process.exit(1);
  }
}
const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  multipleStatements: true,
  ssl: process.env.DB_SSL === 'true' ? {} : undefined
});
try {
  console.log('Importing mysql/schema.sql...');
  await conn.query(readFileSync(resolve('mysql/schema.sql'),'utf8'));

  async function ensureIndex(table, indexName, columnsSql) {
    const [existing] = await conn.query(
      'SELECT 1 FROM information_schema.statistics WHERE table_schema=? AND table_name=? AND index_name=? LIMIT 1',
      [process.env.DB_NAME, table, indexName]
    );
    if (existing.length) return;
    console.log(`Adding ${indexName} on ${table}...`);
    await conn.query(`ALTER TABLE \`${table}\` ADD INDEX \`${indexName}\` (${columnsSql})`);
  }

  // V88 mobile audio bootstrap indexes. These make the selected-language audio/video
  // lookups deterministic and fast without adding extra API queries.
  await ensureIndex('chapter_assets', 'idx_chapter_assets_mobile', '`chapter_id`,`asset_type`,`language_code`,`is_active`,`updated_at`');
  await ensureIndex('chapter_videos', 'idx_chapter_videos_mobile', '`chapter_id`,`language_code`,`is_enabled`,`sort_order`,`updated_at`');
  await ensureIndex('chapters', 'idx_chapters_mobile', '`level_id`,`is_active`,`sort_order`,`number`');

  console.log('Importing mysql/seed.sql...');
  await conn.query(readFileSync(resolve('mysql/seed.sql'),'utf8'));
  const [rows] = await conn.query('SELECT (SELECT COUNT(*) FROM chapters) chapters,(SELECT COUNT(*) FROM chapter_vocabulary) vocabulary,(SELECT COUNT(*) FROM lid_cards) lid_cards,(SELECT COUNT(*) FROM admin_users) admins');
  console.log('DeutschFlow MySQL migration complete:', rows[0]);
} finally {
  await conn.end();
}
