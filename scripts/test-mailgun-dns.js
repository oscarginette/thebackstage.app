#!/usr/bin/env node

/**
 * Test Mailgun Email Sending with DNS Verification
 *
 * Sends a test email using Mailgun to verify:
 * - SPF record is correct
 * - DKIM signature works
 * - Email is delivered successfully
 */

require('dotenv').config({ path: '.env.local' });
const FormData = require('form-data');
const Mailgun = require('mailgun.js');

const mailgun = new Mailgun(FormData);

// Configuration from .env.local
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const MAILGUN_API_URL = process.env.MAILGUN_API_URL || 'https://api.eu.mailgun.net';

// Test email recipient
const TEST_EMAIL = 'info@geebeat.com';

console.log('🔍 Configuración Mailgun:');
console.log(`   Dominio: ${MAILGUN_DOMAIN}`);
console.log(`   API URL: ${MAILGUN_API_URL}`);
console.log(`   API Key: ${MAILGUN_API_KEY ? '✅ Configurada' : '❌ No configurada'}`);
console.log(`   Destinatario: ${TEST_EMAIL}\n`);

if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
  console.error('❌ Error: Faltan variables de entorno MAILGUN_API_KEY o MAILGUN_DOMAIN');
  process.exit(1);
}

const mg = mailgun.client({
  username: 'api',
  key: MAILGUN_API_KEY,
  url: MAILGUN_API_URL
});

async function sendTestEmail() {
  try {
    console.log('📧 Enviando email de prueba...\n');

    const messageData = {
      from: `Backstage Test <noreply@${MAILGUN_DOMAIN}>`,
      to: TEST_EMAIL,
      subject: 'DNS Verification Test - SPF + DKIM',
      text: 'This is a test email to verify SPF and DKIM configuration.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #FF5500;">DNS Verification Test</h1>
          <p>This email tests the following DNS records:</p>
          <ul>
            <li><strong>SPF:</strong> v=spf1 include:_spf.google.com include:mailgun.org ~all</li>
            <li><strong>DKIM:</strong> mailo._domainkey.${MAILGUN_DOMAIN}</li>
          </ul>
          <p>If you receive this email, DNS is configured correctly!</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            Sent at: ${new Date().toISOString()}<br>
            Domain: ${MAILGUN_DOMAIN}
          </p>
        </div>
      `,
      'h:List-Unsubscribe': `<https://${MAILGUN_DOMAIN}/unsubscribe?token=test>`,
      'h:List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    };

    const result = await mg.messages.create(MAILGUN_DOMAIN, messageData);

    console.log('✅ Email enviado exitosamente!\n');
    console.log('📋 Detalles:');
    console.log(`   Message ID: ${result.id}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.message}\n`);

    console.log('🔍 Próximos pasos:');
    console.log('   1. Revisa tu inbox en: info@geebeat.com');
    console.log('   2. Verifica Mailgun Dashboard → Logs → Message ID:', result.id);
    console.log('   3. Confirma que el evento sea "delivered" (no solo "accepted")');
    console.log(`   4. Verifica headers del email (SPF: PASS, DKIM: PASS)\n`);

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
