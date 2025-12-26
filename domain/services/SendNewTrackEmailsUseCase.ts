/**
 * SendNewTrackEmailsUseCase
 *
 * Orchestrates sending new track emails to all subscribed contacts.
 * Handles batch email sending, error collection, and execution logging.
 *
 * Clean Architecture: Business logic in domain layer.
 * SOLID: Single Responsibility (orchestrates newsletter sending),
 *        Dependency Inversion (depends on interfaces).
 */

import { IContactRepository } from '../repositories/IContactRepository';
import { IEmailProvider, EmailParams } from '../../infrastructure/email/IEmailProvider';
import { ITrackRepository, Track } from '../repositories/ITrackRepository';
import { IExecutionLogRepository } from '../repositories/IExecutionLogRepository';

export interface SendNewTrackEmailsInput {
  userId: number;
  track: Track;
  emailHtml: string;
  subject: string;
  baseUrl: string;
}

export interface SendNewTrackEmailsResult {
  success: boolean;
  sent: number;
  failed: number;
  totalSubscribers: number;
}

export class SendNewTrackEmailsUseCase {
  constructor(
    private readonly contactRepository: IContactRepository,
    private readonly emailProvider: IEmailProvider,
    private readonly trackRepository: ITrackRepository,
    private readonly executionLogRepository: IExecutionLogRepository
  ) {}

  async execute(input: SendNewTrackEmailsInput): Promise<SendNewTrackEmailsResult> {
    const startTime = Date.now();

    // 1. Fetch all subscribed contacts
    const contacts = await this.contactRepository.getSubscribed(input.userId);

    if (contacts.length === 0) {
      // Log execution even if no subscribers
      await this.executionLogRepository.create({
        newTracks: 1,
        emailsSent: 0,
        durationMs: Date.now() - startTime,
        trackId: input.track.trackId,
        trackTitle: input.track.title,
      });

      return {
        success: true,
        sent: 0,
        failed: 0,
        totalSubscribers: 0,
      };
    }

    // 2. Send emails in batch (parallel execution)
    const emailPromises = contacts.map(async (contact) => {
      const unsubscribeUrl = `${input.baseUrl}/unsubscribe?token=${contact.unsubscribeToken}`;

      const emailParams: EmailParams = {
        to: contact.email,
        subject: input.subject,
        html: input.emailHtml,
        unsubscribeUrl,
        tags: [
          { name: 'category', value: 'new_track' },
          { name: 'track_id', value: input.track.trackId },
        ],
      };

      try {
        const result = await this.emailProvider.send(emailParams);
        return { success: result.success, email: contact.email };
      } catch (error: any) {
        console.error(`Failed to send email to ${contact.email}:`, error);
        return { success: false, email: contact.email };
      }
    });

    // Wait for all emails to complete
    const results = await Promise.all(emailPromises);

    // 3. Count successes and failures
    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    // 4. Save track to database
    await this.trackRepository.save(input.track, input.userId);

    // 5. Log execution
    await this.executionLogRepository.create({
      newTracks: 1,
      emailsSent: sent,
      durationMs: Date.now() - startTime,
      trackId: input.track.trackId,
      trackTitle: input.track.title,
    });

    return {
      success: true,
      sent,
      failed,
      totalSubscribers: contacts.length,
    };
  }
}
