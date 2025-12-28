/**
 * SubmitEmailUseCase
 *
 * Handles email submission for download gates.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Validate gate exists and is active
 * - Check email not already submitted for this gate (idempotency)
 * - Validate email format
 * - Create contact if consentMarketing = true (GDPR compliance)
 * - Track analytics event (submit)
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (email submission)
 * - DIP: Depends on repository interfaces
 */

import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { IDownloadSubmissionRepository } from '../repositories/IDownloadSubmissionRepository';
import { IDownloadAnalyticsRepository } from '../repositories/IDownloadAnalyticsRepository';
import { IContactRepository } from '../repositories/IContactRepository';
import { DownloadSubmission } from '../entities/DownloadSubmission';
import { CreateSubmissionInput } from '../types/download-gates';

export interface SubmitEmailInput {
  userId: number;
  gateSlug: string;
  email: string;
  firstName?: string;
  consentMarketing: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface SubmitEmailResult {
  success: boolean;
  submission?: DownloadSubmission;
  error?: string;
}

export class SubmitEmailUseCase {
  constructor(
    private readonly gateRepository: IDownloadGateRepository,
    private readonly submissionRepository: IDownloadSubmissionRepository,
    private readonly analyticsRepository: IDownloadAnalyticsRepository,
    private readonly contactRepository: IContactRepository
  ) {}

  /**
   * Execute email submission
   * @param input - Submission data
   * @returns SubmitEmailResult with submission or error
   */
  async execute(input: SubmitEmailInput): Promise<SubmitEmailResult> {
    try {
      // 1. Validate email format
      const emailValidation = this.validateEmail(input.email);
      if (!emailValidation.valid) {
        return { success: false, error: emailValidation.error };
      }

      // 2. Find gate by slug
      const gate = await this.gateRepository.findBySlug(input.gateSlug);
      if (!gate) {
        return {
          success: false,
          error: 'Download gate not found',
        };
      }

      // 3. Check gate is active
      if (!gate.isActive()) {
        return {
          success: false,
          error: 'This download gate is no longer active',
        };
      }

      // 4. Check if email already submitted for this gate
      const existingSubmission = await this.submissionRepository.findByEmailAndGate(
        input.email,
        parseInt(gate.id)
      );

      if (existingSubmission) {
        // Return existing submission (idempotent)
        return {
          success: true,
          submission: existingSubmission,
        };
      }

      // 5. Create submission
      const submissionData: CreateSubmissionInput = {
        gateId: parseInt(gate.id),
        email: input.email,
        firstName: input.firstName,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        consentMarketing: input.consentMarketing,
      };

      const submission = await this.submissionRepository.create(submissionData);

      // 6. Add to contacts if marketing consent given
      if (input.consentMarketing) {
        await this.addToContacts(input.email, input.firstName);
      }

      // 7. Track analytics event
      await this.trackSubmitEvent(gate.id, input);

      return {
        success: true,
        submission,
      };
    } catch (error) {
      console.error('SubmitEmailUseCase.execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit email',
      };
    }
  }

  /**
   * Validate email format
   * @param email - Email address
   * @returns Validation result
   */
  private validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email || email.trim().length === 0) {
      return { valid: false, error: 'Email is required' };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    if (email.length > 255) {
      return { valid: false, error: 'Email must be 255 characters or less' };
    }

    return { valid: true };
  }

  /**
   * Add email to contacts list
   * GDPR compliant: Only if user explicitly consented
   * @param email - Email address
   * @param firstName - Optional first name
   */
  private async addToContacts(email: string, firstName?: string): Promise<void> {
    try {
      // Using default userId 1 for download gates
      // TODO: Make userId configurable or derive from gate owner
      const userId = 1;

      // Check if contact already exists
      const existingContact = await this.contactRepository.findByEmail(email, userId);
      if (existingContact) {
        // Contact already exists, no need to add again
        console.log(`[GDPR] Contact already exists: ${email}`);
        return;
      }

      // Create new contact with GDPR consent
      const contactInput = {
        userId,
        email: email.toLowerCase().trim(),
        name: firstName || null,
        subscribed: true,
        source: 'download_gate',
        metadata: {
          consentedVia: 'download_gate',
          consentedAt: new Date().toISOString(),
        },
      };

      await this.contactRepository.bulkImport([contactInput]);

      console.log(`[GDPR] Contact created: ${email}`, {
        firstName,
        source: 'download_gate',
      });
    } catch (error) {
      // Non-critical error: submission succeeds even if contact creation fails
      console.error('Failed to add contact (non-critical):', error);
    }
  }

  /**
   * Track submit analytics event
   * @param gateId - Gate ID
   * @param input - Submission input
   */
  private async trackSubmitEvent(gateId: string, input: SubmitEmailInput): Promise<void> {
    try {
      await this.analyticsRepository.track({
        gateId: gateId,
        eventType: 'submit',
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
    } catch (error) {
      // Non-critical error: submission succeeds even if analytics tracking fails
      console.error('Failed to track submit event (non-critical):', error);
    }
  }
}
