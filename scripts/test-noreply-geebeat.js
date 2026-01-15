#!/usr/bin/env node

/**
 * Test sending from noreply@geebeat.com
 *
 * Verifies that:
 * - DNS is correct
 * - Alias exists in Google Workspace
 * - Email is delivered without warnings
 */

require('dotenv').config({ path: '.env.local' });
const FormData = require('form-data');
const Mailgun = require('mailgun.js');

const mailgun = new Mailgun(FormData);

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const SENDER_EMAIL = process.env.SENDER_EMAIL;

// Test recipient (can be changed via command line)
const TEST_RECIPIENT = process.argv[2] || 'info@geebeat.com';

console.log('🔍 Configuración:');
console.log(`   Sender: ${SENDER_EMAIL}`);
console.log(`   Domain: ${MAILGUN_DOMAIN}`);
console.log(`   Recipient: ${TEST_RECIPIENT}\n`);

const mg = mailgun.client({
  username: 'api',
  key: MAILGUN_API_KEY,
  url: 'https://api.eu.mailgun.net'
});

async function sendTestEmail() {
  try {
    const messageData = {
      from: `Gee Beat <${SENDER_EMAIL}>`,
      to: TEST_RECIPIENT,
      subject: 'Test from noreply@geebeat.com - Google Workspace Alias',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #FF5500;">Email Test</h1>

          <p><strong>This email tests the noreply@geebeat.com alias configuration.</strong></p>

          <h2>What we're testing:</h2>
          <ul>
            <li>✅ SPF Record: v=spf1 include:mailgun.org ~all</li>
            <li>✅ DKIM Signature: email._domainkey.geebeat.com</li>
            <li>✅ Google Workspace Alias: noreply@geebeat.com</li>
          </ul>

          <h2>Expected result:</h2>
          <p>This email should arrive in your inbox <strong>without warnings</strong> because:</p>
          <ol>
            <li>DNS records are correctly configured</li>
            <li>noreply@geebeat.com is a valid alias in Google Workspace</li>
            <li>Sender domain (geebeat.com) matches alias domain</li>
          </ol>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">

          <p style="font-size: 12px; color: #666;">
            <strong>Technical details:</strong><br>
            Sent at: ${new Date().toISOString()}<br>
            From: ${SENDER_EMAIL}<br>
            Domain: ${MAILGUN_DOMAIN}<br>
            Via: Mailgun EU
          </p>
        </div>
      `,
      'h:List-Unsubscribe': '<https://geebeat.com/unsubscribe?token=test>',
      'h:List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    };

    const result = await mg.messages.create(MAILGUN_DOMAIN, messageData);

    console.log('✅ Email enviado exitosamente!\n');
    console.log('📋 Detalles:');
    console.log(`   Message ID: ${result.id}`);
    console.log(`   Status: ${result.status}\n`);

    console.log('🔍 Verificación:');
    console.log(`   1. Revisa inbox: ${TEST_RECIPIENT}`);
    console.log(`   2. Verifica que NO aparezca el warning de Google`);
    console.log(`   3. El email debería verse como enviado desde "Gee Beat <noreply@geebeat.com>"`);
    console.log(`   4. Headers deberían mostrar SPF: PASS, DKIM: PASS\n`);

    console.log('📊 Mailgun Logs:');
    console.log(`   https://app.mailgun.com/app/sending/domains/${MAILGUN_DOMAIN}/logs\n`);

  } catch (error) {
    console.error('❌ Error al enviar email:', error.message);
    if (error.details) {
      console.error('\n📋 Detalles del error:');
      console.error(JSON.stringify(error.details, null, 2));
    }
    process.exit(1);
  }
}

sendTestEmail();
