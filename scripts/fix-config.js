require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function fixConfig() {
  try {
    console.log('Updating config...');

    await sql`
      UPDATE app_config
      SET brevo_list_ids = '[5]'::jsonb
      WHERE id = 1
    `;

    console.log('✅ Config updated');

    const result = await sql`SELECT * FROM app_config WHERE id = 1`;
    console.log('\nNew config:', result.rows[0]);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixConfig();
