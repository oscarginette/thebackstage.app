/**
 * MailgunEmailProvider Tests
 *
 * Tests for multi-tenant domain extraction functionality.
 */

import { MailgunEmailProvider } from '../MailgunEmailProvider';

// Mock Mailgun client
jest.mock('mailgun.js', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      client: jest.fn().mockReturnValue({
        messages: {
          create: jest.fn().mockResolvedValue({ id: 'test-message-id' }),
        },
      }),
    })),
  };
});

describe('MailgunEmailProvider - Domain Extraction', () => {
  let provider: MailgunEmailProvider;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    provider = new MailgunEmailProvider('test-api-key', 'thebackstage.app');
    // Access the mocked create method
    mockCreate = (provider as any).mg.messages.create;
    mockCreate.mockClear();
  });

  describe('extractDomainFromEmail', () => {
    it('should extract domain from simple email format', async () => {
      await provider.send({
        from: 'info@geebeat.com',
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        'geebeat.com',
        expect.objectContaining({
          from: 'info@geebeat.com',
        })
      );
    });

    it('should extract domain from "Name <email>" format', async () => {
      await provider.send({
        from: 'Artist Name <info@geebeat.com>',
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        'geebeat.com',
        expect.objectContaining({
          from: 'Artist Name <info@geebeat.com>',
        })
      );
    });

    it('should use default domain when from is not provided', async () => {
      await provider.send({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        'thebackstage.app',
        expect.objectContaining({
          from: 'The Backstage <noreply@thebackstage.app>',
        })
      );
    });

    it('should use default domain for invalid email format', async () => {
      await provider.send({
        from: 'invalid-email',
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        'thebackstage.app',
        expect.anything()
      );
    });

    it('should extract domain from different TLDs', async () => {
      await provider.send({
        from: 'hello@artist.co.uk',
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        'artist.co.uk',
        expect.objectContaining({
          from: 'hello@artist.co.uk',
        })
      );
    });

    it('should handle complex email addresses', async () => {
      await provider.send({
        from: 'DJ Awesome <dj.awesome@my-label.com>',
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        'my-label.com',
        expect.objectContaining({
          from: 'DJ Awesome <dj.awesome@my-label.com>',
        })
      );
    });
  });

  describe('backward compatibility', () => {
    it('should preserve all existing email parameters', async () => {
      await provider.send({
        from: 'info@geebeat.com',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        replyTo: 'reply@geebeat.com',
        unsubscribeUrl: 'https://example.com/unsubscribe',
        tags: [{ name: 'campaign', value: 'test' }],
        headers: { 'X-Custom': 'value' },
      });

      expect(mockCreate).toHaveBeenCalledWith(
        'geebeat.com',
        expect.objectContaining({
          from: 'info@geebeat.com',
          to: 'test@example.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
          'h:Reply-To': 'reply@geebeat.com',
          'h:List-Unsubscribe': '<https://example.com/unsubscribe>',
          'h:List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'o:tag': ['campaign:test'],
          'h:X-Custom': 'value',
        })
      );
    });
  });
});
