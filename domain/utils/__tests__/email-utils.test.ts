import { describe, it, expect } from 'vitest';
import {
  extractDomainFromEmail,
  extractLocalPartFromEmail,
  normalizeEmail,
  isValidEmail,
  EmailParseError
} from '../email-utils';

describe('EmailUtils', () => {
  describe('extractDomainFromEmail', () => {
    it('should extract domain from standard email', () => {
      expect(extractDomainFromEmail('info@geebeat.com')).toBe('geebeat.com');
      expect(extractDomainFromEmail('artist@example.org')).toBe('example.org');
      expect(extractDomainFromEmail('test@test.io')).toBe('test.io');
    });

    it('should extract domain from RFC 5322 format (with name)', () => {
      expect(extractDomainFromEmail('Artist Name <info@geebeat.com>')).toBe('geebeat.com');
      expect(extractDomainFromEmail('John Doe <john@example.com>')).toBe('example.com');
      expect(extractDomainFromEmail('"Artist, Name" <artist@domain.com>')).toBe('domain.com');
    });

    it('should extract domain with multiple TLDs', () => {
      expect(extractDomainFromEmail('artist@domain.co.uk')).toBe('domain.co.uk');
      expect(extractDomainFromEmail('test@mail.google.com')).toBe('mail.google.com');
      expect(extractDomainFromEmail('info@subdomain.example.co.jp')).toBe('subdomain.example.co.jp');
    });

    it('should handle whitespace correctly', () => {
      expect(extractDomainFromEmail('  info@geebeat.com  ')).toBe('geebeat.com');
      expect(extractDomainFromEmail('Artist Name <  info@geebeat.com  >')).toBe('geebeat.com');
    });

    it('should throw EmailParseError for invalid formats', () => {
      // Missing @
      expect(() => extractDomainFromEmail('invalid-email'))
        .toThrow(EmailParseError);

      // Empty domain
      expect(() => extractDomainFromEmail('info@'))
        .toThrow(EmailParseError);

      // Empty string
      expect(() => extractDomainFromEmail(''))
        .toThrow(EmailParseError);

      // Whitespace only
      expect(() => extractDomainFromEmail('   '))
        .toThrow(EmailParseError);

      // Null/undefined
      expect(() => extractDomainFromEmail(null as any))
        .toThrow(EmailParseError);

      expect(() => extractDomainFromEmail(undefined as any))
        .toThrow(EmailParseError);

      // Invalid domain format
      expect(() => extractDomainFromEmail('test@invalid'))
        .toThrow(EmailParseError);

      expect(() => extractDomainFromEmail('test@.com'))
        .toThrow(EmailParseError);

      expect(() => extractDomainFromEmail('test@domain.'))
        .toThrow(EmailParseError);
    });

    it('should preserve EmailParseError properties', () => {
      try {
        extractDomainFromEmail('invalid-email');
        expect.fail('Should have thrown EmailParseError');
      } catch (error) {
        expect(error).toBeInstanceOf(EmailParseError);
        expect((error as EmailParseError).name).toBe('EmailParseError');
        expect((error as EmailParseError).originalValue).toBe('invalid-email');
        expect((error as EmailParseError).message).toContain('Invalid email format');
      }
    });
  });

  describe('extractLocalPartFromEmail', () => {
    it('should extract local part from standard email', () => {
      expect(extractLocalPartFromEmail('info@geebeat.com')).toBe('info');
      expect(extractLocalPartFromEmail('artist.name@example.com')).toBe('artist.name');
      expect(extractLocalPartFromEmail('test+tag@example.com')).toBe('test+tag');
    });

    it('should extract local part from RFC 5322 format', () => {
      expect(extractLocalPartFromEmail('Artist Name <info@geebeat.com>')).toBe('info');
      expect(extractLocalPartFromEmail('John Doe <john.doe@example.com>')).toBe('john.doe');
    });

    it('should handle whitespace correctly', () => {
      expect(extractLocalPartFromEmail('  info@geebeat.com  ')).toBe('info');
      expect(extractLocalPartFromEmail('Artist Name <  info@geebeat.com  >')).toBe('info');
    });

    it('should throw EmailParseError for invalid formats', () => {
      expect(() => extractLocalPartFromEmail('invalid-email'))
        .toThrow(EmailParseError);

      expect(() => extractLocalPartFromEmail('@domain.com'))
        .toThrow(EmailParseError);

      expect(() => extractLocalPartFromEmail(''))
        .toThrow(EmailParseError);
    });
  });

  describe('normalizeEmail', () => {
    it('should normalize email to lowercase', () => {
      expect(normalizeEmail('INFO@GEEBEAT.COM')).toBe('info@geebeat.com');
      expect(normalizeEmail('Artist@Example.Com')).toBe('artist@example.com');
    });

    it('should extract and normalize from RFC 5322 format', () => {
      expect(normalizeEmail('Artist Name <Info@GeeBeat.com>')).toBe('info@geebeat.com');
      expect(normalizeEmail('JOHN DOE <JOHN@EXAMPLE.COM>')).toBe('john@example.com');
    });

    it('should trim whitespace', () => {
      expect(normalizeEmail('  INFO@GEEBEAT.COM  ')).toBe('info@geebeat.com');
      expect(normalizeEmail('  Artist <Info@GeeBeat.com>  ')).toBe('info@geebeat.com');
    });

    it('should throw EmailParseError for invalid formats', () => {
      expect(() => normalizeEmail('invalid-email'))
        .toThrow(EmailParseError);

      expect(() => normalizeEmail(''))
        .toThrow(EmailParseError);

      expect(() => normalizeEmail(null as any))
        .toThrow(EmailParseError);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('info@geebeat.com')).toBe(true);
      expect(isValidEmail('artist@example.org')).toBe(true);
      expect(isValidEmail('test.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('Artist Name <info@geebeat.com>')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test@invalid')).toBe(false);
    });

    it('should handle edge cases gracefully', () => {
      expect(isValidEmail(null as any)).toBe(false);
      expect(isValidEmail(undefined as any)).toBe(false);
      expect(isValidEmail('   ')).toBe(false);
    });
  });
});
