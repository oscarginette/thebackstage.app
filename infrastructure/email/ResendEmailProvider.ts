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
      // Validate SENDER_EMAIL is configured (runtime check)
      if (!env.SENDER_EMAIL) {
        throw new Error(
          'SENDER_EMAIL environment variable is required for sending emails. ' +
          'Please configure it in your environment settings.'
        );
      }

      // Build email payload
      const emailPayload: any = {
        from: params.from || `The Backstage <${env.SENDER_EMAIL}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        tags: params.tags
      };

      // Add Reply-To header if specified
      // Enables responses to go to a different address (e.g., user's email)
      if (params.replyTo) {
        emailPayload.reply_to = params.replyTo;
      }

      // Add List-Unsubscribe header for CAN-SPAM compliance
      // This enables Gmail/Outlook "Unsubscribe" button
      if (params.unsubscribeUrl) {
        emailPayload.headers = {
          'List-Unsubscribe': `<${params.unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        };
      }

      console.log('[ResendEmailProvider] Sending email:', {
        to: params.to,
        subject: params.subject,
        from: emailPayload.from,
        replyTo: emailPayload.reply_to,
        hasUnsubscribe: !!params.unsubscribeUrl,
        htmlLength: params.html?.length || 0,
      });

      const { data, error } = await this.resend.emails.send(emailPayload);

      if (error) {
        console.error('[ResendEmailProvider] Resend API error:', {
          to: params.to,
          error: error,
          errorMessage: error.message,
          errorName: error.name,
        });

        return {
          success: false,
          error: error.message
        };
      }

      console.log('[ResendEmailProvider] Email sent successfully:', {
        to: params.to,
        emailId: data?.id,
      });

      return {
        success: true,
        id: data?.id
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
      console.error('[ResendEmailProvider] Exception:', {
        to: params.to,
        error,
        errorMessage,
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }
}
