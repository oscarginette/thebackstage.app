const bcrypt = require('bcrypt');
const { neon } = require('@neondatabase/serverless');

const POSTGRES_URL = "postgresql://neondb_owner:npg_pxaRd5mcN9YE@ep-bold-breeze-ag6gzdmk-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

async function createTestUser() {
  const sql = neon(POSTGRES_URL);
  
  const email = 'claude-test@test.com';
  const password = 'ClaudeTest123';
  
  console.log('Creating test user...');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('');
  
  // Delete if exists
  await sql`DELETE FROM users WHERE email = ${email}`;
  console.log('✓ Cleaned up existing user');
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  console.log('✓ Password hashed:', passwordHash);
  
  // Insert user
  const result = await sql`
    INSERT INTO users (
      email, password_hash, role, active, created_at, updated_at
    ) VALUES (
      ${email}, ${passwordHash}, 'artist', true, NOW(), NOW()
    )
    RETURNING id, email, password_hash
  `;
  
  console.log('✓ User created with ID:', result[0].id);
  console.log('');
  
  // Verify password works
  const isValid = await bcrypt.compare(password, result[0].password_hash);
  console.log('✓ Password verification:', isValid);
  console.log('');
  
  console.log('SUCCESS! Test user created.');
  console.log('');
  console.log('Now try to login at https://thebackstage.app/login with:');
  console.log('  Email:', email);
  console.log('  Password:', password);
}

createTestUser().catch(console.error);
