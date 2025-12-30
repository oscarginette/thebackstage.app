# Webhook Security - Signature Verification

## Overview

All webhooks in this application use cryptographic signature verification to prevent:
- **Malicious webhook injection** - Attackers sending fake webhooks
- **Replay attacks** - Attackers re-sending old valid webhooks
- **Man-in-the-middle attacks** - Tampering with webhook data in transit

## How It Works

### HMAC-SHA256 Verification

1. **Provider signs webhook**: Creates HMAC-SHA256 signature using secret key
   ```
   signature = HMAC-SHA256(timestamp.payload, secret)
   ```

2. **We verify signature**: Compute expected signature and compare
   ```
   expected = HMAC-SHA256(timestamp.payload, secret)
   valid = constant_time_compare(received, expected)
   ```

3. **Timestamp validation**: Reject webhooks older than 5 minutes (replay protection)

### Security Features

- ✅ **Cryptographic verification** - HMAC-SHA256 prevents forgery
- ✅ **Constant-time comparison** - Prevents timing attacks
- ✅ **Timestamp validation** - Prevents replay attacks (5 min window)
- ✅ **Key rotation support** - Handles multiple signatures (Resend)
- ✅ **Graceful degradation** - Optional in development, required in production

---

## Resend Webhook Setup

### 1. Create Webhook Endpoint in Resend

1. Go to [Resend Dashboard](https://resend.com/dashboard) → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   - **Development**: `https://your-vercel-preview.vercel.app/api/webhooks/resend`
   - **Production**: `https://geebeat.com/api/webhooks/resend`

4. Select events to listen to:
   - ✅ `email.sent`
   - ✅ `email.delivered`
   - ✅ `email.delivery_delayed`
   - ✅ `email.bounced`
   - ✅ `email.opened`
   - ✅ `email.clicked`

5. Click **Create endpoint**

### 2. Get Webhook Signing Secret

After creating the endpoint:

1. Click on your webhook endpoint
2. Copy the **Signing Secret** (starts with `whsec_`)
3. Add to your `.env.local`:
   ```bash
   RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 3. Deploy to Vercel

Add the secret to Vercel:

```bash
# Production
vercel env add RESEND_WEBHOOK_SECRET production

# Preview (optional, for testing)
vercel env add RESEND_WEBHOOK_SECRET preview
```

Or via Vercel Dashboard:
1. Go to your project → **Settings** → **Environment Variables**
2. Add `RESEND_WEBHOOK_SECRET`
3. Paste the signing secret
4. Select environments: Production, Preview (optional)

### 4. Verify Setup

Test with the test script:

```bash
# Generate a valid test signature
npx tsx lib/webhooks/test-signature.ts resend

# Copy the curl command and run it
curl -X POST http://localhost:3002/api/webhooks/resend \
  -H "Content-Type: application/json" \
  -H "Resend-Signature: t=1703001234,v1=abc123..." \
  -d '{"type":"email.sent",...}'
```

Expected response:
```json
{ "received": true }
```

---

## Stripe Webhook Setup

### 1. Create Webhook Endpoint in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   - **Development**: Use Stripe CLI for local testing
   - **Production**: `https://geebeat.com/api/webhooks/stripe`

4. Select events to listen to:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.deleted`
   - (Add more as needed)

5. Click **Add endpoint**

### 2. Get Webhook Signing Secret

After creating the endpoint:

1. Click on your webhook endpoint
2. Click **Reveal** next to **Signing secret**
3. Copy the secret (starts with `whsec_`)
4. Add to your `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 3. Local Testing with Stripe CLI

For local development, use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3002/api/webhooks/stripe

# This will output a webhook signing secret like:
# whsec_xxxxxxxxxxxxxxxxxxxxx
# Add this to your .env.local
```

### 4. Deploy to Vercel

Add the production secret to Vercel:

```bash
vercel env add STRIPE_WEBHOOK_SECRET production
```

### 5. Test Webhook

```bash
# Trigger a test payment (using Stripe CLI)
stripe trigger payment_intent.succeeded

# Or use test script
npx tsx lib/webhooks/test-signature.ts stripe
```

---

## Implementation Details

### Signature Format

#### Resend
```
Header: Resend-Signature
Format: t=<timestamp>,v1=<signature1>,v1=<signature2>
```

Example:
```
Resend-Signature: t=1703001234,v1=abc123def456,v1=xyz789ghi012
```

- `t` = Unix timestamp (seconds)
- `v1` = HMAC-SHA256 signature (hex)
- Multiple `v1` = Supports key rotation

#### Stripe
```
Header: Stripe-Signature
Format: t=<timestamp>,v1=<signature>
```

Example:
```
Stripe-Signature: t=1703001234,v1=abc123def456
```

### Code Example

```typescript
import { verifyResendWebhook } from '@/lib/webhooks';

export async function POST(request: Request) {
  // IMPORTANT: Read raw body BEFORE parsing JSON
  const rawBody = await request.text();
  const signature = request.headers.get('resend-signature');

  // Verify signature
  const result = verifyResendWebhook(
    rawBody,
    signature,
    process.env.RESEND_WEBHOOK_SECRET!,
    300 // 5 minutes tolerance
  );

  if (!result.valid) {
    return NextResponse.json(
      { error: result.error },
      { status: 401 }
    );
  }

  // Safe to process webhook
  const body = JSON.parse(rawBody);
  // ...
}
```

---

## Security Best Practices

### Required in Production

```typescript
// ❌ BAD: Skip verification in production
if (process.env.NODE_ENV === 'production') {
  // No verification - VULNERABLE!
}

// ✅ GOOD: Always verify in production
if (!process.env.RESEND_WEBHOOK_SECRET) {
  throw new Error('RESEND_WEBHOOK_SECRET required in production');
}
```

### Constant-Time Comparison

```typescript
// ❌ BAD: Regular comparison (timing attack vulnerable)
if (signature === expectedSignature) { ... }

// ✅ GOOD: Constant-time comparison
import crypto from 'crypto';
crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
```

### Replay Attack Prevention

```typescript
// ❌ BAD: No timestamp validation
const signature = computeSignature(payload, secret);

// ✅ GOOD: Include timestamp in signature
const signature = computeSignature(`${timestamp}.${payload}`, secret);
if (Date.now() - parseInt(timestamp) * 1000 > 300000) {
  throw new Error('Webhook too old');
}
```

### Raw Body Requirement

```typescript
// ❌ BAD: Parse JSON first (breaks signature)
const body = await request.json();
const rawBody = JSON.stringify(body); // WRONG - won't match!

// ✅ GOOD: Read raw text first
const rawBody = await request.text();
const body = JSON.parse(rawBody); // Parse after verification
```

---

## Troubleshooting

### "Invalid signature" Error

**Causes**:
1. Wrong webhook secret
2. Parsing JSON before reading raw body
3. Whitespace/encoding mismatch
4. Clock skew (timestamp validation)

**Solutions**:
```bash
# 1. Verify secret matches Resend dashboard
echo $RESEND_WEBHOOK_SECRET

# 2. Check you're using .text() not .json()
const rawBody = await request.text(); // ✅

# 3. Test with generated signature
npx tsx lib/webhooks/test-signature.ts resend

# 4. Increase timestamp tolerance temporarily
verifyResendWebhook(rawBody, signature, secret, 600) // 10 min
```

### "Webhook timestamp too old" Error

**Cause**: System clock is out of sync or webhook delivery delayed

**Solutions**:
```bash
# 1. Check system clock
date

# 2. Sync system clock (macOS)
sudo sntp -sS time.apple.com

# 3. Temporarily disable timestamp validation (development only!)
verifyResendWebhook(rawBody, signature, secret, 0) // Disable
```

### Missing Resend-Signature Header

**Cause**: Webhook endpoint not configured in Resend dashboard

**Solutions**:
1. Go to Resend Dashboard → Webhooks
2. Verify endpoint URL is correct
3. Check endpoint is enabled
4. Try deleting and recreating endpoint

### Testing in Development

```bash
# Option 1: Use test script (no real webhook)
npx tsx lib/webhooks/test-signature.ts resend

# Option 2: Use ngrok to expose localhost
ngrok http 3002
# Add ngrok URL to Resend dashboard

# Option 3: Deploy to Vercel preview
vercel --prod=false
# Add preview URL to Resend dashboard
```

---

## Environment Variables Reference

| Variable | Required | Format | Where to Get |
|----------|----------|--------|--------------|
| `RESEND_WEBHOOK_SECRET` | Production | `whsec_xxx...` | Resend Dashboard → Webhooks → [Endpoint] → Signing Secret |
| `STRIPE_WEBHOOK_SECRET` | If using Stripe | `whsec_xxx...` | Stripe Dashboard → Developers → Webhooks → [Endpoint] → Signing Secret |

---

## References

- [Resend Webhook Documentation](https://resend.com/docs/webhooks)
- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [OWASP Webhook Security](https://cheatsheetseries.owasp.org/cheatsheets/Webhook_Security_Cheat_Sheet.html)
- [HMAC-SHA256 Specification](https://datatracker.ietf.org/doc/html/rfc2104)

---

**Last Updated**: 2025-12-29
**Security Standard**: OWASP Webhook Security Cheat Sheet Compliant
