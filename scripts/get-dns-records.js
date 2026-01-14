/**
 * Get DNS Records for geebeat.com
 *
 * Fetches DNS records from database and formats them for Vercel CLI
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

async function getDNSRecords() {
  console.log('📋 Fetching DNS records for geebeat.com...\n');

  try {
    const result = await sql`
      SELECT dns_records
      FROM sending_domains
      WHERE domain = 'geebeat.com'
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      console.error('❌ geebeat.com not found in database');
      process.exit(1);
    }

    const dnsRecords = result.rows[0].dns_records;

    console.log('✅ DNS Records found!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // SPF Record
    if (dnsRecords.spf) {
      console.log('1️⃣  SPF Record (Required for sending):');
      console.log('   Type: TXT');
      console.log('   Name:', dnsRecords.spf.name);
      console.log('   Value:', dnsRecords.spf.value);
      console.log('');
      console.log('   Vercel CLI command:');
      console.log(`   vercel dns add geebeat.com @ TXT "${dnsRecords.spf.value}"`);
      console.log('');
    }

    // DKIM Record
    if (dnsRecords.dkim) {
      console.log('2️⃣  DKIM Record (Required for sending):');
      console.log('   Type: TXT');
      console.log('   Name:', dnsRecords.dkim.name);
      console.log('   Value:', dnsRecords.dkim.value.substring(0, 80) + '...');
      console.log('');
      console.log('   Vercel CLI command:');
      // Extract subdomain from DKIM name (e.g., "email._domainkey.geebeat.com" → "email._domainkey")
      const dkimName = dnsRecords.dkim.name.replace('.geebeat.com', '');
      console.log(`   vercel dns add geebeat.com "${dkimName}" TXT "${dnsRecords.dkim.value}"`);
      console.log('');
    }

    // DMARC Record
    if (dnsRecords.dmarc) {
      console.log('3️⃣  DMARC Record (Recommended):');
      console.log('   Type: TXT');
      console.log('   Name:', dnsRecords.dmarc.name);
      console.log('   Value:', dnsRecords.dmarc.value);
      console.log('');
      console.log('   Vercel CLI command:');
      const dmarcName = dnsRecords.dmarc.name.replace('.geebeat.com', '');
      console.log(`   vercel dns add geebeat.com "${dmarcName}" TXT "${dnsRecords.dmarc.value}"`);
      console.log('');
    }

    // Tracking CNAME
    if (dnsRecords.tracking) {
      console.log('4️⃣  Tracking CNAME (Optional - for open/click tracking):');
      console.log('   Type: CNAME');
      console.log('   Name:', dnsRecords.tracking.name);
      console.log('   Value:', dnsRecords.tracking.value);
      console.log('');
      console.log('   Vercel CLI command:');
      const trackingName = dnsRecords.tracking.name.replace('.geebeat.com', '');
      console.log(`   vercel dns add geebeat.com "${trackingName}" CNAME ${dnsRecords.tracking.value}`);
      console.log('');
    }

    // MX Records
    if (dnsRecords.mx && dnsRecords.mx.length > 0) {
      console.log('5️⃣  MX Records (Optional - only if you want to RECEIVE emails):');
      dnsRecords.mx.forEach((mx, index) => {
        console.log(`   MX ${index + 1}:`);
        console.log('   Type: MX');
        console.log('   Name: @');
        console.log('   Value:', mx.value);
        console.log('   Priority:', mx.priority);
        console.log('');
        console.log('   Vercel CLI command:');
        console.log(`   vercel dns add geebeat.com @ MX ${mx.value} ${mx.priority}`);
        console.log('');
      });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 COMPLETE SCRIPT (copy-paste all commands):');
    console.log('');

    // Generate complete script
    const commands = [];

    // SPF
    if (dnsRecords.spf) {
      commands.push(`vercel dns add geebeat.com @ TXT "${dnsRecords.spf.value}"`);
    }

    // DKIM
    if (dnsRecords.dkim) {
      const dkimName = dnsRecords.dkim.name.replace('.geebeat.com', '');
      commands.push(`vercel dns add geebeat.com "${dkimName}" TXT "${dnsRecords.dkim.value}"`);
    }

    // DMARC
    if (dnsRecords.dmarc) {
      const dmarcName = dnsRecords.dmarc.name.replace('.geebeat.com', '');
      commands.push(`vercel dns add geebeat.com "${dmarcName}" TXT "${dnsRecords.dmarc.value}"`);
    }

    // Tracking
    if (dnsRecords.tracking) {
      const trackingName = dnsRecords.tracking.name.replace('.geebeat.com', '');
      commands.push(`vercel dns add geebeat.com "${trackingName}" CNAME ${dnsRecords.tracking.value}`);
    }

    // MX (optional)
    if (dnsRecords.mx && dnsRecords.mx.length > 0) {
      dnsRecords.mx.forEach(mx => {
        commands.push(`vercel dns add geebeat.com @ MX ${mx.value} ${mx.priority}`);
      });
    }

    commands.forEach(cmd => console.log(cmd));

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⏱️  After adding records:');
    console.log('   1. Wait 5-10 minutes for DNS propagation');
    console.log('   2. Go to http://localhost:3002/settings/sending-domains');
    console.log('   3. Click "Verify" button for geebeat.com');
    console.log('   4. Once verified, go to http://localhost:3002/settings/sender-email');
    console.log('   5. Configure: info@geebeat.com');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

getDNSRecords()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
