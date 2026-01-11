/**
 * SendDemoUseCase
 *
 * Sends demo to multiple DJ contacts with comprehensive validation.
 *
 * Responsibilities:
 * - Validate demo exists and is ready to send
 * - Validate contacts are DJs and subscribed
 * - Prevent duplicate sends
 * - Send individual emails with tracking
 * - Create demo send records
 *
 * Clean Architecture: Domain layer use case with zero infrastructure dependencies.
 * SOLID: Single Responsibility (only handles demo sending logic).
 * Dependency Inversion: Depends on interfaces, not concrete implementations.
 *
 * Email Strategy (Individual Sends):
 * - Sends one email per DJ (not bulk/BCC)
 * - Enables personalization per DJ
 * - Provides individual tracking (opens/clicks)
 * - Follows CAN-SPAM best practices
 */

import { randomUUID } from 'crypto';
import type { IDemoRepository } from '../repositories/IDemoRepository';
import type { IDemoSendRepository } from '../repositories/IDemoSendRepository';
import type { IContactRepository } from '../repositories/IContactRepository';
import type { IEmailProvider } from '../providers/IEmailProvider';
import { DemoSend } from '../entities/DemoSend';
import { CONTACT_TYPES } from '../types/contact-types';
import { ValidationError, NotFoundError } from '@/lib/errors';

/**
 * Input for sending demo to DJs
 */
export interface SendDemoInput {
  demoId: string;
  contactIds: number[];
  userId: number;
  emailSubject: string;
  emailBodyHtml: string;
  personalNote?: string;
}

/**
 * Skipped contact information
 */
export interface SkippedContact {
  contactId: number;
  reason: string;
}

/**
 * Result of demo send operation
 */
export interface SendDemoResult {
  success: boolean;
  totalSent: number;
  totalSkipped: number;
  sentTo: number[];
  skipped: SkippedContact[];
  error?: string;
}

/**
 * SendDemoUseCase
 *
 * Handles sending demos to DJs with validation and tracking.
 * Implements duplicate prevention and contact type filtering.
 */
export class SendDemoUseCase {
  constructor(
    private readonly demoRepository: IDemoRepository,
    private readonly demoSendRepository: IDemoSendRepository,
    private readonly contactRepository: IContactRepository,
    private readonly emailProvider: IEmailProvider
  ) {}

  /**
   * Executes demo sending to multiple DJ contacts
   *
   * @param input - Demo send data
   * @returns Result with sent/skipped counts and contact IDs
   */
  async execute(input: SendDemoInput): Promise<SendDemoResult> {
    try {
      // 1. Validate input
      this.validateInput(input);

      // 2. Validate demo exists and belongs to user
      const demo = await this.demoRepository.findById(input.demoId, input.userId);

      if (!demo) {
        return {
          success: false,
          totalSent: 0,
          totalSkipped: 0,
          sentTo: [],
          skipped: [],
          error: 'Demo not found or access denied',
        };
      }

      // 3. Validate demo is ready to send
      if (!demo.isReadyToSend()) {
        return {
          success: false,
          totalSent: 0,
          totalSkipped: 0,
          sentTo: [],
          skipped: [],
          error: 'Demo is not ready to send (missing required fields or inactive)',
        };
      }

      // 4. Get all contacts for user (for validation)
      const allContacts = await this.contactRepository.findAll(input.userId);
      const contactsMap = new Map(allContacts.map((c) => [c.id, c]));

      // 5. Process each contact and send emails
      const sentTo: number[] = [];
      const skipped: SkippedContact[] = [];

      for (const contactId of input.contactIds) {
        // Validate contact exists and belongs to user
        const contact = contactsMap.get(contactId);

        if (!contact) {
          skipped.push({
            contactId,
            reason: 'Contact not found or access denied',
          });
          continue;
        }

        // Check if contact is DJ type
        const isDJ = contact.metadata?.types?.includes(CONTACT_TYPES.DJ);

        if (!isDJ) {
          skipped.push({
            contactId,
            reason: 'Contact is not a DJ',
          });
          continue;
        }

        // Check if contact is subscribed
        if (!contact.subscribed) {
          skipped.push({
            contactId,
            reason: 'Contact is not subscribed',
          });
          continue;
        }

        // Check if demo was already sent to this contact
        const alreadySent = await this.demoSendRepository.hasBeenSent(
          input.demoId,
          contactId
        );

        if (alreadySent) {
          skipped.push({
            contactId,
            reason: 'Demo already sent to this contact',
          });
          continue;
        }

        // Send email to DJ
        const emailResult = await this.emailProvider.send({
          to: contact.email,
          subject: input.emailSubject,
          html: input.emailBodyHtml,
          headers: {
            // Enable tracking pixel for open detection
            'X-Demo-Send-ID': randomUUID(),
          },
        });

        if (!emailResult.success) {
          skipped.push({
            contactId,
            reason: `Email send failed: ${emailResult.error || 'Unknown error'}`,
          });
          continue;
        }

        // Create demo send record
        const sendId = randomUUID();

        try {
          const demoSend = DemoSend.createNew({
            id: sendId,
            demoId: input.demoId,
            contactId,
            userId: input.userId.toString(),
            emailSubject: input.emailSubject,
            emailBodyHtml: input.emailBodyHtml,
            personalNote: input.personalNote,
            resendEmailId: emailResult.messageId,
            sentAt: new Date(),
          });

          await this.demoSendRepository.create({
            id: demoSend.id,
            demoId: demoSend.demoId,
            contactId: demoSend.contactId,
            userId: input.userId,
            emailSubject: demoSend.emailSubject,
            emailBodyHtml: demoSend.emailBodyHtml,
            personalNote: demoSend.personalNote,
            resendEmailId: demoSend.resendEmailId,
          });

          sentTo.push(contactId);
        } catch (error) {
          // If demo send record creation fails, log but continue
          // Email was already sent, so we don't want to fail the entire operation
          skipped.push({
            contactId,
            reason: `Email sent but tracking record failed: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          });
        }
      }

      // 6. Return aggregate results
      return {
        success: true,
        totalSent: sentTo.length,
        totalSkipped: skipped.length,
        sentTo,
        skipped,
      };
    } catch (error) {
      // Unexpected error
      if (error instanceof Error) {
        return {
          success: false,
          totalSent: 0,
          totalSkipped: 0,
          sentTo: [],
          skipped: [],
          error: error.message,
        };
      }

      return {
        success: false,
        totalSent: 0,
        totalSkipped: 0,
        sentTo: [],
        skipped: [],
        error: 'Failed to send demo',
      };
    }
  }

  /**
   * Validates send demo input
   *
   * @param input - Input to validate
   * @throws ValidationError if input is invalid
   */
  private validateInput(input: SendDemoInput): void {
    if (!input.userId || input.userId <= 0) {
      throw new ValidationError('Invalid userId');
    }

    if (!input.demoId || input.demoId.trim().length === 0) {
      throw new ValidationError('Demo ID cannot be empty');
    }

    if (!input.contactIds || input.contactIds.length === 0) {
      throw new ValidationError('At least one contact must be selected');
    }

    // Validate all contact IDs are positive numbers
    for (const contactId of input.contactIds) {
      if (!contactId || contactId <= 0) {
        throw new ValidationError('Invalid contact ID');
      }
    }

    if (!input.emailSubject || input.emailSubject.trim().length === 0) {
      throw new ValidationError('Email subject cannot be empty');
    }

    if (!input.emailBodyHtml || input.emailBodyHtml.trim().length === 0) {
      throw new ValidationError('Email body cannot be empty');
    }
  }
}
