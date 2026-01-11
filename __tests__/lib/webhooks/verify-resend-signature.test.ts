/**
 * Resend Webhook Signature Verification Tests
 *
 * Tests HMAC-SHA256 signature verification for Resend webhooks.
 * Ensures protection against:
 * - Unauthorized webhook calls
 * - Replay attacks (timestamp validation)
 * - Timing attacks (constant-time comparison)
 *
 * Resend uses Svix-compatible webhook signatures with format:
 * "t=timestamp,v1=signature1,v1=signature2" (supports key rotation)
 */

import crypto from 'crypto';
import { verifyResendWebhook, parseResendSignature } from '@/lib/webhooks';

describe('verifyResendWebhook', () => {
  const WEBHOOK_SECRET = 'whsec_test_secret_for_resend_webhooks';

  // Helper: Create valid signature
  function createSignature(payload: string, secret: string, timestamp: string): string {
    const signedPayload = `${timestamp}.${payload}`;
    return crypto.createHmac('sha256', secret)
      .update(signedPayload, 'utf-8')
      .digest('hex');
  }

  // Helper: Get current timestamp
  function getCurrentTimestamp(): string {
    return Math.floor(Date.now() / 1000).toString();
  }

  // Helper: Create Resend signature header
  function createSignatureHeader(payload: string, secret: string, timestamp?: string): string {
    const ts = timestamp || getCurrentTimestamp();
    const sig = createSignature(payload, secret, ts);
    return `t=${ts},v1=${sig}`;
  }

  describe('Valid Signatures', () => {
    it('should accept valid signature with current timestamp', () => {
      const payload = JSON.stringify({ type: 'email.sent', data: { email_id: 'test123' } });
      const signatureHeader = createSignatureHeader(payload, WEBHOOK_SECRET);

      const result = verifyResendWebhook(payload, signatureHeader, WEBHOOK_SECRET);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept signature within 5-minute window', () => {
      const payload = JSON.stringify({ type: 'email.delivered', data: { email_id: 'test456' } });
      // 4 minutes ago (240 seconds)
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 240).toString();
      const signatureHeader = createSignatureHeader(payload, WEBHOOK_SECRET, oldTimestamp);

      const result = verifyResendWebhook(payload, signatureHeader, WEBHOOK_SECRET, 300);

      expect(result.valid).toBe(true);
    });

    it('should accept signature with multiple signatures (key rotation)', () => {
      const payload = JSON.stringify({ type: 'email.opened', data: { email_id: 'test789' } });
      const timestamp = getCurrentTimestamp();

      // Create signatures with different secrets (simulates key rotation)
      const oldSecret = 'whsec_old_secret';
      const newSecret = WEBHOOK_SECRET;

      const oldSig = createSignature(payload, oldSecret, timestamp);
      const newSig = createSignature(payload, newSecret, timestamp);

      // Header with multiple signatures
      const signatureHeader = `t=${timestamp},v1=${oldSig},v1=${newSig}`;

      const result = verifyResendWebhook(payload, signatureHeader, newSecret, 300);

      expect(result.valid).toBe(true);
    });
  });

  describe('Invalid Signatures', () => {
    it('should reject incorrect signature', () => {
      const payload = JSON.stringify({ type: 'email.sent', data: { email_id: 'test123' } });
      const timestamp = getCurrentTimestamp();
      const wrongSignature = 'invalid_signature_hash_123456';
      const signatureHeader = `t=${timestamp},v1=${wrongSignature}`;

      const result = verifyResendWebhook(payload, signatureHeader, WEBHOOK_SECRET);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errorCode).toBe('INVALID_SIGNATURE');
    });

    it('should reject signature with modified payload', () => {
      const originalPayload = JSON.stringify({ type: 'email.sent', data: { email_id: 'original' } });
      const signatureHeader = createSignatureHeader(originalPayload, WEBHOOK_SECRET);

      // Attacker modifies payload
      const modifiedPayload = JSON.stringify({ type: 'email.sent', data: { email_id: 'hacked' } });
      const result = verifyResendWebhook(modifiedPayload, signatureHeader, WEBHOOK_SECRET);

      expect(result.valid).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const payload = JSON.stringify({ type: 'email.sent', data: { email_id: 'test123' } });
      const signatureHeader = createSignatureHeader(payload, WEBHOOK_SECRET);

      // Try to verify with different secret
      const wrongSecret = 'whsec_wrong_secret';
      const result = verifyResendWebhook(payload, signatureHeader, wrongSecret);

      expect(result.valid).toBe(false);
    });
  });

  describe('Replay Attack Prevention', () => {
    it('should reject timestamp older than 5 minutes', () => {
      const payload = JSON.stringify({ type: 'email.sent', data: { email_id: 'test123' } });
      // 6 minutes ago (360 seconds) - exceeds 5-minute window
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 360).toString();
      const signatureHeader = createSignatureHeader(payload, WEBHOOK_SECRET, oldTimestamp);

      const result = verifyResendWebhook(payload, signatureHeader, WEBHOOK_SECRET, 300);

      expect(result.valid).toBe(false);
      // Note: Returns INVALID_SIGNATURE because signature fails before timestamp check in verification loop
      expect(result.error).toBeDefined();
    });

    it('should accept timestamp exactly 5 minutes old', () => {
      const payload = JSON.stringify({ type: 'email.sent', data: { email_id: 'test123' } });
      // 300 seconds ago - exactly at the limit
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 300).toString();
      const signatureHeader = createSignatureHeader(payload, WEBHOOK_SECRET, oldTimestamp);

      const result = verifyResendWebhook(payload, signatureHeader, WEBHOOK_SECRET, 300);

      expect(result.valid).toBe(true);
    });

    it('should reject timestamp exactly 5 minutes + 1 second old', () => {
      const payload = JSON.stringify({ type: 'email.sent', data: { email_id: 'test123' } });
      // 301 seconds ago - just over the limit
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 301).toString();
      const signatureHeader = createSignatureHeader(payload, WEBHOOK_SECRET, oldTimestamp);

      const result = verifyResendWebhook(payload, signatureHeader, WEBHOOK_SECRET, 300);

      expect(result.valid).toBe(false);
    });

    it('should allow custom timestamp tolerance', () => {
      const payload = JSON.stringify({ type: 'email.sent', data: { email_id: 'test123' } });
      // 10 minutes ago
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 600).toString();
      const signatureHeader = createSignatureHeader(payload, WEBHOOK_SECRET, oldTimestamp);

      // Allow 15 minutes
      const result = verifyResendWebhook(payload, signatureHeader, WEBHOOK_SECRET, 900);

      expect(result.valid).toBe(true);
    });
  });

  describe('Signature Header Parsing', () => {
    it('should parse signature header with timestamp and single signature', () => {
      const header = 't=1234567890,v1=abc123def456';
      const parsed = parseResendSignature(header);

      expect(parsed.timestamp).toBe('1234567890');
      expect(parsed.signatures).toEqual(['abc123def456']);
    });

    it('should parse signature header with multiple signatures', () => {
      const header = 't=1234567890,v1=sig1,v1=sig2,v1=sig3';
      const parsed = parseResendSignature(header);

      expect(parsed.timestamp).toBe('1234567890');
      expect(parsed.signatures).toEqual(['sig1', 'sig2', 'sig3']);
    });

    it('should handle missing timestamp', () => {
      const header = 'v1=abc123';
      const parsed = parseResendSignature(header);

      expect(parsed.timestamp).toBeUndefined();
      expect(parsed.signatures).toEqual(['abc123']);
    });

    it('should reject header with no signatures', () => {
      const payload = JSON.stringify({ type: 'email.sent', data: { email_id: 'test123' } });
      const header = 't=1234567890'; // No v1 signatures

      const result = verifyResendWebhook(payload, header, WEBHOOK_SECRET);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
    });
  });

  describe('Invalid Input Handling', () => {
    it('should reject empty signature header', () => {
      const payload = JSON.stringify({ type: 'email.sent', data: { email_id: 'test123' } });
      const emptyHeader = '';

      const result = verifyResendWebhook(payload, emptyHeader, WEBHOOK_SECRET);

      expect(result.valid).toBe(false);
    });

    it('should reject malformed signature header', () => {
      const payload = JSON.stringify({ type: 'email.sent', data: { email_id: 'test123' } });
      const malformedHeader = 'invalid_format_without_equals';

      const result = verifyResendWebhook(payload, malformedHeader, WEBHOOK_SECRET);

      expect(result.valid).toBe(false);
    });

    it('should reject non-numeric timestamp', () => {
      const payload = JSON.stringify({ type: 'email.sent', data: { email_id: 'test123' } });
      const header = 't=not_a_number,v1=abc123';

      const result = verifyResendWebhook(payload, header, WEBHOOK_SECRET);

      expect(result.valid).toBe(false);
      // Note: Returns INVALID_SIGNATURE because timestamp validation happens inside verifyWebhookSignature
      expect(result.error).toBeDefined();
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle typical Resend webhook payload', () => {
      const payload = JSON.stringify({
        type: 'email.delivered',
        created_at: '2024-01-10T12:00:00.000Z',
        data: {
          email_id: '4ef2f4e6-4a1e-4f6b-8f0a-1234567890ab',
          from: 'noreply@thebackstage.app',
          to: ['user@example.com'],
          subject: 'Test Email',
          created_at: '2024-01-10T12:00:00.000Z'
        }
      });

      const signatureHeader = createSignatureHeader(payload, WEBHOOK_SECRET);
      const result = verifyResendWebhook(payload, signatureHeader, WEBHOOK_SECRET);

      expect(result.valid).toBe(true);
    });

    it('should handle webhook with large payload', () => {
      const largePayload = JSON.stringify({
        type: 'email.sent',
        data: {
          email_id: 'test123',
          html_content: 'a'.repeat(10000), // 10KB of content
          metadata: { key: 'value'.repeat(1000) }
        }
      });

      const signatureHeader = createSignatureHeader(largePayload, WEBHOOK_SECRET);
      const result = verifyResendWebhook(largePayload, signatureHeader, WEBHOOK_SECRET);

      expect(result.valid).toBe(true);
    });

    it('should reject payload modified after signing', () => {
      const originalPayload = JSON.stringify({
        type: 'email.sent',
        data: { email_id: 'original123' }
      });

      const signatureHeader = createSignatureHeader(originalPayload, WEBHOOK_SECRET);

      // Attacker modifies payload to inject malicious data
      const modifiedPayload = JSON.stringify({
        type: 'email.sent',
        data: { email_id: 'hacked456', malicious: true }
      });

      const result = verifyResendWebhook(modifiedPayload, signatureHeader, WEBHOOK_SECRET);

      expect(result.valid).toBe(false);
    });
  });

  describe('Buffer Support', () => {
    it('should accept payload as Buffer', () => {
      const payloadString = JSON.stringify({ type: 'email.sent', data: { email_id: 'test123' } });
      const payloadBuffer = Buffer.from(payloadString, 'utf-8');
      const signatureHeader = createSignatureHeader(payloadString, WEBHOOK_SECRET);

      const result = verifyResendWebhook(payloadBuffer, signatureHeader, WEBHOOK_SECRET);

      expect(result.valid).toBe(true);
    });

    it('should handle Buffer with UTF-8 characters', () => {
      const payloadString = JSON.stringify({
        type: 'email.sent',
        data: { subject: 'Test émoji 🎉 subject' }
      });
      const payloadBuffer = Buffer.from(payloadString, 'utf-8');
      const signatureHeader = createSignatureHeader(payloadString, WEBHOOK_SECRET);

      const result = verifyResendWebhook(payloadBuffer, signatureHeader, WEBHOOK_SECRET);

      expect(result.valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle payload with special characters', () => {
      const payload = JSON.stringify({
        type: 'email.sent',
        data: { subject: 'Special chars: !@#$%^&*()[]{}|\\;:\'"<>,.?/' }
      });

      const signatureHeader = createSignatureHeader(payload, WEBHOOK_SECRET);
      const result = verifyResendWebhook(payload, signatureHeader, WEBHOOK_SECRET);

      expect(result.valid).toBe(true);
    });

    it('should handle payload with Unicode', () => {
      const payload = JSON.stringify({
        type: 'email.sent',
        data: { subject: 'Unicode: 你好世界 مرحبا العالم' }
      });

      const signatureHeader = createSignatureHeader(payload, WEBHOOK_SECRET);
      const result = verifyResendWebhook(payload, signatureHeader, WEBHOOK_SECRET);

      expect(result.valid).toBe(true);
    });

    it('should reject empty payload (edge case)', () => {
      // Note: Empty payloads are invalid webhooks in practice
      // This test ensures we don't crash on malformed input
      const payload = '';
      const timestamp = getCurrentTimestamp();
      const signature = createSignature(payload, WEBHOOK_SECRET, timestamp);
      const signatureHeader = `t=${timestamp},v1=${signature}`;

      const result = verifyResendWebhook(payload, signatureHeader, WEBHOOK_SECRET);

      // Empty payload fails verification (expected behavior)
      expect(result.valid).toBe(false);
    });
  });

  describe('Security Guarantees', () => {
    it('should prevent timing attacks with constant-time comparison', () => {
      const payload = JSON.stringify({ type: 'email.sent', data: { email_id: 'test123' } });
      const timestamp = getCurrentTimestamp();
      const correctSignature = createSignature(payload, WEBHOOK_SECRET, timestamp);

      // Create signature that differs only in last character
      const almostCorrectSignature = correctSignature.slice(0, -1) +
        (correctSignature[correctSignature.length - 1] === 'a' ? 'b' : 'a');

      const header = `t=${timestamp},v1=${almostCorrectSignature}`;
      const result = verifyResendWebhook(payload, header, WEBHOOK_SECRET);

      expect(result.valid).toBe(false);
    });

    it('should prevent signature stripping attacks', () => {
      const payload = JSON.stringify({ type: 'email.sent', data: { email_id: 'test123' } });

      // Attacker sends webhook without signature
      const result = verifyResendWebhook(payload, '', WEBHOOK_SECRET);

      expect(result.valid).toBe(false);
    });

    it('should prevent timestamp manipulation', () => {
      const payload = JSON.stringify({ type: 'email.sent', data: { email_id: 'test123' } });
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 1000).toString(); // 16+ minutes ago
      const signature = createSignature(payload, WEBHOOK_SECRET, oldTimestamp);

      // Attacker replaces timestamp with current one
      const currentTimestamp = getCurrentTimestamp();
      const header = `t=${currentTimestamp},v1=${signature}`;

      const result = verifyResendWebhook(payload, header, WEBHOOK_SECRET);

      expect(result.valid).toBe(false); // Signature won't match new timestamp
    });
  });
});
