/**
 * Verify geebeat.com Domain
 *
 * Checks DNS records via Mailgun API and updates database status.
 *
 * Usage:
 *   node scripts/verify-geebeat-domain.js
 */

const FormData = require('form-data');
const Mailgun = require('mailgun.js');
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

async function verifyDomain() {
  console.log('🔍 Verifying geebeat.com DNS records...\n');

  const apiKey = process.env.MAILGUN_API_KEY;
  const apiUrl = process.env.MAILGUN_API_URL || 'https://api.mailgun.net';

  if (!apiKey) {
    console.error('❌ MAILGUN_API_KEY not found');
    process.exit(1);
  }

  // Initialize Mailgun
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: 'api',
    key: apiKey,
    url: apiUrl,
  });

  try {
    // 1. Get domain details from Mailgun
    console.log('1️⃣  Fetching domain status from Mailgun...');
    const domain = await mg.domains.get('geebeat.com');

    console.log('Domain State:', domain.state);
    console.log('');

    // 2. Check sending DNS records
    console.log('2️⃣  Checking DNS records:');
    const sendingRecords = domain.sending_dns_records || [];

    let spfValid = false;
    let dkimValid = false;
    let dmarcValid = false;

    sendingRecords.forEach(record => {
      if (record.record_type === 'TXT' && !record.name.includes('_') && record.value?.includes('v=spf1')) {
        console.log('   SPF:', record.valid ? '✅ VALID' : '❌ INVALID');
        spfValid = record.valid;
      }
      if (record.record_type === 'TXT' && record.name.includes('_domainkey')) {
        console.log('   DKIM:', record.valid ? '✅ VALID' : '❌ INVALID');
        dkimValid = record.valid;
      }
      if (record.record_type === 'TXT' && record.name.includes('_dmarc')) {
        console.log('   DMARC:', record.valid ? '✅ VALID' : '❌ INVALID (optional)');
        dmarcValid = record.valid;
      }
      if (record.record_type === 'CNAME') {
        console.log('   Tracking CNAME:', record.valid ? '✅ VALID' : '❌ INVALID (optional)');
      }
    });

    console.log('');

    // 3. Determine overall status
    const isVerified = spfValid && dkimValid;
    const newStatus = isVerified ? 'verified' : 'failed';

    let errorMessage = null;
    if (!isVerified) {
      const errors = [];
      if (!spfValid) errors.push('SPF record not verified');
      if (!dkimValid) errors.push('DKIM record not verified');
      if (!dmarcValid) errors.push('DMARC record not verified (optional)');
      errorMessage = `DNS verification failed: ${errors.join(', ')}. Please ensure all DNS records are configured correctly and allow up to 48 hours for DNS propagation.`;
    }

    console.log('3️⃣  Updating database...');
    console.log('   New Status:', isVerified ? '✅ VERIFIED' : '❌ FAILED');

    // 4. Update database
    const result = await sql`
      UPDATE sending_domains
      SET
        status = ${newStatus},
        error_message = ${errorMessage},
        verification_attempts = verification_attempts + 1,
        last_verification_at = NOW(),
        verified_at = CASE
          WHEN ${newStatus} = 'verified' THEN NOW()
          ELSE verified_at
        END,
        updated_at = NOW()
      WHERE domain = 'geebeat.com'
      RETURNING id, domain, status, verified_at
    `;

    console.log('');
    console.log('✅ Database updated:');
    console.log('   Domain:', result.rows[0].domain);
    console.log('   Status:', result.rows[0].status);
    console.log('   Verified At:', result.rows[0].verified_at || 'Not verified');
    console.log('');

    if (isVerified) {
      console.log('🎉 SUCCESS! geebeat.com is now verified and ready to use!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Go to http://localhost:3002/settings/sender-email');
      console.log('2. Configure your sender email: info@geebeat.com');
      console.log('3. Test sending a newsletter with your custom sender');
      console.log('');
    } else {
      console.log('⏳ DNS records not fully propagated yet.');
      console.log('');
      console.log('What to do:');
      console.log('1. Wait a few more minutes for DNS propagation');
      console.log('2. Run this script again: node scripts/verify-geebeat-domain.js');
      console.log('3. Check Mailgun dashboard: https://app.mailgun.com/mg/domains');
      console.log('');
      if (errorMessage) {
        console.log('Error:', errorMessage);
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run verification
verifyDomain()
  .then(() => {
    console.log('✅ Verification check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
