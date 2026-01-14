const bcrypt = require('bcrypt');
const { neon } = require('@neondatabase/serverless');

const POSTGRES_URL = "postgresql://neondb_owner:npg_pxaRd5mcN9YE@ep-bold-breeze-ag6gzdmk-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

async function testLogin(email, password) {
  const sql = neon(POSTGRES_URL);
  
  console.log('Testing login for:', email);
  console.log('Password:', password);
  console.log('');
  
  // Find user
  const users = await sql`
    SELECT id, email, password_hash, active 
    FROM users 
    WHERE LOWER(email) = LOWER(${email})
    LIMIT 1
  `;
  
  if (users.length === 0) {
    console.log('❌ User not found');
    return;
  }
  
  const user = users[0];
  console.log('✅ User found:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  Active:', user.active);
  console.log('  Hash:', user.password_hash);
  console.log('');
  
  // Test password
  console.log('Testing password...');
  const isValid = await bcrypt.compare(password, user.password_hash);
  
  if (isValid) {
    console.log('✅ PASSWORD VALID - Login should work!');
  } else {
    console.log('❌ PASSWORD INVALID - This is why login fails');
    console.log('');
    console.log('The hash in DB does NOT match this password.');
    console.log('Either:');
    console.log('  1. You are entering a different password than signup');
    console.log('  2. The password was modified before being hashed');
  }
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node script.js <email> <password>');
  process.exit(1);
}

testLogin(email, password).catch(console.error);
