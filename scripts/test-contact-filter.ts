import { config } from 'dotenv';
import { sql } from '@vercel/postgres';

config({ path: '.env.local' });

async function testContactFilter() {
  console.log('🔍 Simulating contact filtering with TEST_EMAIL_ONLY=true\n');

  const userId = 3;
  const testEmails = ['info@geebeat.com', 'geebeat@hotmail.com'];

  // Get all subscribed contacts
  const allContacts = await sql`
    SELECT id, email, name
    FROM contacts
    WHERE subscribed = true AND user_id = ${userId}
  `;

  console.log(`📧 All subscribed contacts: ${allContacts.rows.length}`);
  console.log('');

  // Filter to test emails only (simulating repository logic)
  const filtered = allContacts.rows.filter(c => testEmails.includes(c.email));

  console.log('📧 Filtered contacts (TEST MODE):');
  filtered.forEach(c => {
    console.log(`  ✅ ${c.email} (ID: ${c.id})`);
  });
  console.log('');

  console.log(`📊 Summary:`);
  console.log(`   Original: ${allContacts.rows.length} contacts`);
  console.log(`   Filtered: ${filtered.length} contacts`);
  console.log(`   Test emails: ${testEmails.join(', ')}`);
  console.log('');

  if (filtered.length === 2 &&
      filtered.some(c => c.email === 'info@geebeat.com') &&
      filtered.some(c => c.email === 'geebeat@hotmail.com')) {
    console.log('✅ TEST PASSED: Both test emails will receive campaigns');
  } else {
    console.log('❌ TEST FAILED: Expected 2 contacts');
    console.log(`   Found: ${filtered.map(c => c.email).join(', ')}`);
  }

  process.exit(0);
}

testContactFilter();
