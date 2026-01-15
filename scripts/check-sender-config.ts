import { config } from 'dotenv';
import { sql } from '@vercel/postgres';

config({ path: '.env.local' });

async function checkSenderConfig() {
  console.log('🔍 Checking Sender Email Configuration\n');

  try {
    // Get all users with their sender email config
    console.log('👤 USER SENDER EMAIL CONFIG:');
    const users = await sql`
      SELECT
        u.id,
        u.email,
        u.name,
        u.sender_email,
        u.sender_name
      FROM users u
      ORDER BY u.id
    `;

    if (users.rows.length === 0) {
      console.log('  No users found\n');
    } else {
      users.rows.forEach(user => {
        const hasSender = user.sender_email ? '✅' : '⚠️ ';
        console.log(`  ${hasSender} User ${user.id} (${user.email}):`);
        if (user.sender_email) {
          console.log(`     Sender: ${user.sender_name || 'No name'} <${user.sender_email}>`);
        } else {
          console.log(`     Sender: Not configured (will use default: noreply@thebackstage.app)`);
        }
      });
      console.log('');
    }

    // Get all sending domains with verification status
    console.log('🌐 SENDING DOMAINS:');
    const domains = await sql`
      SELECT
        sd.id,
        sd.user_id,
        sd.domain,
        sd.status,
        sd.mailgun_domain_name,
        sd.verified_at,
        u.email as user_email
      FROM sending_domains sd
      LEFT JOIN users u ON u.id = sd.user_id
      ORDER BY sd.user_id, sd.id
    `;

    if (domains.rows.length === 0) {
      console.log('  No domains configured\n');
    } else {
      domains.rows.forEach(domain => {
        const statusIcon = domain.status === 'verified' ? '✅' :
                          domain.status === 'pending' ? '⏳' : '❌';
        console.log(`  ${statusIcon} Domain ${domain.id}: ${domain.domain}`);
        console.log(`     User: ${domain.user_email} (ID: ${domain.user_id})`);
        console.log(`     Status: ${domain.status}`);
        console.log(`     Mailgun Domain Name: ${domain.mailgun_domain_name || 'Not set'}`);
        console.log(`     Verified at: ${domain.verified_at || 'Not verified'}`);
      });
      console.log('');
    }

    // Check for potential issues
    console.log('🔍 VALIDATION:');
    for (const user of users.rows) {
      if (user.sender_email) {
        // Extract domain from sender email
        const match = user.sender_email.match(/@(.+)$/);
        const senderDomain = match ? match[1] : null;

        if (senderDomain) {
          // Check if domain is verified
          const domainVerified = domains.rows.some(
            d => d.user_id === user.id &&
                 d.domain === senderDomain &&
                 d.status === 'verified'
          );

          if (domainVerified) {
            console.log(`  ✅ User ${user.id}: Sender email domain (${senderDomain}) is VERIFIED`);
          } else {
            console.log(`  ❌ User ${user.id}: Sender email domain (${senderDomain}) is NOT VERIFIED`);
            console.log(`     → Will fallback to noreply@thebackstage.app when sending`);
          }
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Summary:');
    console.log(`  Total users: ${users.rows.length}`);
    console.log(`  Users with custom sender: ${users.rows.filter(u => u.sender_email).length}`);
    console.log(`  Total domains: ${domains.rows.length}`);
    console.log(`  Verified domains: ${domains.rows.filter(d => d.status === 'verified').length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkSenderConfig();
