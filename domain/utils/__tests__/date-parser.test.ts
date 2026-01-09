import { describe, it, expect } from 'vitest';
import {
  parseRelativeDate,
  parseISODate,
  parseDate,
  isDateColumn
} from '../date-parser';

describe('DateParser', () => {
  describe('parseRelativeDate', () => {
    it('should parse "7 months ago"', () => {
      const result = parseRelativeDate('7 months ago');
      expect(result).toBeInstanceOf(Date);

      const now = new Date();
      const expected = new Date();
      expected.setMonth(expected.getMonth() - 7);

      // Allow 1 day tolerance for edge cases
      const diff = Math.abs(result!.getTime() - expected.getTime());
      expect(diff).toBeLessThan(24 * 60 * 60 * 1000);
    });

    it('should parse "25 days ago"', () => {
      const result = parseRelativeDate('25 days ago');
      expect(result).toBeInstanceOf(Date);

      const now = new Date();
      const expected = new Date();
      expected.setDate(expected.getDate() - 25);

      const diff = Math.abs(result!.getTime() - expected.getTime());
      expect(diff).toBeLessThan(1000); // Less than 1 second
    });

    it('should parse "3 years ago"', () => {
      const result = parseRelativeDate('3 years ago');
      expect(result).toBeInstanceOf(Date);

      const expected = new Date();
      expected.setFullYear(expected.getFullYear() - 3);

      const diff = Math.abs(result!.getTime() - expected.getTime());
      expect(diff).toBeLessThan(24 * 60 * 60 * 1000);
    });

    it('should parse singular "1 month ago"', () => {
      const result = parseRelativeDate('1 month ago');
      expect(result).toBeInstanceOf(Date);
    });

    it('should return null for invalid format', () => {
      expect(parseRelativeDate('invalid')).toBeNull();
      expect(parseRelativeDate('7 months')).toBeNull();
      expect(parseRelativeDate('ago 7 months')).toBeNull();
    });
  });

  describe('parseISODate', () => {
    it('should parse "2024-01-15"', () => {
      const result = parseISODate('2024-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0); // January = 0
      expect(result?.getDate()).toBe(15);
    });

    it('should parse "2023-12-25"', () => {
      const result = parseISODate('2023-12-25');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2023);
      expect(result?.getMonth()).toBe(11); // December = 11
      expect(result?.getDate()).toBe(25);
    });

    it('should return null for invalid dates', () => {
      expect(parseISODate('2024-02-31')).toBeNull(); // Invalid date
      expect(parseISODate('2024-13-01')).toBeNull(); // Invalid month
      expect(parseISODate('invalid')).toBeNull();
    });
  });

  describe('parseDate', () => {
    it('should parse relative dates', () => {
      const result = parseDate('7 months ago');
      expect(result).toBeInstanceOf(Date);
    });

    it('should parse ISO dates', () => {
      const result = parseDate('2024-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
    });

    it('should parse standard dates', () => {
      const result = parseDate('01/15/2024');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
    });

    it('should return null for null/undefined', () => {
      expect(parseDate(null)).toBeNull();
      expect(parseDate(undefined)).toBeNull();
      expect(parseDate('')).toBeNull();
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-15');
      const result = parseDate(date);
      expect(result).toBe(date);
    });
  });

  describe('isDateColumn', () => {
    it('should detect date column names', () => {
      expect(isDateColumn('created_at')).toBe(true);
      expect(isDateColumn('date_created')).toBe(true);
      expect(isDateColumn('contact_since')).toBe(true);
      expect(isDateColumn('Contact Since')).toBe(true);
      expect(isDateColumn('joined')).toBe(true);
      expect(isDateColumn('signup_date')).toBe(true);
    });

    it('should not detect non-date columns', () => {
      expect(isDateColumn('email')).toBe(false);
      expect(isDateColumn('name')).toBe(false);
      expect(isDateColumn('subscribed')).toBe(false);
    });
  });
});
