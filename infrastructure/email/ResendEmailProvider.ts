import { Resend } from 'resend';
import { IEmailProvider, EmailParams, EmailResult } from './IEmailProvider';

export class ResendEmailProvider implements IEmailProvider {
  private resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async send(params: EmailParams): Promise<EmailResult> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: params.from || `Gee Beat <${process.env.SENDER_EMAIL}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        tags: params.tags
      });

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
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
