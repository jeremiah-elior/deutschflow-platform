import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

const [email, password] = process.argv.slice(2);
if (!email || !email.includes('@') || !password || password.length < 10) {
  console.error('Usage: npm run admin:create -- admin@example.com "StrongPasswordHere"');
  process.exit(1);
}
for (const key of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
  if (!process.env[key]) { console.error(`Missing ${key}`); process.exit(1); }
}
const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? {} : undefined
});
try {
  const hash = await bcrypt.hash(password, 12);
  await conn.execute(
    `INSERT INTO admin_users(id,email,password_hash,role,is_active) VALUES(?,?,?,?,1)
     ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash),role=VALUES(role),is_active=1,updated_at=CURRENT_TIMESTAMP(6)`,
    [randomUUID(), email.trim().toLowerCase(), hash, 'super_admin']
  );
  console.log('DeutschFlow admin created/updated successfully.');
} finally {
  await conn.end();
}
