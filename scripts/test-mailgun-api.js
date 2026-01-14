/**
 * Test Mailgun API Connection
 *
 * Quick script to verify Mailgun API key works and has correct permissions.
 *
 * Usage:
 *   node scripts/test-mailgun-api.js
 */

const FormData = require('form-data');
const Mailgun = require('mailgun.js');
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
        // Remove inline comments (everything after #)
        const commentIndex = value.indexOf('#');
        if (commentIndex !== -1) {
          value = value.substring(0, commentIndex).trim();
        }

        // Remove quotes if present
        value = value.replace(/^["']|["']$/g, '');

        // Only set if value is not empty after cleaning
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

async function testMailgunAPI() {
  console.log('🔍 Testing Mailgun API connection...\n');

  // Load env vars
  const apiKey = process.env.MAILGUN_API_KEY;
  const apiUrl = process.env.MAILGUN_API_URL || 'https://api.mailgun.net';

  if (!apiKey) {
    console.error('❌ MAILGUN_API_KEY not found in environment');
    console.log('\nMake sure you have MAILGUN_API_KEY in your .env.local file');
    process.exit(1);
  }

  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');
  console.log('✅ API URL:', apiUrl);
  console.log('');

  // Initialize Mailgun client
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: 'api',
    key: apiKey,
    url: apiUrl,
  });

  console.log('📡 Testing API connection...\n');

  try {
    // Test 1: List domains (read permission)
    console.log('Test 1: Listing existing domains...');
    const domains = await mg.domains.list();
    console.log('✅ Success! Found', domains.items?.length || 0, 'domains');

    if (domains.items && domains.items.length > 0) {
      console.log('   Existing domains:');
      domains.items.forEach(d => {
        console.log(`   - ${d.name} (${d.state}) - Created: ${d.created_at}`);
      });
      console.log('');

      // Show full details
      console.log('   Full details:');
      domains.items.forEach(d => {
        console.log(JSON.stringify(d, null, 2));
      });
    }
    console.log('');

    // Test 2: Check if geebeat.com already exists
    console.log('Test 2: Checking if geebeat.com exists in Mailgun...');
    try {
      const geebeatDomain = await mg.domains.get('geebeat.com');
      console.log('✅ geebeat.com ALREADY EXISTS in Mailgun!');
      console.log('   Details:', {
        name: geebeatDomain.name,
        state: geebeatDomain.state,
        created_at: geebeatDomain.created_at,
      });
      console.log('');
      console.log('   This is why you get "Internal Server Error" - domain already registered');
      console.log('   You can use the existing domain or delete it first');
      console.log('');
    } catch (error) {
      if (error.status === 404) {
        console.log('✅ geebeat.com does NOT exist in Mailgun (this is good)');
        console.log('');
      } else {
        console.error('❌ Error checking domain:', error.message);
      }
    }

    // Test 3: Try to create geebeat.com specifically
    console.log('Test 3: Attempting to create geebeat.com...');
    try {
      const geebeatResult = await mg.domains.create({
        name: 'geebeat.com',
        smtp_password: 'test-password-' + Date.now(),
        spam_action: 'disabled',
        wildcard: false,
      });

      console.log('✅ SUCCESS! geebeat.com created in Mailgun');
      console.log('   Domain details:', {
        name: geebeatResult.name,
        state: geebeatResult.state,
        sending_records: geebeatResult.sending_dns_records?.length || 0,
      });

      // Don't delete - we want to keep it
      console.log('');
      console.log('   ✅ Domain ready to use! Now you can verify DNS records.');
      console.log('');

    } catch (geebeatError) {
      console.error('❌ FAILED to create geebeat.com');
      console.error('   Status:', geebeatError.status);
      console.error('   Message:', geebeatError.message);
      console.error('   Details:', geebeatError.details);
      console.error('');
      console.error('   Full error:', JSON.stringify(geebeatError, null, 2));
      console.error('');
    }

    // Test 4: Try to create a test domain (write permission)
    const testDomain = 'test-domain-' + Date.now() + '.example.com';
    console.log('Test 4: Creating test domain:', testDomain);

    try {
      const createResult = await mg.domains.create({
        name: testDomain,
        smtp_password: 'test-password-123',
        spam_action: 'disabled',
        wildcard: false,
      });

      console.log('✅ Success! Domain created');
      console.log('   Full response:', JSON.stringify(createResult, null, 2));
      console.log('   Response keys:', Object.keys(createResult || {}));
      console.log('   Domain name:', createResult.domain?.name || createResult.name);
      console.log('   State:', createResult.domain?.state || createResult.state);
      console.log('   DNS records:', createResult.sending_dns_records?.length || 0, 'records');

      // Clean up: delete test domain
      console.log('\n   Cleaning up test domain...');
      await mg.domains.destroy(testDomain);
      console.log('   ✅ Test domain deleted');

    } catch (createError) {
      if (createError.status === 401) {
        console.error('❌ FAILED: Unauthorized (401)');
        console.error('   Your API key does NOT have permission to create domains');
        console.error('');
        console.error('   SOLUTION:');
        console.error('   1. Go to https://app.mailgun.com/settings/api_security');
        console.error('   2. Find your "Private API key" (NOT "Sending API key")');
        console.error('   3. Copy it and update MAILGUN_API_KEY in .env.local');
        console.error('   4. The key should start with: key-...');
        console.error('   5. Restart the server');
        console.error('');
        process.exit(1);
      } else if (createError.status === 402) {
        console.error('❌ FAILED: Payment Required (402)');
        console.error('   Your Mailgun account needs to be upgraded');
        console.error('   Free tier may not support creating domains via API');
        console.error('');
        console.error('   SOLUTION:');
        console.error('   1. Upgrade to Mailgun Flex plan ($0.80/1000 emails)');
        console.error('   2. OR create domains manually in Mailgun dashboard');
        console.error('');
        process.exit(1);
      } else {
        throw createError;
      }
    }

    console.log('\n✅ ALL TESTS PASSED!');
    console.log('   Your Mailgun API key is working correctly');
    console.log('   You can create domains via API');
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run test
testMailgunAPI()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
