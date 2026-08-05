import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
const [email,password] = process.argv.slice(2);
if(!email || !password || password.length < 10){console.error('Usage: npm run admin:set-password -- admin@example.com "StrongPasswordHere"');process.exit(1);}
const conn=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,ssl:process.env.DB_SSL==='true'?{}:undefined});
try{const hash=await bcrypt.hash(password,12);const [result]=await conn.execute('UPDATE admin_users SET password_hash=?,is_active=1 WHERE LOWER(email)=LOWER(?)',[hash,email]);if(result.affectedRows===0){console.error('Admin email not found in admin_users');process.exitCode=2;}else console.log('Admin password updated successfully.');}finally{await conn.end();}
