/**
 * Automated Sentry Integration Test
 *
 * This script:
 * 1. Saves current subscription states
 * 2. Unsubscribes all except geebeat@hotmail.com
 * 3. Creates test draft campaign
 * 4. Sends the campaign
 * 5. Shows results and Sentry links
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load production environment variables
dotenv.config({ path: '.env.production' });

const databaseUrl = process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('❌ POSTGRES_URL not found in .env.production');
  process.exit(1);
}

const sql = neon(databaseUrl);

interface Contact {
  id: number;
  email: string;
  subscribed: boolean;
}

async function main() {
  console.log('🧪 Automated Sentry Integration Test\n');
  console.log('═══════════════════════════════════════\n');

  const testEmail = 'geebeat@hotmail.com';
  // Use proper UUID format for draft ID
  const draftId = crypto.randomUUID();

  try {
    // Step 1: Get current state
    console.log('1️⃣  Checking current contacts...');
    const allContacts = await sql`
      SELECT id, email, subscribed
      FROM contacts
      ORDER BY email
    `;

    console.log(`   Found ${allContacts.length} total contacts`);
    const subscribedContacts = allContacts.filter(c => c.subscribed);
    console.log(`   Currently subscribed: ${subscribedContacts.length}`);

    const testContact = allContacts.find(c => c.email === testEmail);
    if (!testContact) {
      console.error(`   ❌ Test contact ${testEmail} not found!`);
      console.log('\n   Creating test contact...');
      await sql`
        INSERT INTO contacts (email, subscribed, name, user_id, unsubscribe_token)
        VALUES (
          ${testEmail},
          true,
          'Oscar (Sentry Test)',
          1,
          ${crypto.randomUUID().replace(/-/g, '')}
        )
      `;
      console.log('   ✅ Test contact created\n');
    } else {
      console.log(`   ✅ Test contact found: ${testContact.email}\n`);
    }

    // Step 2: Save state and modify subscriptions
    console.log('2️⃣  Saving current state and modifying subscriptions...');

    const originallySubscribed = subscribedContacts
      .filter(c => c.email !== testEmail)
      .map(c => ({ id: c.id, email: c.email }));

    console.log(`   Saving ${originallySubscribed.length} subscribed contacts`);

    // Save state for restoration
    const stateFile = {
      timestamp: new Date().toISOString(),
      draftId,
      testEmail,
      originallySubscribed: originallySubscribed.map(c => c.email)
    };

    fs.writeFileSync(
      './scripts/.test-state.json',
      JSON.stringify(stateFile, null, 2)
    );

    // Ensure test contact is subscribed
    await sql`
      UPDATE contacts
      SET subscribed = true
      WHERE email = ${testEmail}
    `;

    // Temporarily unsubscribe others
    if (originallySubscribed.length > 0) {
      await sql`
        UPDATE contacts
        SET subscribed = false
        WHERE email != ${testEmail}
        AND subscribed = true
      `;
      console.log(`   ✅ Temporarily unsubscribed ${originallySubscribed.length} contacts\n`);
    } else {
      console.log('   ℹ️  No other contacts to unsubscribe\n');
    }

    // Step 3: Create test draft
    console.log('3️⃣  Creating test draft campaign...');

    const subject = `🧪 Sentry Integration Test - ${new Date().toLocaleTimeString()}`;
    const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        background: #f7fafc;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: white;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px 30px;
        text-align: center;
      }
      .badge {
        display: inline-block;
        background: #48bb78;
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        margin-top: 10px;
      }
      .content {
        padding: 30px;
      }
      .metrics {
        background: #f7fafc;
        border-left: 4px solid #667eea;
        padding: 20px;
        margin: 20px 0;
      }
      .metrics h3 {
        margin-top: 0;
        color: #2d3748;
      }
      .metrics ul {
        margin: 10px 0;
        padding-left: 20px;
      }
      .metrics li {
        margin: 8px 0;
        color: #4a5568;
      }
      .cta {
        background: #667eea;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        display: inline-block;
        margin: 20px 0;
      }
      .footer {
        background: #edf2f7;
        padding: 20px;
        text-align: center;
        color: #718096;
        font-size: 12px;
      }
      .footer a {
        color: #667eea;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0; font-size: 32px;">🧪 Sentry Test</h1>
        <div class="badge">MONITORING ACTIVE</div>
      </div>

      <div class="content">
        <h2 style="color: #2d3748;">✅ Sentry Integration Success!</h2>

        <p style="color: #4a5568; line-height: 1.6;">
          This test email confirms that Sentry monitoring is now tracking all campaign sends
          in real-time. Every aspect of the email sending process is being monitored.
        </p>

        <div class="metrics">
          <h3>📊 What's Being Tracked:</h3>
          <ul>
            <li><strong>User Context</strong> - Which user triggered the send</li>
            <li><strong>Database Performance</strong> - Query execution times</li>
            <li><strong>Email Sending</strong> - Individual send tracking via Resend</li>
            <li><strong>Error Capture</strong> - Full context on any failures</li>
            <li><strong>Breadcrumb Trail</strong> - Step-by-step execution log</li>
          </ul>
        </div>

        <h3 style="color: #2d3748;">🔍 Check the Dashboard:</h3>
        <p style="color: #4a5568;">
          View the real-time performance data in your Sentry dashboard:
        </p>

        <a href="https://sentry.io/organizations/oscarginette/performance/" class="cta">
          View Sentry Dashboard →
        </a>

        <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 14px; margin: 5px 0;">
            <strong>Campaign ID:</strong> ${draftId}
          </p>
          <p style="color: #718096; font-size: 14px; margin: 5px 0;">
            <strong>Sent:</strong> ${new Date().toISOString()}
          </p>
          <p style="color: #718096; font-size: 14px; margin: 5px 0;">
            <strong>Filter in Sentry:</strong> SendCampaign
          </p>
        </div>
      </div>

      <div class="footer">
        <p>You're receiving this as part of a Sentry integration test.</p>
        <p>
          <a href="https://backstage-art.vercel.app/unsubscribe?token=TEMP_TOKEN">
            Unsubscribe
          </a>
        </p>
      </div>
    </div>
  </body>
</html>
    `;

    await sql`
      INSERT INTO email_campaigns (id, subject, html_content, status, user_id, created_at)
      VALUES (
        ${draftId},
        ${subject},
        ${htmlContent},
        'draft',
        1,
        NOW()
      )
    `;

    console.log(`   ✅ Draft created`);
    console.log(`   📝 Draft ID: ${draftId}`);
    console.log(`   📧 Subject: ${subject}\n`);

    // Step 4: Send the campaign
    console.log('4️⃣  Sending campaign via API...');
    console.log(`   📬 Recipient: ${testEmail} (only)\n`);

    const apiUrl = 'https://backstage-art.vercel.app/api/campaigns/send';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        draftId,
        userId: 1
      })
    });

    const result = await response.json();

    console.log('═══════════════════════════════════════\n');
    console.log('📊 SEND RESULT:\n');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n═══════════════════════════════════════\n');

    if (result.success) {
      console.log('✅ TEST SUCCESSFUL!\n');
      console.log('📧 Email Details:');
      console.log(`   • Sent to: ${testEmail}`);
      console.log(`   • Emails sent: ${result.emailsSent}`);
      console.log(`   • Emails failed: ${result.emailsFailed}`);
      console.log(`   • Duration: ${result.duration}ms\n`);

      console.log('📊 Check Sentry Dashboard:');
      console.log('   🔗 Performance: https://sentry.io/organizations/oscarginette/performance/');
      console.log('   🔍 Filter by: "SendCampaign"');
      console.log('   📈 Expected transaction with:');
      console.log('      - Total duration: ~250-500ms');
      console.log('      - Database queries: getCampaignById, getSubscribedContacts, markCampaignAsSent');
      console.log('      - Email send: SendEmailBatch > SendEmail');
      console.log('      - Breadcrumbs: 4 steps showing execution flow\n');

      console.log('📬 Check Your Inbox:');
      console.log(`   ${testEmail} should receive the test email\n`);

      console.log('🔄 Restoration:');
      console.log('   Run: npx tsx scripts/restore-contacts.ts');
      console.log(`   This will re-subscribe ${originallySubscribed.length} contacts and delete the test draft\n`);
    } else {
      console.error('❌ SEND FAILED!');
      console.error('   Check the error details above\n');

      console.log('🔄 Restoring contacts...');
      await restoreContacts(originallySubscribed.map(c => c.email), draftId);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    console.error('\nTest failed. Attempting to restore original state...\n');

    try {
      const state = JSON.parse(fs.readFileSync('./scripts/.test-state.json', 'utf-8'));
      await restoreContacts(state.originallySubscribed, state.draftId);
    } catch (restoreError) {
      console.error('Failed to restore:', restoreError);
    }

    process.exit(1);
  }
}

async function restoreContacts(emails: string[], draftId: string) {
  const sql = neon(process.env.POSTGRES_URL!);

  if (emails.length > 0) {
    for (const email of emails) {
      await sql`
        UPDATE contacts
        SET subscribed = true
        WHERE email = ${email}
      `;
    }
    console.log(`   ✅ Re-subscribed ${emails.length} contacts`);
  }

  await sql`
    DELETE FROM email_campaigns
    WHERE id = ${draftId}
  `;
  console.log(`   ✅ Deleted test draft: ${draftId}`);

  if (fs.existsSync('./scripts/.test-state.json')) {
    fs.unlinkSync('./scripts/.test-state.json');
  }

  console.log('   ✅ Restoration complete\n');
}

main();
