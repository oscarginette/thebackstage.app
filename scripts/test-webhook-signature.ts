#!/usr/bin/env tsx
/**
 * Test Webhook Signature Generator
 *
 * Generates valid webhook signatures for testing Mailgun and Resend webhooks locally.
 *
 * Usage:
 *   npm run test-webhook mailgun
 *   npm run test-webhook resend
 *   npm run test-webhook mailgun --invalid  # Generate invalid signature for testing
 */

import crypto from 'crypto';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

type WebhookProvider = 'mailgun' | 'resend';

interface WebhookTestData {
  provider: WebhookProvider;
  headers: Record<string, string>;
  payload: string;
  curlCommand: string;
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Generate Mailgun webhook signature
 */
function generateMailgunSignature(invalid: boolean = false): WebhookTestData {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const token = crypto.randomBytes(32).toString('hex');
  const signingKey = invalid ? 'wrong_key' : process.env.MAILGUN_WEBHOOK_SIGNING_KEY || 'test_signing_key';

  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(timestamp + token)
    .digest('hex');

  const payload = JSON.stringify({
    'event-data': {
      event: 'delivered',
      message: {
        headers: {
          'message-id': 'test-message-' + Date.now(),
        },
      },
      recipient: 'user@example.com',
      timestamp: parseInt(timestamp, 10),
      tags: ['test', 'webhook-verification'],
    },
  }, null, 2);

  const headers = {
    'X-Mailgun-Timestamp': timestamp,
    'X-Mailgun-Token': token,
    'X-Mailgun-Signature': signature,
    'Content-Type': 'application/json',
  };

  const curlCommand = `curl -X POST http://localhost:3000/api/webhooks/mailgun \\
  -H "X-Mailgun-Timestamp: ${timestamp}" \\
  -H "X-Mailgun-Token: ${token}" \\
  -H "X-Mailgun-Signature: ${signature}" \\
  -H "Content-Type: application/json" \\
  -d '${payload.replace(/\n/g, ' ').replace(/\s+/g, ' ')}'`;

  return {
    provider: 'mailgun',
    headers,
    payload,
    curlCommand,
  };
}

/**
 * Generate Resend webhook signature
 */
function generateResendSignature(invalid: boolean = false): WebhookTestData {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const secret = invalid
    ? 'whsec_wrong_secret'
    : process.env.RESEND_WEBHOOK_SECRET || 'whsec_test_secret';

  const payload = JSON.stringify({
    type: 'email.delivered',
    created_at: new Date().toISOString(),
    data: {
      email_id: 'test-email-' + Date.now(),
      from: 'noreply@thebackstage.app',
      to: ['user@example.com'],
      subject: 'Test Email - Webhook Verification',
      created_at: new Date().toISOString(),
    },
  }, null, 2);

  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf-8')
    .digest('hex');

  const signatureHeader = `t=${timestamp},v1=${signature}`;

  const headers = {
    'Resend-Signature': signatureHeader,
    'Content-Type': 'application/json',
  };

  const curlCommand = `curl -X POST http://localhost:3000/api/webhooks/resend \\
  -H "Resend-Signature: ${signatureHeader}" \\
  -H "Content-Type: application/json" \\
  -d '${payload.replace(/\n/g, ' ').replace(/\s+/g, ' ')}'`;

  return {
    provider: 'resend',
    headers,
    payload,
    curlCommand,
  };
}

/**
 * Display webhook test data
 */
function displayWebhookTest(data: WebhookTestData, invalid: boolean) {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log(`  ${data.provider.toUpperCase()} WEBHOOK TEST ${invalid ? '(INVALID SIGNATURE)' : '(VALID SIGNATURE)'}`, 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  log('Headers:', 'yellow');
  Object.entries(data.headers).forEach(([key, value]) => {
    log(`  ${key}: ${value}`, 'reset');
  });

  log('\nPayload:', 'yellow');
  log(data.payload, 'reset');

  log('\nCURL Command:', 'yellow');
  log(data.curlCommand, 'green');

  log('\nExpected Response:', 'yellow');
  if (invalid) {
    log('  Status: 401 Unauthorized', 'red');
    log('  Body: {"error":"Invalid signature"}', 'red');
  } else {
    log('  Status: 200 OK', 'green');
    log('  Body: {"received":true}', 'green');
  }

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const provider = args[0] as WebhookProvider;
  const invalid = args.includes('--invalid');

  if (!provider || !['mailgun', 'resend'].includes(provider)) {
    log('\nUsage:', 'yellow');
    log('  npm run test-webhook mailgun', 'reset');
    log('  npm run test-webhook resend', 'reset');
    log('  npm run test-webhook mailgun --invalid  # Generate invalid signature\n', 'reset');
    log('  tsx scripts/test-webhook-signature.ts mailgun', 'reset');
    log('  tsx scripts/test-webhook-signature.ts resend\n', 'reset');
    process.exit(1);
  }

  // Check environment variables
  if (provider === 'mailgun' && !process.env.MAILGUN_WEBHOOK_SIGNING_KEY && !invalid) {
    log('\n⚠️  Warning: MAILGUN_WEBHOOK_SIGNING_KEY not set', 'yellow');
    log('Using default test key. Set environment variable for production testing.\n', 'yellow');
  }

  if (provider === 'resend' && !process.env.RESEND_WEBHOOK_SECRET && !invalid) {
    log('\n⚠️  Warning: RESEND_WEBHOOK_SECRET not set', 'yellow');
    log('Using default test secret. Set environment variable for production testing.\n', 'yellow');
  }

  // Generate signature
  const testData = provider === 'mailgun'
    ? generateMailgunSignature(invalid)
    : generateResendSignature(invalid);

  // Display test data
  displayWebhookTest(testData, invalid);

  // Additional instructions
  log('Quick Test Steps:', 'yellow');
  log('  1. Start your development server: npm run dev', 'reset');
  log('  2. Copy the cURL command above', 'reset');
  log('  3. Run it in a new terminal window', 'reset');
  log('  4. Check the response matches the expected output\n', 'reset');

  if (invalid) {
    log('Testing Invalid Signatures:', 'yellow');
    log('  This signature is intentionally invalid to test error handling.', 'reset');
    log('  The webhook endpoint should reject it with a 401 status.\n', 'reset');
  } else {
    log('Testing Valid Signatures:', 'yellow');
    log('  This signature is valid and should be accepted by the webhook endpoint.', 'reset');
    log('  The webhook should process the event successfully.\n', 'reset');
  }

  log('Security Notes:', 'yellow');
  log('  - Signatures are time-sensitive (15 min for Mailgun, 5 min for Resend)', 'reset');
  log('  - If you see "Timestamp too old" errors, regenerate the signature', 'reset');
  log('  - NEVER expose webhook secrets in logs or version control\n', 'reset');
}

// Run main function
main();
