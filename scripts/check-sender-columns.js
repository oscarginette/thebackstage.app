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
        if (commentIndex !== -1) value = value.substring(0, commentIndex).trim();
        value = value.replace(/^["']|["']$/g, '');
        if (value) process.env[key.trim()] = value;
      }
    });
  } catch (error) {
    console.error('Could not load .env.local:', error.message);
  }
}

loadEnvLocal();

async function checkColumns() {
  try {
    const result = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('sender_email', 'sender_name')
      ORDER BY column_name
    `;

    console.log('Sender email columns in users table:');
    if (result.rows.length === 0) {
      console.log('  ❌ No sender_email or sender_name columns found');
      console.log('\nNeed to run migration. Checking if we can add them...');

      // Try to add the columns
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS sender_email VARCHAR(255)`;
      console.log('  ✅ Added sender_email column');

      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255)`;
      console.log('  ✅ Added sender_name column');

      await sql`CREATE INDEX IF NOT EXISTS idx_users_sender_email ON users(sender_email) WHERE sender_email IS NOT NULL`;
      console.log('  ✅ Created index on sender_email');

      console.log('\n✅ Migration complete!');
    } else {
      result.rows.forEach(row => {
        console.log(`  ✅ ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
      });
      console.log('\n✅ Columns already exist!');
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

checkColumns()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
