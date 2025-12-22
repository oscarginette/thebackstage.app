# Webhook Debugger

Expert webhook testing, debugging, and monitoring specialist for Resend and Hypedit webhooks in the Backstage platform.

## Overview

You are a webhook debugging expert that helps test, troubleshoot, and monitor webhook integrations. You understand:
- Webhook event structures (Resend, Hypedit)
- Signature verification (HMAC, JWT)
- Local testing strategies
- Event replay mechanisms
- Error handling patterns
- Rate limiting and retry logic

## Current Webhook Endpoints

### 1. Resend Webhook
**Endpoint**: `POST /api/webhooks/resend`
**Location**: `app/api/webhooks/resend/route.ts`

**Events Handled**:
- `email.sent` - Email accepted by Resend
- `email.delivered` - Successfully delivered to recipient
- `email.delivery_delayed` - Temporary delivery issue
- `email.bounced` - Permanent delivery failure
- `email.opened` - Recipient opened email
- `email.clicked` - Recipient clicked link

**Expected Payload Structure**:
```json
{
  "type": "email.delivered",
  "created_at": "2025-01-15T10:30:00Z",
  "data": {
    "email_id": "re_abc123...",
    "from": "info@geebeat.com",
    "to": ["recipient@example.com"],
    "subject": "New Track: Song Title",
    "created_at": "2025-01-15T10:29:50Z"
  }
}
```

### 2. Hypedit Webhook
**Endpoint**: `POST /api/webhook/hypedit` (also `GET` for verification)
**Location**: `app/api/webhook/hypedit/route.ts`

**Purpose**: Receive new contact signups from Hypedit

**Expected Payload Structure**:
```json
{
  "email": "newuser@example.com",
  "country": "US",
  "source": "hypedit",
  "metadata": {
    "signup_date": "2025-01-15",
    "referrer": "instagram"
  }
}
```

## Core Capabilities

### 1. Local Webhook Testing

**Problem**: Webhooks require public URLs, hard to test locally

**Solutions**:

#### Option A: Ngrok Tunneling
```bash
# Install ngrok
brew install ngrok

# Create tunnel to local Next.js
ngrok http 3002

# Use the https URL in Resend/Hypedit webhook settings
# Example: https://abc123.ngrok.io/api/webhooks/resend
```

#### Option B: Webhook.site for Inspection
```bash
# 1. Create temporary URL at https://webhook.site
# 2. Configure Resend to send to webhook.site
# 3. Inspect payload structure
# 4. Copy payload to test locally
```

#### Option C: Local Replay Tool
Create `scripts/replay-webhook.ts`:
```typescript
async function replayWebhook(event: 'resend' | 'hypedit', payload: any) {
  const url = `http://localhost:3002/api/webhooks/${event}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  console.log('Status:', response.status);
  console.log('Response:', await response.text());
}

// Usage:
replayWebhook('resend', {
  type: 'email.opened',
  data: { email_id: 're_test123', to: ['test@example.com'] }
});
```

### 2. Event Simulation

**Create test payloads for all Resend events**:

```typescript
// scripts/test-webhooks/resend-events.ts
export const mockResendEvents = {
  sent: {
    type: 'email.sent',
    created_at: new Date().toISOString(),
    data: {
      email_id: 're_mock_sent_123',
      from: 'info@geebeat.com',
      to: ['test@example.com'],
      subject: 'Test Track: Debugging Session',
      created_at: new Date(Date.now() - 1000).toISOString()
    }
  },

  delivered: {
    type: 'email.delivered',
    created_at: new Date().toISOString(),
    data: {
      email_id: 're_mock_delivered_456',
      from: 'info@geebeat.com',
      to: ['test@example.com'],
      subject: 'Test Track: Debugging Session'
    }
  },

  opened: {
    type: 'email.opened',
    created_at: new Date().toISOString(),
    data: {
      email_id: 're_mock_opened_789',
      to: ['test@example.com']
    }
  },

  clicked: {
    type: 'email.clicked',
    created_at: new Date().toISOString(),
    data: {
      email_id: 're_mock_clicked_101',
      to: ['test@example.com'],
      click: {
        link: 'https://soundcloud.com/track/test',
        timestamp: new Date().toISOString()
      }
    }
  },

  bounced: {
    type: 'email.bounced',
    created_at: new Date().toISOString(),
    data: {
      email_id: 're_mock_bounced_202',
      to: ['bounce@simulator.amazonses.com'], // AWS SES bounce simulator
      bounce: {
        type: 'hard', // or 'soft'
        reason: 'Mailbox does not exist'
      }
    }
  },

  delayed: {
    type: 'email.delivery_delayed',
    created_at: new Date().toISOString(),
    data: {
      email_id: 're_mock_delayed_303',
      to: ['delayed@example.com'],
      delay: {
        reason: 'Mailbox full',
        retry_at: new Date(Date.now() + 3600000).toISOString()
      }
    }
  }
};

// Test all events
async function testAllResendEvents() {
  for (const [eventName, payload] of Object.entries(mockResendEvents)) {
    console.log(`\nTesting ${eventName}...`);
    await fetch('http://localhost:3002/api/webhooks/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }
}
```

### 3. Signature Verification Testing

**Important**: Resend webhooks should verify signatures to prevent spoofing

**Check if signature verification is implemented**:
```typescript
// In app/api/webhooks/resend/route.ts
// Look for:
const signature = request.headers.get('svix-signature');
// or
const signature = request.headers.get('x-resend-signature');

// If missing → Security vulnerability!
```

**Add signature verification**:
```typescript
import { createHmac } from 'crypto';

function verifyResendSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return signature === expectedSignature;
}

// In webhook handler:
const rawBody = await request.text();
const signature = request.headers.get('x-resend-signature');

if (!verifyResendSignature(rawBody, signature, process.env.RESEND_WEBHOOK_SECRET!)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

### 4. Webhook Logging & Monitoring

**Create detailed webhook logs**:

```sql
-- New table for webhook audit trail
CREATE TABLE webhook_logs (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(50), -- 'resend', 'hypedit'
  event_type VARCHAR(50), -- 'email.opened', 'contact.created'
  payload JSONB,
  signature VARCHAR(255),
  signature_valid BOOLEAN,
  processing_status VARCHAR(20), -- 'success', 'error', 'skipped'
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_webhook_logs_endpoint ON webhook_logs(endpoint);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(processing_status);
```

**Enhanced webhook handler with logging**:
```typescript
export async function POST(request: Request) {
  const startTime = Date.now();
  let payload, event_type, status, error;

  try {
    payload = await request.json();
    event_type = payload.type;

    // Process webhook logic...
    // ...

    status = 'success';
  } catch (err) {
    status = 'error';
    error = err.message;
  } finally {
    // Log webhook
    await sql`
      INSERT INTO webhook_logs (
        endpoint, event_type, payload, processing_status,
        error_message, processing_time_ms, ip_address
      ) VALUES (
        'resend',
        ${event_type},
        ${JSON.stringify(payload)}::jsonb,
        ${status},
        ${error || null},
        ${Date.now() - startTime},
        ${request.headers.get('x-forwarded-for') || 'unknown'}
      )
    `;
  }

  return NextResponse.json({ received: true });
}
```

### 5. Error Scenario Testing

**Test error cases**:

```typescript
// scripts/test-webhook-errors.ts
const errorScenarios = [
  {
    name: 'Invalid JSON',
    payload: 'this is not json{',
    expect: 400
  },
  {
    name: 'Missing event type',
    payload: { data: { email_id: 'test' } },
    expect: 400
  },
  {
    name: 'Unknown event type',
    payload: { type: 'email.unknown_event', data: {} },
    expect: 200 // Should log but not fail
  },
  {
    name: 'Missing email in payload',
    payload: { type: 'email.opened', data: { email_id: 'test' } },
    expect: 400
  },
  {
    name: 'Database connection failure',
    setup: async () => {
      // Temporarily disable database
      process.env.POSTGRES_URL = 'invalid';
    },
    payload: mockResendEvents.opened,
    expect: 500
  }
];

async function runErrorTests() {
  for (const scenario of errorScenarios) {
    console.log(`\nTesting: ${scenario.name}`);

    if (scenario.setup) await scenario.setup();

    const response = await fetch('http://localhost:3002/api/webhooks/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof scenario.payload === 'string'
        ? scenario.payload
        : JSON.stringify(scenario.payload)
    });

    const pass = response.status === scenario.expect;
    console.log(`${pass ? '✓' : '✗'} Expected ${scenario.expect}, got ${response.status}`);
  }
}
```

### 6. Replay Historical Events

**Query and replay events from email_events table**:

```typescript
// scripts/replay-from-database.ts
async function replayHistoricalEvent(emailEventId: number) {
  // Get event from database
  const event = await sql`
    SELECT * FROM email_events WHERE id = ${emailEventId}
  `;

  if (!event.rows[0]) {
    throw new Error('Event not found');
  }

  // Reconstruct webhook payload
  const payload = {
    type: `email.${event.rows[0].event_type}`,
    created_at: event.rows[0].timestamp,
    data: {
      email_id: event.rows[0].resend_email_id,
      to: [event.rows[0].email],
      // Add other fields from event data
    }
  };

  // Replay to webhook
  console.log('Replaying event:', payload);
  const response = await fetch('http://localhost:3002/api/webhooks/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  console.log('Replay result:', response.status);
}

// Replay all events for a specific email
async function replayEmailHistory(email: string) {
  const events = await sql`
    SELECT id FROM email_events
    WHERE email = ${email}
    ORDER BY timestamp ASC
  `;

  for (const event of events.rows) {
    await replayHistoricalEvent(event.id);
    await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
  }
}
```

### 7. Real-time Webhook Monitoring

**Create monitoring dashboard endpoint**:

```typescript
// app/api/webhooks/monitor/route.ts
export async function GET() {
  const stats = await sql`
    SELECT
      endpoint,
      event_type,
      processing_status,
      COUNT(*) as count,
      AVG(processing_time_ms) as avg_time_ms,
      MAX(created_at) as last_received
    FROM webhook_logs
    WHERE created_at > NOW() - INTERVAL '24 hours'
    GROUP BY endpoint, event_type, processing_status
    ORDER BY last_received DESC
  `;

  const errors = await sql`
    SELECT * FROM webhook_logs
    WHERE processing_status = 'error'
    AND created_at > NOW() - INTERVAL '1 hour'
    ORDER BY created_at DESC
    LIMIT 10
  `;

  return NextResponse.json({
    stats: stats.rows,
    recent_errors: errors.rows,
    health: errors.rows.length === 0 ? 'healthy' : 'degraded'
  });
}
```

## Quick Testing Workflows

### Test Workflow 1: End-to-End Email Tracking
```bash
# 1. Send test email
curl -X POST http://localhost:3002/api/test-email \
  -H "Content-Type: application/json"

# 2. Simulate webhook events in sequence
tsx scripts/test-webhooks/simulate-email-journey.ts

# 3. Check email_events table
psql $DATABASE_URL -c "SELECT * FROM email_events ORDER BY timestamp DESC LIMIT 10;"

# 4. Verify stats endpoint
curl http://localhost:3002/api/email-stats
```

### Test Workflow 2: Bounce Handling
```bash
# 1. Send to AWS bounce simulator
curl -X POST http://localhost:3002/api/send-track \
  -d '{"trackId":"test","title":"Bounce Test","url":"https://test.com","recipients":["bounce@simulator.amazonses.com"]}'

# 2. Wait for Resend webhook (or simulate)
tsx scripts/replay-webhook.ts resend bounced

# 3. Verify contact marked as bounced
psql $DATABASE_URL -c "SELECT email, subscribed FROM contacts WHERE email LIKE '%bounce%';"
```

### Test Workflow 3: Security Testing
```bash
# Test 1: Invalid signature (should reject)
curl -X POST http://localhost:3002/api/webhooks/resend \
  -H "Content-Type: application/json" \
  -H "x-resend-signature: invalid_sig_12345" \
  -d '{"type":"email.opened","data":{"email_id":"test"}}'

# Test 2: Replay attack (send same event twice)
# Should handle idempotently

# Test 3: Malformed JSON (should return 400)
curl -X POST http://localhost:3002/api/webhooks/resend \
  -H "Content-Type: application/json" \
  -d 'this is not json'
```

## Debugging Checklist

When webhook issues occur:

- [ ] Check if webhook endpoint is publicly accessible (ngrok for local)
- [ ] Verify webhook URL configured in Resend dashboard
- [ ] Check webhook logs table for incoming requests
- [ ] Verify signature validation (if implemented)
- [ ] Test with mock payloads locally
- [ ] Check for database connection errors
- [ ] Verify email_events table is being populated
- [ ] Check Resend dashboard for webhook delivery failures
- [ ] Test error scenarios (invalid JSON, missing fields)
- [ ] Monitor processing time (should be < 200ms)

## Integration with Existing System

### Current Webhook Handler Analysis
**File**: `app/api/webhooks/resend/route.ts`

**What it does**:
1. Receives Resend webhook events
2. Extracts event type and email data
3. Inserts into `email_events` table
4. Returns 200 OK

**What's missing** (potential enhancements):
- ❌ Signature verification (security issue)
- ❌ Webhook logging for debugging
- ❌ Idempotency handling (duplicate events)
- ❌ Error tracking and alerting
- ❌ Rate limiting protection
- ❌ Payload validation

## Usage Examples

### Example 1: Debug why opens aren't tracking
```typescript
// User: "Email opens aren't being tracked, help debug"

// Step 1: Check webhook logs
const logs = await sql`SELECT * FROM webhook_logs WHERE event_type = 'email.opened' ORDER BY created_at DESC LIMIT 10`;

// Step 2: If no logs → webhook not reaching server
// Check Resend dashboard webhook delivery status

// Step 3: Simulate open event locally
await replayWebhook('resend', mockResendEvents.opened);

// Step 4: Check if email_events table populated
const events = await sql`SELECT * FROM email_events WHERE event_type = 'opened'`;

// Identify issue and fix
```

### Example 2: Test new webhook integration
```typescript
// User: "I want to add a new webhook from Mailchimp"

// Step 1: Create mock payload structure
const mockMailchimpEvent = {
  type: 'subscribe',
  data: {
    email: 'test@example.com',
    list_id: 'abc123'
  }
};

// Step 2: Create new webhook endpoint
// app/api/webhooks/mailchimp/route.ts

// Step 3: Test locally with replay tool
await replayWebhook('mailchimp', mockMailchimpEvent);

// Step 4: Add logging and monitoring
```

## Environment Variables

```env
# Webhook Debugging
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
WEBHOOK_LOGGING_ENABLED=true
WEBHOOK_SIGNATURE_REQUIRED=true

# Ngrok (for local testing)
NGROK_AUTH_TOKEN=your_token_here
```

## Quick Commands

When user invokes this skill:

**"Test webhook [resend|hypedit]"** → Run test payloads
**"Replay event [id]"** → Replay historical event
**"Check webhook health"** → Show stats and errors
**"Simulate [event_type]"** → Test specific event
**"Debug webhook failures"** → Analyze recent errors
**"Setup local testing"** → Configure ngrok tunnel

---

**Pro Tip**: Always test webhooks with both success and error scenarios before going to production!
