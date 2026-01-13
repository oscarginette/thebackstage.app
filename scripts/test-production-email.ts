/**
 * Test Production Email - Mailgun Verification
 *
 * Sends a simple test email using production API key to verify Mailgun setup.
 * This matches the example provided by Mailgun in their onboarding guide.
 */

import FormData from 'form-data';
import Mailgun from 'mailgun.js';

async function sendProductionEmail() {
  console.log('📧 Sending Production Test Email via Mailgun\n');

  const apiKey = process.env.MAILGUN_API_KEY || '';
  const domain = process.env.MAILGUN_DOMAIN || 'thebackstage.app';
  const apiUrl = process.env.MAILGUN_API_URL || 'https://api.eu.mailgun.net';

  if (!apiKey) {
    console.error('❌ Error: MAILGUN_API_KEY must be set');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log(`  API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`  Domain: ${domain}`);
  console.log(`  API URL: ${apiUrl}\n`);

  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: 'api',
    key: apiKey,
    url: apiUrl,
  });

  try {
    console.log('Sending email...');

    const data = await mg.messages.create(domain, {
      from: 'The Backstage <postmaster@thebackstage.app>',
      to: ['Oscar Ginette <info@thebackstage.app>'],
      subject: 'Hello Oscar Ginette',
      text: 'Congratulations Oscar Ginette, you just sent an email with Mailgun! You are truly awesome!',
      html: '<h1>Congratulations! 🎉</h1><p>You just sent an email with Mailgun from <strong>The Backstage</strong>!</p><p>You are truly awesome!</p>',
    });

    console.log('✅ Email sent successfully!\n');
    console.log('Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n📬 Check your inbox at info@thebackstage.app');
    console.log('📊 View in Mailgun Dashboard: Sending → Logs');

  } catch (error) {
    console.error('❌ Error sending email:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
sendProductionEmail().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
