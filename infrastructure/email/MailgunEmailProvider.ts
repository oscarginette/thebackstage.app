/**
 * MailgunEmailProvider
 *
 * Email provider implementation for Mailgun API.
 * Implements IEmailProvider interface (Dependency Inversion Principle).
 *
 * Features:
 * - Multi-tenant domain support (sends FROM artist's verified domain)
 * - Converts tags from Resend format to Mailgun format
 * - Handles List-Unsubscribe headers (CAN-SPAM compliance)
 * - Support for custom headers and Reply-To
 * - Robust error handling and logging
 * - Automatic domain extraction from 'from' address
 *
 * Multi-tenant Flow:
 * 1. Extract domain from 'from' parameter (e.g., "info@geebeat.com" → "geebeat.com")
 * 2. Send email using extracted domain (requires domain verification in Mailgun)
 * 3. Fallback to default domain if extraction fails
 *
 * Clean Architecture: Infrastructure layer implementation.
 * SOLID: Implements interface, single responsibility.
 */

import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { IEmailProvider, EmailParams, EmailResult } from '@/domain/providers/IEmailProvider';

export class MailgunEmailProvider implements IEmailProvider {
  private mg: any;
  private domain: string;

  constructor(apiKey: string, domain: string, apiUrl?: string) {
    const mailgun = new Mailgun(FormData);
    this.mg = mailgun.client({
      username: 'api',
      key: apiKey,
      url: apiUrl || 'https://api.mailgun.net'
    });
    this.domain = domain;
  }

  /**
   * Extract domain from email address for multi-tenant sending.
   *
   * Supports formats:
   * - "info@geebeat.com" → "geebeat.com"
   * - "Artist Name <info@geebeat.com>" → "geebeat.com"
   * - "invalid" → uses default domain (thebackstage.app)
   *
   * @param fromAddress - Email address to extract domain from
   * @returns Extracted domain or default domain
   */
  private extractDomainFromEmail(fromAddress: string): string {
    try {
      // Extract email from "Name <email@domain.com>" format
      const emailMatch = fromAddress.match(/<(.+?)>/);
      const email = emailMatch ? emailMatch[1] : fromAddress;

      // Extract domain from email@domain.com
      const domainMatch = email.match(/@(.+)$/);
      if (!domainMatch || !domainMatch[1]) {
        console.warn('[MailgunEmailProvider] Invalid from address format, using default domain:', {
          fromAddress,
          defaultDomain: this.domain,
        });
        return this.domain;
      }

      const extractedDomain = domainMatch[1].trim();

      // Validate domain format (basic check)
      if (!extractedDomain.includes('.')) {
        console.warn('[MailgunEmailProvider] Extracted domain looks invalid, using default domain:', {
          fromAddress,
          extractedDomain,
          defaultDomain: this.domain,
        });
        return this.domain;
      }

      return extractedDomain;
    } catch (error) {
      console.error('[MailgunEmailProvider] Error extracting domain, using default:', {
        fromAddress,
        error,
        defaultDomain: this.domain,
      });
      return this.domain;
    }
  }

  async send(params: EmailParams): Promise<EmailResult> {
    try {
      // 1. Build message data
      const messageData: any = {
        from: params.from || `The Backstage <noreply@${this.domain}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
      };

      // 2. Extract sending domain from 'from' address
      // This enables multi-tenant domain support
      // Example: "Artist Name <info@geebeat.com>" → "geebeat.com"
      const fromDomain = this.extractDomainFromEmail(messageData.from);

      console.log('[MailgunEmailProvider] Extracted domain:', {
        from: messageData.from,
        extractedDomain: fromDomain,
        defaultDomain: this.domain,
        usingDomain: fromDomain,
      });

      // 3. Add Reply-To if specified
      // Enables responses to go to a different address (e.g., user's email)
      if (params.replyTo) {
        messageData['h:Reply-To'] = params.replyTo;
      }

      // 4. Add List-Unsubscribe headers (CAN-SPAM compliance)
      // This enables Gmail/Outlook "Unsubscribe" button
      if (params.unsubscribeUrl) {
        messageData['h:List-Unsubscribe'] = `<${params.unsubscribeUrl}>`;
        messageData['h:List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
      }

      // 5. Convert tags from Resend format to Mailgun format
      // Resend: [{ name: 'campaign_id', value: 'abc' }]
      // Mailgun: 'o:tag': ['campaign_id:abc']
      if (params.tags && params.tags.length > 0) {
        messageData['o:tag'] = params.tags.map(
          tag => `${tag.name}:${tag.value}`
        );
      }

      // 6. Add custom headers
      if (params.headers) {
        for (const [key, value] of Object.entries(params.headers)) {
          // Skip List-Unsubscribe (already handled above)
          if (key !== 'List-Unsubscribe' && key !== 'List-Unsubscribe-Post') {
            messageData[`h:${key}`] = value;
          }
        }
      }

      console.log('[MailgunEmailProvider] Sending email:', {
        to: params.to,
        subject: params.subject,
        from: messageData.from,
        domain: fromDomain,
        replyTo: messageData['h:Reply-To'],
        hasUnsubscribe: !!params.unsubscribeUrl,
        tags: messageData['o:tag'],
        htmlLength: params.html?.length || 0,
      });

      // 7. Send via Mailgun API using extracted domain
      // This allows emails to be sent FROM the artist's verified domain
      const response = await this.mg.messages.create(fromDomain, messageData);

      console.log('[MailgunEmailProvider] Email sent successfully:', {
        to: params.to,
        messageId: response.id,
      });

      return {
        success: true,
        id: response.id,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to send email via Mailgun';

      console.error('[MailgunEmailProvider] Error:', {
        to: params.to,
        error,
        errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
