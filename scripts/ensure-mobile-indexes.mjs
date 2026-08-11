import 'dotenv/config';
import mysql from 'mysql2/promise';

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
  ssl: process.env.DB_SSL === 'true' ? {} : undefined
});

async function ensureIndex(table, indexName, columnsSql) {
  const [existing] = await conn.query(
    'SELECT 1 FROM information_schema.statistics WHERE table_schema=? AND table_name=? AND index_name=? LIMIT 1',
    [process.env.DB_NAME, table, indexName]
  );
  if (existing.length) {
    console.log(`OK ${indexName}`);
    return;
  }
  await conn.query(`ALTER TABLE \`${table}\` ADD INDEX \`${indexName}\` (${columnsSql})`);
  console.log(`ADDED ${indexName}`);
}

try {
  await ensureIndex('chapter_assets', 'idx_chapter_assets_mobile', '`chapter_id`,`asset_type`,`language_code`,`is_active`,`updated_at`');
  await ensureIndex('chapter_videos', 'idx_chapter_videos_mobile', '`chapter_id`,`language_code`,`is_enabled`,`sort_order`,`updated_at`');
  await ensureIndex('chapters', 'idx_chapters_mobile', '`level_id`,`is_active`,`sort_order`,`number`');
  console.log('DeutschFlow V88 mobile indexes ready.');
} finally {
  await conn.end();
}
