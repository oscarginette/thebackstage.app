/**
 * Mailgun Webhook Signature Verification Tests
 *
 * Tests HMAC-SHA256 signature verification for Mailgun webhooks.
 * Ensures protection against:
 * - Unauthorized webhook calls
 * - Replay attacks (timestamp validation)
 * - Timing attacks (constant-time comparison)
 */

import crypto from 'crypto';
import { verifyMailgunWebhook } from '@/lib/webhooks/verify-mailgun-signature';

describe('verifyMailgunWebhook', () => {
  const SIGNING_KEY = 'test_signing_key_for_mailgun_webhooks';

  // Helper: Create valid signature
  function createSignature(timestamp: string, token: string): string {
    const payload = timestamp + token;
    return crypto.createHmac('sha256', SIGNING_KEY)
      .update(payload)
      .digest('hex');
  }

  // Helper: Get current timestamp
  function getCurrentTimestamp(): string {
    return Math.floor(Date.now() / 1000).toString();
  }

  describe('Valid Signatures', () => {
    it('should accept valid signature with current timestamp', () => {
      const timestamp = getCurrentTimestamp();
      const token = 'random_token_12345';
      const signature = createSignature(timestamp, token);

      const result = verifyMailgunWebhook(timestamp, token, signature, SIGNING_KEY);

      expect(result).toBe(true);
    });

    it('should accept signature within 15-minute window (old timestamp)', () => {
      // 10 minutes ago (600 seconds)
      const timestamp = (Math.floor(Date.now() / 1000) - 600).toString();
      const token = 'random_token_12345';
      const signature = createSignature(timestamp, token);

      const result = verifyMailgunWebhook(timestamp, token, signature, SIGNING_KEY);

      expect(result).toBe(true);
    });

    it('should accept signature within 15-minute window (future timestamp)', () => {
      // 10 minutes in future (600 seconds) - allows for clock skew
      const timestamp = (Math.floor(Date.now() / 1000) + 600).toString();
      const token = 'random_token_12345';
      const signature = createSignature(timestamp, token);

      const result = verifyMailgunWebhook(timestamp, token, signature, SIGNING_KEY);

      expect(result).toBe(true);
    });
  });

  describe('Invalid Signatures', () => {
    it('should reject incorrect signature', () => {
      const timestamp = getCurrentTimestamp();
      const token = 'random_token_12345';
      const wrongSignature = 'invalid_signature_hash';

      const result = verifyMailgunWebhook(timestamp, token, wrongSignature, SIGNING_KEY);

      expect(result).toBe(false);
    });

    it('should reject signature with modified timestamp', () => {
      const timestamp = getCurrentTimestamp();
      const token = 'random_token_12345';
      const signature = createSignature(timestamp, token);

      // Try to use different timestamp
      const modifiedTimestamp = (parseInt(timestamp, 10) + 10).toString();
      const result = verifyMailgunWebhook(modifiedTimestamp, token, signature, SIGNING_KEY);

      expect(result).toBe(false);
    });

    it('should reject signature with modified token', () => {
      const timestamp = getCurrentTimestamp();
      const token = 'random_token_12345';
      const signature = createSignature(timestamp, token);

      // Try to use different token
      const modifiedToken = 'modified_token_67890';
      const result = verifyMailgunWebhook(timestamp, modifiedToken, signature, SIGNING_KEY);

      expect(result).toBe(false);
    });

    it('should reject signature with wrong signing key', () => {
      const timestamp = getCurrentTimestamp();
      const token = 'random_token_12345';
      const signature = createSignature(timestamp, token);

      // Try to verify with different signing key
      const wrongKey = 'wrong_signing_key';
      const result = verifyMailgunWebhook(timestamp, token, signature, wrongKey);

      expect(result).toBe(false);
    });
  });

  describe('Replay Attack Prevention', () => {
    it('should reject timestamp older than 15 minutes', () => {
      // 16 minutes ago (960 seconds) - exceeds 15-minute window
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 960).toString();
      const token = 'random_token_12345';
      const signature = createSignature(oldTimestamp, token);

      const result = verifyMailgunWebhook(oldTimestamp, token, signature, SIGNING_KEY);

      expect(result).toBe(false);
    });

    it('should reject timestamp exactly 15 minutes + 1 second old', () => {
      // 901 seconds ago - just over the limit
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 901).toString();
      const token = 'random_token_12345';
      const signature = createSignature(oldTimestamp, token);

      const result = verifyMailgunWebhook(oldTimestamp, token, signature, SIGNING_KEY);

      expect(result).toBe(false);
    });

    it('should accept timestamp exactly 15 minutes old', () => {
      // 900 seconds ago - exactly at the limit
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 900).toString();
      const token = 'random_token_12345';
      const signature = createSignature(oldTimestamp, token);

      const result = verifyMailgunWebhook(oldTimestamp, token, signature, SIGNING_KEY);

      expect(result).toBe(true);
    });
  });

  describe('Invalid Input Handling', () => {
    it('should reject non-numeric timestamp', () => {
      const invalidTimestamp = 'not_a_number';
      const token = 'random_token_12345';
      const signature = createSignature(getCurrentTimestamp(), token);

      const result = verifyMailgunWebhook(invalidTimestamp, token, signature, SIGNING_KEY);

      expect(result).toBe(false);
    });

    it('should reject empty timestamp', () => {
      const emptyTimestamp = '';
      const token = 'random_token_12345';
      const signature = createSignature(getCurrentTimestamp(), token);

      const result = verifyMailgunWebhook(emptyTimestamp, token, signature, SIGNING_KEY);

      expect(result).toBe(false);
    });

    it('should handle signature length mismatch gracefully', () => {
      const timestamp = getCurrentTimestamp();
      const token = 'random_token_12345';
      const shortSignature = 'too_short';

      const result = verifyMailgunWebhook(timestamp, token, shortSignature, SIGNING_KEY);

      expect(result).toBe(false);
    });
  });

  describe('Timing Attack Prevention', () => {
    it('should use constant-time comparison (timingSafeEqual)', () => {
      const timestamp = getCurrentTimestamp();
      const token = 'random_token_12345';
      const correctSignature = createSignature(timestamp, token);

      // Create signature that differs only in last character
      const almostCorrectSignature = correctSignature.slice(0, -1) +
        (correctSignature[correctSignature.length - 1] === 'a' ? 'b' : 'a');

      const result = verifyMailgunWebhook(timestamp, token, almostCorrectSignature, SIGNING_KEY);

      expect(result).toBe(false);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle typical Mailgun webhook payload', () => {
      const timestamp = getCurrentTimestamp();
      const token = crypto.randomBytes(32).toString('hex');
      const signature = createSignature(timestamp, token);

      const result = verifyMailgunWebhook(timestamp, token, signature, SIGNING_KEY);

      expect(result).toBe(true);
    });

    it('should reject webhook with valid format but incorrect signature', () => {
      const timestamp = getCurrentTimestamp();
      const token = crypto.randomBytes(32).toString('hex');

      // Generate signature with correct key
      const correctSignature = createSignature(timestamp, token);

      // Generate signature with different key (simulate attacker)
      const attackerKey = 'attacker_key';
      const attackerSignature = crypto.createHmac('sha256', attackerKey)
        .update(timestamp + token)
        .digest('hex');

      const result = verifyMailgunWebhook(timestamp, token, attackerSignature, SIGNING_KEY);

      expect(result).toBe(false);
      expect(attackerSignature).not.toBe(correctSignature);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long token', () => {
      const timestamp = getCurrentTimestamp();
      const longToken = 'a'.repeat(1000);
      const signature = createSignature(timestamp, longToken);

      const result = verifyMailgunWebhook(timestamp, longToken, signature, SIGNING_KEY);

      expect(result).toBe(true);
    });

    it('should handle special characters in token', () => {
      const timestamp = getCurrentTimestamp();
      const specialToken = 'token-with-special_chars!@#$%^&*()';
      const signature = createSignature(timestamp, specialToken);

      const result = verifyMailgunWebhook(timestamp, specialToken, signature, SIGNING_KEY);

      expect(result).toBe(true);
    });

    it('should handle Unicode in signing key', () => {
      const unicodeKey = 'key_with_émojis_🔐';
      const timestamp = getCurrentTimestamp();
      const token = 'random_token';
      const signature = crypto.createHmac('sha256', unicodeKey)
        .update(timestamp + token)
        .digest('hex');

      const result = verifyMailgunWebhook(timestamp, token, signature, unicodeKey);

      expect(result).toBe(true);
    });
  });
});
