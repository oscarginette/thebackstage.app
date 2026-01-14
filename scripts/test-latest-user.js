const bcrypt = require('bcrypt');
const { neon } = require('@neondatabase/serverless');

const POSTGRES_URL = process.env.POSTGRES_URL || "postgresql://neondb_owner:npg_pxaRd5mcN9YE@ep-bold-breeze-ag6gzdmk-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

async function test() {
  const sql = neon(POSTGRES_URL);
  
  const users = await sql`
    SELECT id, email, password_hash, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 1
  `;
  
  const user = users[0];
  console.log('Latest user:', user.email);
  console.log('Hash:', user.password_hash);
  console.log('Hash length:', user.password_hash.length);
  
  const testPassword = process.argv[2];
  if (!testPassword) {
    console.log('\nUsage: node script.js <password>');
    return;
  }
  
  console.log('\nTesting password:', testPassword);
  const isValid = await bcrypt.compare(testPassword, user.password_hash);
  console.log('Valid:', isValid);
}

test().catch(console.error);
