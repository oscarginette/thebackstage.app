#!/usr/bin/env node

/**
 * Test sending from info@geebeat.com to external email
 *
 * Tests if the issue is:
 * - Domain reputation
 * - Same sender/recipient domain (info@geebeat.com -> info@geebeat.com)
 * - DNS configuration
 */

require('dotenv').config({ path: '.env.local' });
const FormData = require('form-data');
const Mailgun = require('mailgun.js');

const mailgun = new Mailgun(FormData);

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;

// Test email to DIFFERENT domain (Gmail)
const TEST_RECIPIENT = process.argv[2] || 'oscarginebra@gmail.com';

console.log('🔍 Test: Enviar desde info@geebeat.com');
console.log(`   Destinatario: ${TEST_RECIPIENT}\n`);

const mg = mailgun.client({
  username: 'api',
  key: MAILGUN_API_KEY,
  url: 'https://api.eu.mailgun.net'
});

async function sendTestEmail() {
  try {
    const messageData = {
      from: 'Gee Beat <info@geebeat.com>',
      to: TEST_RECIPIENT,
      subject: 'DNS Test - geebeat.com domain',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h1>DNS Configuration Test</h1>
          <p>This email tests sending from <strong>info@geebeat.com</strong> to an external email address.</p>

          <h2>What we're testing:</h2>
          <ul>
            <li>SPF Record: v=spf1 include:mailgun.org ~all</li>
            <li>DKIM Signature: email._domainkey.geebeat.com</li>
            <li>Domain Reputation</li>
          </ul>

          <p><strong>If you receive this email, the DNS and deliverability are working correctly!</strong></p>

          <hr>
          <p style="font-size: 12px; color: #666;">
            Sent at: ${new Date().toISOString()}<br>
            From domain: geebeat.com<br>
            Via: Mailgun EU
          </p>
        </div>
      `,
      'h:List-Unsubscribe': '<https://geebeat.com/unsubscribe?token=test>',
      'h:List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    };

    const result = await mg.messages.create('geebeat.com', messageData);

    console.log('✅ Email enviado!\n');
    console.log('📋 Detalles:');
    console.log(`   Message ID: ${result.id}`);
    console.log(`   Status: ${result.status}\n`);

    console.log('🔍 Próximos pasos:');
    console.log(`   1. Revisa inbox: ${TEST_RECIPIENT}`);
    console.log(`   2. Verifica Mailgun Logs: ${result.id}`);
    console.log(`   3. Espera "delivered" event (no solo "accepted")`);
    console.log(`   4. Si llega → DNS OK. Si no llega → Filtro spam o reputación\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.details) {
      console.error(JSON.stringify(error.details, null, 2));
    }
    process.exit(1);
  }
}

sendTestEmail();
