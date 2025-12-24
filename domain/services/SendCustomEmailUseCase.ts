/**
 * SendCustomEmailUseCase
 *
 * Use case for sending custom emails (not linked to tracks).
 * Supports both immediate sending and saving as draft.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles custom email sending logic
 * - Dependency Inversion: Depends on interfaces, not implementations
 * - Open/Closed: Can be extended without modification
 */

import { IContactRepository } from '@/domain/repositories/IContactRepository';
import { IEmailProvider } from '@/infrastructure/email/IEmailProvider';
import { IEmailLogRepository } from '@/domain/repositories/IEmailLogRepository';
import { IExecutionLogRepository } from '@/domain/repositories/IExecutionLogRepository';
import { IEmailCampaignRepository } from '@/domain/repositories/IEmailCampaignRepository';
import { render } from '@react-email/components';
import CustomEmail from '@/emails/custom-email';

export interface SendCustomEmailInput {
  userId: number;
  subject: string;
  greeting: string;
  message: string;
  signature: string;
  coverImage?: string;
  saveAsDraft?: boolean;
  templateId?: string;
  scheduledAt?: Date;
}

export interface SendCustomEmailResult {
  success: boolean;
  campaignId?: string;
  emailsSent?: number;
  emailsFailed?: number;
  totalContacts?: number;
  duration?: number;
  failures?: Array<{ email: string; error: string }>;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SendCustomEmailUseCase {
  constructor(
    private contactRepository: IContactRepository,
    private emailProvider: IEmailProvider,
    private emailLogRepository: IEmailLogRepository,
    private executionLogRepository: IExecutionLogRepository,
    private campaignRepository: IEmailCampaignRepository
  ) {}

  async execute(input: SendCustomEmailInput): Promise<SendCustomEmailResult> {
    const startTime = Date.now();

    try {
      // 1. Validate input
      this.validateInput(input);

      // 2. Build HTML content
      const htmlContent = await this.buildHtmlContent(input);

      // 3. If saving as draft, save and return
      if (input.saveAsDraft) {
        const campaign = await this.campaignRepository.create({
          templateId: input.templateId || null,
          trackId: null,
          subject: input.subject,
          htmlContent,
          status: 'draft',
          scheduledAt: input.scheduledAt || null
        });

        return {
          success: true,
          campaignId: campaign.id,
          duration: Date.now() - startTime
        };
      }

      // 4. Get subscribed contacts
      const contacts = await this.contactRepository.getSubscribed(input.userId);

      if (contacts.length === 0) {
        throw new ValidationError('No hay contactos suscritos');
      }

      console.log(`Enviando emails personalizados a ${contacts.length} contactos...`);

      // 5. Send emails
      const results = await this.sendEmails(contacts, input, htmlContent);

      // 6. Create sent campaign record
      const campaign = await this.campaignRepository.create({
        templateId: input.templateId || null,
        trackId: null,
        subject: input.subject,
        htmlContent,
        status: 'sent',
        scheduledAt: null
      });

      // 7. Log execution
      await this.logExecution(input, results.emailsSent.length, campaign.id, startTime);

      // 8. Build response
      return {
        success: true,
        campaignId: campaign.id,
        emailsSent: results.emailsSent.length,
        emailsFailed: results.emailsFailed.length,
        totalContacts: contacts.length,
        duration: Date.now() - startTime,
        failures: results.emailsFailed.length > 0 ? results.emailsFailed : undefined
      };
    } catch (error: any) {
      // Log error
      await this.logError(error, startTime);
      throw error;
    }
  }

  private validateInput(input: SendCustomEmailInput): void {
    if (!input.subject || input.subject.trim().length === 0) {
      throw new ValidationError('Subject is required');
    }

    if (!input.greeting || input.greeting.trim().length === 0) {
      throw new ValidationError('Greeting is required');
    }

    if (!input.message || input.message.trim().length === 0) {
      throw new ValidationError('Message is required');
    }

    if (!input.signature || input.signature.trim().length === 0) {
      throw new ValidationError('Signature is required');
    }

    if (input.subject.length > 500) {
      throw new ValidationError('Subject cannot exceed 500 characters');
    }
  }

  private async buildHtmlContent(input: SendCustomEmailInput): Promise<string> {
    // Build a temporary unsubscribe URL for preview (will be replaced per contact)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://backstage-art.vercel.app';
    const tempUnsubscribeUrl = `${baseUrl}/unsubscribe?token=TEMP_TOKEN`;

    return await render(
      CustomEmail({
        greeting: input.greeting,
        message: input.message,
        signature: input.signature,
        coverImage: input.coverImage || '',
        unsubscribeUrl: tempUnsubscribeUrl
      })
    );
  }

  private async sendEmails(
    contacts: Array<{ id: number; email: string; name?: string | null; unsubscribeToken: string }>,
    input: SendCustomEmailInput,
    htmlContentTemplate: string
  ) {
    const emailsSent: Array<{ email: string; id?: string }> = [];
    const emailsFailed: Array<{ email: string; error: string }> = [];

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://backstage-art.vercel.app';

    for (const contact of contacts) {
      try {
        // Build personalized HTML with contact's unsubscribe token
        const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${contact.unsubscribeToken}`;
        const personalizedHtml = await render(
          CustomEmail({
            greeting: input.greeting,
            message: input.message,
            signature: input.signature,
            coverImage: input.coverImage || '',
            unsubscribeUrl
          })
        );

        const result = await this.emailProvider.send({
          to: contact.email,
          subject: input.subject,
          html: personalizedHtml,
          tags: [
            { name: 'category', value: 'custom_email' },
            { name: 'campaign_type', value: 'custom' }
          ],
          unsubscribeUrl
        });

        if (result.success) {
          emailsSent.push({ email: contact.email, id: result.id });
          // Note: We can't log to email_logs table because it requires trackId
          // This is logged at the campaign level instead
        } else {
          emailsFailed.push({ email: contact.email, error: result.error || 'Unknown error' });
        }
      } catch (error: any) {
        console.error(`Error procesando ${contact.email}:`, error);
        emailsFailed.push({ email: contact.email, error: error.message });
      }
    }

    return { emailsSent, emailsFailed };
  }

  private async logExecution(
    input: SendCustomEmailInput,
    emailsSent: number,
    campaignId: string,
    startTime: number
  ): Promise<void> {
    await this.executionLogRepository.create({
      newTracks: 0,
      emailsSent,
      durationMs: Date.now() - startTime,
      trackId: null,
      trackTitle: `Custom Email: ${input.subject}`
    });
  }

  private async logError(error: Error, startTime: number): Promise<void> {
    try {
      await this.executionLogRepository.create({
        error: error.message,
        durationMs: Date.now() - startTime
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }
}
