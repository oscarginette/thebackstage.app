/**
 * Test script to verify password hash for info@geebeat.com
 *
 * Run with: node scripts/test-password-verify.js
 */

const bcrypt = require('bcrypt');
const { neon } = require('@neondatabase/serverless');

// Get the password hash from production
const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL environment variable not set');
  process.exit(1);
}

async function testPasswordVerification() {
  const sql = neon(POSTGRES_URL);

  console.log('🔍 Fetching user info@geebeat.com from production database...\n');

  const users = await sql`
    SELECT id, email, password_hash, created_at, active
    FROM users
    WHERE email = 'info@geebeat.com'
  `;

  if (users.length === 0) {
    console.log('❌ User not found in database');
    return;
  }

  const user = users[0];
  console.log('✅ User found:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Active: ${user.active}`);
  console.log(`   Created: ${user.created_at}`);
  console.log(`   Password hash: ${user.password_hash}`);
  console.log(`   Hash length: ${user.password_hash.length}`);
  console.log(`   Hash starts with $2b$: ${user.password_hash.startsWith('$2b$')}`);
  console.log('');

  // Test with the password you used during signup
  // You'll need to update this with the actual password
  const testPassword = process.argv[2];

  if (!testPassword) {
    console.log('ℹ️  Usage: node scripts/test-password-verify.js <password>');
    console.log('ℹ️  Example: node scripts/test-password-verify.js MyPassword123');
    return;
  }

  console.log(`🔐 Testing password: "${testPassword}"\n`);

  try {
    const isValid = await bcrypt.compare(testPassword, user.password_hash);

    if (isValid) {
      console.log('✅ Password verification: SUCCESS');
      console.log('   The password matches the hash in the database.');
    } else {
      console.log('❌ Password verification: FAILED');
      console.log('   The password does NOT match the hash in the database.');
      console.log('');
      console.log('📋 Possible causes:');
      console.log('   1. Password was entered incorrectly during signup');
      console.log('   2. Password hash was not saved correctly');
      console.log('   3. Different password was used during signup vs login');
    }
  } catch (error) {
    console.error('❌ Error during bcrypt comparison:', error);
  }
}

testPasswordVerification()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script error:', error);
    process.exit(1);
  });
