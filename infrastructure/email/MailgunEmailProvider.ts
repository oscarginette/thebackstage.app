/**
 * MailgunEmailProvider
 *
 * Email provider implementation for Mailgun API.
 * Implements IEmailProvider interface (Dependency Inversion Principle).
 *
 * Features:
 * - Converts tags from Resend format to Mailgun format
 * - Handles List-Unsubscribe headers (CAN-SPAM compliance)
 * - Support for custom headers and Reply-To
 * - Robust error handling and logging
 *
 * Clean Architecture: Infrastructure layer implementation.
 * SOLID: Implements interface, single responsibility.
 */

import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { IEmailProvider, EmailParams, EmailResult } from './IEmailProvider';

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

  async send(params: EmailParams): Promise<EmailResult> {
    try {
      // 1. Build message data
      const messageData: any = {
        from: params.from || `The Backstage <noreply@${this.domain}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
      };

      // 2. Add Reply-To if specified
      // Enables responses to go to a different address (e.g., user's email)
      if (params.replyTo) {
        messageData['h:Reply-To'] = params.replyTo;
      }

      // 3. Add List-Unsubscribe headers (CAN-SPAM compliance)
      // This enables Gmail/Outlook "Unsubscribe" button
      if (params.unsubscribeUrl) {
        messageData['h:List-Unsubscribe'] = `<${params.unsubscribeUrl}>`;
        messageData['h:List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
      }

      // 4. Convert tags from Resend format to Mailgun format
      // Resend: [{ name: 'campaign_id', value: 'abc' }]
      // Mailgun: 'o:tag': ['campaign_id:abc']
      if (params.tags && params.tags.length > 0) {
        messageData['o:tag'] = params.tags.map(
          tag => `${tag.name}:${tag.value}`
        );
      }

      // 5. Add custom headers
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
        replyTo: messageData['h:Reply-To'],
        hasUnsubscribe: !!params.unsubscribeUrl,
        tags: messageData['o:tag'],
        htmlLength: params.html?.length || 0,
      });

      // 6. Send via Mailgun API
      const response = await this.mg.messages.create(this.domain, messageData);

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
