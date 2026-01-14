/**
 * Check Sending Domains in Database
 */

const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

// Load .env.local
function loadEnvLocal() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');

    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const [key, ...valueParts] = trimmed.split('=');
      let value = valueParts.join('=').trim();

      if (key && value) {
        const commentIndex = value.indexOf('#');
        if (commentIndex !== -1) {
          value = value.substring(0, commentIndex).trim();
        }
        value = value.replace(/^["']|["']$/g, '');
        if (value) {
          process.env[key.trim()] = value;
        }
      }
    });
  } catch (error) {
    console.error('Could not load .env.local:', error.message);
  }
}

loadEnvLocal();

async function checkDomains() {
  console.log('🔍 Checking sending_domains table...\n');

  try {
    const result = await sql`
      SELECT
        id,
        domain,
        status,
        mailgun_domain_name,
        created_at,
        updated_at,
        verified_at,
        last_verification_at,
        verification_attempts,
        error_message,
        user_id
      FROM sending_domains
      ORDER BY created_at DESC
    `;

    console.log(`Found ${result.rows.length} domains:\n`);

    result.rows.forEach(row => {
      console.log(`Domain: ${row.domain}`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Status: ${row.status}`);
      console.log(`  Mailgun Name: ${row.mailgun_domain_name}`);
      console.log(`  User ID: ${row.user_id}`);
      console.log(`  Created: ${row.created_at}`);
      console.log(`  Verified: ${row.verified_at || 'Not verified'}`);
      console.log(`  Last Check: ${row.last_verification_at || 'Never'}`);
      console.log(`  Attempts: ${row.verification_attempts || 0}`);
      if (row.error_message) {
        console.log(`  Error: ${row.error_message}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkDomains()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
