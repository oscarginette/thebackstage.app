import { Resend } from 'resend';
import { IEmailProvider, EmailParams, EmailResult } from './IEmailProvider';
import { env } from '@/lib/env';

export class ResendEmailProvider implements IEmailProvider {
  private resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async send(params: EmailParams): Promise<EmailResult> {
    try {
      // Build email payload
      const emailPayload: any = {
        from: params.from || `Gee Beat <${env.SENDER_EMAIL}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        tags: params.tags
      };

      // Add List-Unsubscribe header for CAN-SPAM compliance
      // This enables Gmail/Outlook "Unsubscribe" button
      if (params.unsubscribeUrl) {
        emailPayload.headers = {
          'List-Unsubscribe': `<${params.unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        };
      }

      const { data, error } = await this.resend.emails.send(emailPayload);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        id: data?.id
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}
