/**
 * SendTestEmailUseCase
 *
 * Sends a test email to verify email system is working correctly.
 * Handles contact creation, email rendering, sending, and logging.
 *
 * Clean Architecture: Business logic in domain layer.
 * SOLID: Single Responsibility (orchestrates test email sending),
 *        Dependency Inversion (depends on interfaces).
 */

import { IContactRepository } from '../repositories/IContactRepository';
import { IEmailProvider, EmailParams } from '../../infrastructure/email/IEmailProvider';
import { ITrackRepository, Track } from '../repositories/ITrackRepository';
import { IEmailLogRepository } from '../repositories/IEmailLogRepository';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface SendTestEmailInput {
  userId: number;
  testEmail: string;
  emailHtml: string;
  subject: string;
  track: Track;
  baseUrl: string;
}

export interface SendTestEmailResult {
  success: boolean;
  emailId?: string;
  recipient: string;
  error?: string;
}

export class SendTestEmailUseCase {
  constructor(
    private readonly contactRepository: IContactRepository,
    private readonly emailProvider: IEmailProvider,
    private readonly trackRepository: ITrackRepository,
    private readonly emailLogRepository: IEmailLogRepository
  ) {}

  async execute(input: SendTestEmailInput): Promise<SendTestEmailResult> {
    // 1. Validate input
    this.validateInput(input);

    // 2. Find or create test contact
    let contact = await this.contactRepository.findByEmail(input.testEmail, input.userId);

    if (!contact) {
      // For this use case, we expect the contact to exist
      // The API route should handle contact creation if needed
      throw new ValidationError(`Contact not found: ${input.testEmail}`);
    }

    // 3. Build unsubscribe URL
    const unsubscribeUrl = `${input.baseUrl}/unsubscribe?token=${contact.unsubscribeToken}`;

    // 4. Send email
    const emailParams: EmailParams = {
      to: contact.email,
      subject: input.subject,
      html: input.emailHtml,
      unsubscribeUrl,
      tags: [
        { name: 'category', value: 'test' },
        { name: 'track_id', value: input.track.trackId },
      ],
    };

    const emailResult = await this.emailProvider.send(emailParams);

    if (!emailResult.success) {
      return {
        success: false,
        recipient: contact.email,
        error: emailResult.error,
      };
    }

    // 5. Save test track to database
    await this.trackRepository.save(input.track, input.userId);

    // 6. Log email in database
    await this.emailLogRepository.create({
      contactId: contact.id,
      trackId: input.track.trackId,
      resendEmailId: emailResult.id || null,
      status: 'sent',
    });

    return {
      success: true,
      emailId: emailResult.id,
      recipient: contact.email,
    };
  }

  /**
   * Validate test email input
   */
  private validateInput(input: SendTestEmailInput): void {
    if (!input.testEmail || !this.isValidEmail(input.testEmail)) {
      throw new ValidationError('Valid test email address is required');
    }

    if (!input.subject || input.subject.trim().length === 0) {
      throw new ValidationError('Subject cannot be empty');
    }

    if (!input.emailHtml || input.emailHtml.trim().length === 0) {
      throw new ValidationError('Email HTML cannot be empty');
    }

    if (!input.track || !input.track.trackId) {
      throw new ValidationError('Valid track data is required');
    }

    if (!input.baseUrl) {
      throw new ValidationError('Base URL is required');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
