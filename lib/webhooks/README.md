# Webhook Security Library

HMAC-SHA256 signature verification for webhooks from external providers.

## Purpose

Prevents malicious webhook injection attacks by cryptographically verifying:
- Webhook authenticity (signature verification)
- Webhook freshness (timestamp validation)
- Replay attacks (5-minute tolerance window)

## Supported Providers

- ✅ **Resend** - Email delivery webhooks
- ✅ **Stripe** - Payment webhooks (use Stripe SDK recommended)
- ✅ **Hypedit** - Simple secret matching (see `/api/webhook/hypedit`)

## Quick Start

### 1. Install (already included)

```typescript
import { verifyResendWebhook } from '@/lib/webhooks';
```

### 2. Configure Webhook Secret

```bash
# .env.local
RESEND_WEBHOOK_SECRET=your_resend_webhook_secret_here
```

Get from: Resend Dashboard → Webhooks → [Your Endpoint] → Signing Secret

### 3. Verify in Your Route

```typescript
// app/api/webhooks/resend/route.ts
export async function POST(request: Request) {
  // CRITICAL: Read raw body BEFORE parsing JSON
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

  // Safe to process
  const body = JSON.parse(rawBody);
  // ...
}
```

## Testing

### Unit Tests

```bash
npm test -- lib/webhooks/__tests__/verify-signature.test.ts
```

### Local Testing Script

```bash
# Generate valid test signature
npx tsx lib/webhooks/test-signature.ts resend

# Output includes curl command for testing
curl -X POST http://localhost:3002/api/webhooks/resend \
  -H "Resend-Signature: t=1703001234,v1=abc123..." \
  -d '{"type":"email.sent",...}'
```

### Test with Custom Payload

```bash
npx tsx lib/webhooks/test-signature.ts resend '{"type":"email.bounced","data":{...}}'
```

## API Reference

### `verifyWebhookSignature(config)`

Low-level signature verification for any provider.

```typescript
interface WebhookVerificationConfig {
  provider: 'resend' | 'stripe' | 'hypedit';
  secret: string;
  signature: string;
  payload: string | Buffer;
  timestamp?: string;
  timestampTolerance?: number; // Default: 300 (5 minutes)
}

interface VerificationResult {
  valid: boolean;
  error?: string;
  errorCode?: 'INVALID_SIGNATURE' | 'REPLAY_ATTACK' | 'MISSING_CONFIG' | 'INVALID_FORMAT';
}
```

### `verifyResendWebhook(payload, signatureHeader, secret, tolerance?)`

Convenience wrapper for Resend webhooks.

```typescript
const result = verifyResendWebhook(
  rawBody,              // string | Buffer (NOT parsed JSON!)
  signatureHeader,      // "t=1703001234,v1=abc123,v1=def456"
  secret,               // whsec_xxx...
  300                   // Optional: tolerance in seconds
);
```

### `verifyStripeWebhook(payload, signatureHeader, secret)`

Convenience wrapper for Stripe webhooks.

**NOTE**: Prefer using `stripe.webhooks.constructEvent()` from Stripe SDK.

```typescript
// RECOMMENDED: Use Stripe SDK
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const event = stripe.webhooks.constructEvent(
  rawBody,
  signatureHeader,
  process.env.STRIPE_WEBHOOK_SECRET!
);
```

### `parseResendSignature(signatureHeader)`

Parses Resend signature header format.

```typescript
const { timestamp, signatures } = parseResendSignature(
  't=1703001234,v1=abc123,v1=def456'
);
// { timestamp: '1703001234', signatures: ['abc123', 'def456'] }
```

## Security Features

### 1. HMAC-SHA256

```
signature = HMAC-SHA256(timestamp.payload, secret)
```

Cryptographically secure - cannot be forged without secret key.

### 2. Constant-Time Comparison

Prevents timing attacks by using `crypto.timingSafeEqual()`.

### 3. Timestamp Validation

Rejects webhooks older than 5 minutes (default).

```typescript
const age = currentTime - webhookTimestamp;
if (age > 300) {
  return { valid: false, errorCode: 'REPLAY_ATTACK' };
}
```

### 4. Key Rotation Support

Accepts multiple signatures (Resend format):

```
Resend-Signature: t=1703001234,v1=old_signature,v1=new_signature
```

If ANY signature is valid, webhook is accepted.

## Common Issues

### "Invalid signature" Error

**Cause**: Parsing JSON before reading raw body

```typescript
// ❌ WRONG
const body = await request.json();
const rawBody = JSON.stringify(body); // Won't match!

// ✅ CORRECT
const rawBody = await request.text();
const body = JSON.parse(rawBody);
```

### "Webhook timestamp too old" Error

**Cause**: System clock out of sync or slow webhook delivery

**Solution**:
```bash
# Sync system clock (macOS)
sudo sntp -sS time.apple.com

# Or temporarily increase tolerance (development only!)
verifyResendWebhook(rawBody, signature, secret, 600) // 10 min
```

### Missing Signature Header

**Cause**: Webhook not configured in provider dashboard

**Solution**:
1. Go to provider dashboard (Resend/Stripe)
2. Add webhook endpoint
3. Copy signing secret
4. Add to `.env.local`

## Files

```
lib/webhooks/
├── README.md                    # This file
├── index.ts                     # Public exports
├── verify-signature.ts          # Core verification logic
├── test-signature.ts            # Testing script
└── __tests__/
    └── verify-signature.test.ts # Unit tests
```

## Documentation

- [Webhook Security Guide](/docs/setup/WEBHOOK-SECURITY.md)
- [Resend Webhook Docs](https://resend.com/docs/webhooks)
- [Stripe Webhook Docs](https://stripe.com/docs/webhooks)
- [OWASP Webhook Security](https://cheatsheetseries.owasp.org/cheatsheets/Webhook_Security_Cheat_Sheet.html)

## Architecture

This is an **infrastructure concern** (Clean Architecture):

```
app/api/webhooks/resend/     ← Presentation layer (orchestration)
       ↓
lib/webhooks/                ← Infrastructure layer (security)
       ↓
domain/services/             ← Domain layer (business logic)
```

Signature verification happens BEFORE business logic.

---

**Security Standard**: OWASP Webhook Security Cheat Sheet Compliant
**Last Updated**: 2025-12-29
