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
  console.log('Importing mysql/seed.sql...');
  await conn.query(readFileSync(resolve('mysql/seed.sql'),'utf8'));
  const [rows] = await conn.query('SELECT (SELECT COUNT(*) FROM chapters) chapters,(SELECT COUNT(*) FROM chapter_vocabulary) vocabulary,(SELECT COUNT(*) FROM lid_cards) lid_cards,(SELECT COUNT(*) FROM admin_users) admins');
  console.log('DeutschFlow MySQL migration complete:', rows[0]);
} finally {
  await conn.end();
}
