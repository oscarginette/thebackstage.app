# Webhook Signature Verification Tests

This directory contains comprehensive test suites for webhook signature verification.

## Overview

The webhook signature verification system protects against:
- **Unauthorized webhook calls** - HMAC-SHA256 signature verification
- **Replay attacks** - Timestamp validation (15 minutes for Mailgun, 5 minutes for Resend)
- **Timing attacks** - Constant-time comparison using `crypto.timingSafeEqual()`

## Test Coverage

### Mailgun Webhook Tests (`verify-mailgun-signature.test.ts`)

**19 tests covering:**
- ✅ Valid signatures with current and old timestamps
- ✅ Invalid signatures (wrong signature, modified timestamp/token, wrong key)
- ✅ Replay attack prevention (15-minute window)
- ✅ Invalid input handling (non-numeric timestamp, empty values, length mismatch)
- ✅ Timing attack prevention (constant-time comparison)
- ✅ Real-world scenarios (typical payloads, attacker simulations)
- ✅ Edge cases (long tokens, special characters, Unicode)

### Resend Webhook Tests (`verify-resend-signature.test.ts`)

**28 tests covering:**
- ✅ Valid signatures with current and old timestamps
- ✅ Multiple signatures (key rotation support)
- ✅ Invalid signatures (wrong signature, modified payload, wrong secret)
- ✅ Replay attack prevention (5-minute window, custom tolerance)
- ✅ Signature header parsing (timestamp extraction, multiple signatures)
- ✅ Invalid input handling (empty header, malformed header, non-numeric timestamp)
- ✅ Real-world scenarios (typical Resend payloads, large payloads, modified payloads)
- ✅ Buffer support (UTF-8, Unicode)
- ✅ Edge cases (special characters, Unicode, empty payload)
- ✅ Security guarantees (timing attacks, signature stripping, timestamp manipulation)

## Running Tests

```bash
# Run all webhook tests
npm test -- __tests__/lib/webhooks/

# Run Mailgun tests only
npm test -- __tests__/lib/webhooks/verify-mailgun-signature.test.ts

# Run Resend tests only
npm test -- __tests__/lib/webhooks/verify-resend-signature.test.ts

# Watch mode
npm test -- __tests__/lib/webhooks/ --watch
```

## Manual Testing

### Testing Mailgun Webhook Signature

```bash
# Generate a valid Mailgun webhook signature
node -e "
const crypto = require('crypto');
const timestamp = Math.floor(Date.now() / 1000).toString();
const token = crypto.randomBytes(32).toString('hex');
const signingKey = 'your_mailgun_signing_key';
const signature = crypto.createHmac('sha256', signingKey).update(timestamp + token).digest('hex');

console.log('Headers for cURL request:');
console.log('-H \"X-Mailgun-Timestamp: ' + timestamp + '\"');
console.log('-H \"X-Mailgun-Token: ' + token + '\"');
console.log('-H \"X-Mailgun-Signature: ' + signature + '\"');
"

# Test webhook endpoint
curl -X POST http://localhost:3000/api/webhooks/mailgun \
  -H "X-Mailgun-Timestamp: <timestamp>" \
  -H "X-Mailgun-Token: <token>" \
  -H "X-Mailgun-Signature: <signature>" \
  -H "Content-Type: application/json" \
  -d '{
    "event-data": {
      "event": "delivered",
      "message": {
        "headers": {
          "message-id": "test-message-123"
        }
      },
      "recipient": "user@example.com",
      "timestamp": 1234567890
    }
  }'
```

### Testing Resend Webhook Signature

```bash
# Generate a valid Resend webhook signature
node -e "
const crypto = require('crypto');
const timestamp = Math.floor(Date.now() / 1000).toString();
const payload = JSON.stringify({ type: 'email.sent', data: { email_id: 'test-123' } });
const secret = 'whsec_your_resend_webhook_secret';
const signedPayload = timestamp + '.' + payload;
const signature = crypto.createHmac('sha256', secret).update(signedPayload, 'utf-8').digest('hex');
const header = 't=' + timestamp + ',v1=' + signature;

console.log('Resend-Signature header:');
console.log(header);
console.log('');
console.log('Payload:');
console.log(payload);
"

# Test webhook endpoint
curl -X POST http://localhost:3000/api/webhooks/resend \
  -H "Resend-Signature: <signature_header>" \
  -H "Content-Type: application/json" \
  -d '{"type":"email.sent","data":{"email_id":"test-123"}}'
```

### Testing Invalid Signatures (Should Fail)

```bash
# Test with invalid signature (should return 401)
curl -X POST http://localhost:3000/api/webhooks/mailgun \
  -H "X-Mailgun-Timestamp: 1234567890" \
  -H "X-Mailgun-Token: fake_token" \
  -H "X-Mailgun-Signature: invalid_signature" \
  -H "Content-Type: application/json" \
  -d '{"event-data":{"event":"delivered"}}'

# Expected response: {"error":"Invalid signature"} with HTTP 401
```

### Testing Replay Attacks (Should Fail)

```bash
# Test with old timestamp (should return 401)
node -e "
const crypto = require('crypto');
const oldTimestamp = (Math.floor(Date.now() / 1000) - 1000).toString(); // 16+ minutes ago
const token = crypto.randomBytes(32).toString('hex');
const signingKey = 'your_mailgun_signing_key';
const signature = crypto.createHmac('sha256', signingKey).update(oldTimestamp + token).digest('hex');

console.log('curl -X POST http://localhost:3000/api/webhooks/mailgun \\\\');
console.log('  -H \"X-Mailgun-Timestamp: ' + oldTimestamp + '\" \\\\');
console.log('  -H \"X-Mailgun-Token: ' + token + '\" \\\\');
console.log('  -H \"X-Mailgun-Signature: ' + signature + '\"');
"

# Expected response: {"error":"Invalid signature"} with HTTP 401
```

## Implementation Details

### Mailgun Signature Verification

**Algorithm:** HMAC-SHA256
**Format:** `HMAC-SHA256(timestamp + token, signing_key)`
**Headers:**
- `X-Mailgun-Timestamp` - Unix timestamp in seconds
- `X-Mailgun-Token` - Random token generated by Mailgun
- `X-Mailgun-Signature` - HMAC-SHA256 hex digest

**Replay Attack Prevention:**
- Maximum age: 15 minutes (900 seconds)
- Uses `Math.abs()` to handle clock skew in both directions

**Security Features:**
- Constant-time comparison using `crypto.timingSafeEqual()`
- Validates timestamp format (numeric check)
- Logs failed verification attempts (without exposing secrets)

### Resend Signature Verification

**Algorithm:** HMAC-SHA256
**Format:** `HMAC-SHA256(timestamp.payload, secret)`
**Header:** `Resend-Signature: t=timestamp,v1=signature1,v1=signature2`

**Key Rotation Support:**
- Multiple `v1=signature` values supported
- Verification succeeds if ANY signature matches
- Allows seamless secret rotation

**Replay Attack Prevention:**
- Default: 5 minutes (300 seconds)
- Configurable tolerance via `timestampTolerance` parameter

**Security Features:**
- Constant-time comparison using `crypto.timingSafeEqual()`
- Timestamp validation (prevents replay attacks)
- Buffer and string payload support
- UTF-8 encoding for Unicode support

## Environment Variables

Add these to your `.env` file:

```bash
# Mailgun Webhook Verification
MAILGUN_WEBHOOK_SIGNING_KEY=your_mailgun_signing_key_here

# Resend Webhook Verification
RESEND_WEBHOOK_SECRET=whsec_your_resend_webhook_secret
```

**How to get signing keys:**

**Mailgun:**
1. Go to Mailgun Dashboard → Settings → Webhooks
2. Select your domain
3. Copy "HTTP webhook signing key"

**Resend:**
1. Go to Resend Dashboard → Webhooks
2. Click on your webhook endpoint
3. Copy "Signing Secret" (starts with `whsec_`)

## Security Best Practices

1. **ALWAYS verify signatures in production** - Never skip verification
2. **Use environment variables** - Never hardcode secrets
3. **Validate timestamps** - Prevent replay attacks
4. **Use constant-time comparison** - Prevent timing attacks
5. **Log failures** - Monitor for attack attempts (without exposing secrets)
6. **Generic error messages** - Don't reveal verification details to attackers
7. **HTTPS only** - Never accept webhooks over HTTP in production

## Troubleshooting

### "Invalid signature" errors

1. Check that `MAILGUN_WEBHOOK_SIGNING_KEY` or `RESEND_WEBHOOK_SECRET` is set correctly
2. Verify you're using the correct signing key (not API key)
3. Ensure payload hasn't been modified (use raw body, not parsed JSON)
4. Check timestamp is within allowed window

### "Timestamp too old" errors

1. Check server clock is synchronized (NTP)
2. Verify timestamp tolerance is sufficient
3. Check for network delays

### Tests failing

1. Ensure dependencies are installed: `npm install`
2. Check Node.js version: `node --version` (should be 18+)
3. Clear test cache: `npm test -- --clearCache`

## References

- [Mailgun Webhook Documentation](https://documentation.mailgun.com/en/latest/user-manual/webhooks.html#securing-webhooks)
- [Resend Webhook Documentation](https://resend.com/docs/webhooks)
- [OWASP Webhook Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Webhook_Security_Cheat_Sheet.html)
- [Svix Webhook Verification](https://docs.svix.com/receiving/verifying-payloads/how) (Resend uses Svix)
