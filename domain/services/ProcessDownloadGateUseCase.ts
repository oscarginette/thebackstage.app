/**
 * ProcessDownloadGateUseCase
 *
 * Main use case for processing download gate form submissions.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Validate gate exists and is active
 * - Check for duplicate submission (email + gate)
 * - Create contact if new email
 * - Create download submission record
 * - Log GDPR consent (consentMarketing = accepts ALL brands: Backstage + Gee Beat + Artist)
 * - Send confirmation email with next steps
 *
 * Consent Logic:
 * - Simple format only: consentMarketing boolean
 * - When true: user accepts emails from ALL brands (no granular consent)
 * - When false: submission rejected (must accept to download)
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (gate form submission)
 * - OCP: Open for extension (easy to add new verification types)
 * - DIP: Depends on interfaces, not concrete classes
 *
 * GDPR: Logs consent with IP/UA for audit trail
 */

import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { IDownloadSubmissionRepository } from '../repositories/IDownloadSubmissionRepository';
import { IContactRepository } from '../repositories/IContactRepository';
import { IConsentHistoryRepository } from '../repositories/IConsentHistoryRepository';
import { IEmailProvider } from '../providers/IEmailProvider';
import {
  GateNotFoundError,
  GateInactiveError,
  GateExpiredError,
  DuplicateSubmissionError,
} from '../errors/DownloadGateErrors';
import { ValidationError } from '@/lib/errors';
import {
  DOWNLOAD_SOURCES,
  CONSENT_BRANDS,
  type DownloadConsentMetadata,
} from '../types/download-gate-constants';
import { CONSENT_ACTIONS, CONSENT_SOURCES } from '../entities/ConsentHistory';

export interface ProcessDownloadGateInput {
  gateSlug: string; // Public gate identifier
  email: string;
  firstName?: string;
  consentMarketing: boolean; // User accepts ALL marketing (Backstage + Gee Beat + Artist)
  ipAddress: string | null;
  userAgent: string | null;
}

export interface ProcessDownloadGateResult {
  success: boolean;
  submissionId?: string;
  requiresVerification: boolean; // true if email/social verification needed
  verificationsSent?: {
    email: boolean;
    soundcloudRepost: boolean;
    soundcloudFollow: boolean;
    spotifyConnect: boolean;
    instagramFollow: boolean;
  };
  error?: string;
}

/**
 * ProcessDownloadGateUseCase
 *
 * Orchestrates the complete download gate submission flow:
 * 1. Validate gate
 * 2. Check duplicate
 * 3. Create/update contact
 * 4. Create submission
 * 5. Log consent (consentMarketing = ALL brands accepted)
 * 6. Send email
 */
export class ProcessDownloadGateUseCase {
  constructor(
    private readonly gateRepository: IDownloadGateRepository,
    private readonly submissionRepository: IDownloadSubmissionRepository,
    private readonly contactRepository: IContactRepository,
    private readonly consentHistoryRepository: IConsentHistoryRepository,
    private readonly emailProvider: IEmailProvider
  ) {}

  /**
   * Execute download gate form submission
   * @param input - Form submission data
   * @returns Result with submission ID or error
   */
  async execute(input: ProcessDownloadGateInput): Promise<ProcessDownloadGateResult> {
    try {
      // 1. Validate input
      this.validateInput(input);

      // 2. Find and validate gate
      const gate = await this.findAndValidateGate(input.gateSlug);

      // 3. Check for duplicate submission
      await this.checkDuplicateSubmission(input.email, gate.id);

      // 4. Find or create contact
      const contact = await this.findOrCreateContact(input, gate.userId);

      // 5. Create download submission
      const submission = await this.createSubmission(input, gate.id);

      // 6. Log GDPR consent (multi-brand: Backstage + Gbid)
      await this.logConsentHistory(contact.id, input, gate);

      // 7. Send confirmation email
      await this.sendConfirmationEmail(input.email, gate, submission.id);

      // 8. Return result with verification requirements
      return {
        success: true,
        submissionId: submission.id,
        requiresVerification: this.requiresVerification(gate),
        verificationsSent: {
          email: gate.requireEmail,
          soundcloudRepost: gate.requireSoundcloudRepost,
          soundcloudFollow: gate.requireSoundcloudFollow,
          spotifyConnect: gate.requireSpotifyConnect,
          instagramFollow: gate.requireInstagramFollow,
        },
      };
    } catch (error) {
      console.error('[ProcessDownloadGateUseCase] Execute error:', error);

      // Re-throw domain errors
      if (
        error instanceof GateNotFoundError ||
        error instanceof GateInactiveError ||
        error instanceof GateExpiredError ||
        error instanceof DuplicateSubmissionError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      // Wrap unexpected errors
      throw new Error(
        error instanceof Error ? error.message : 'Failed to process download gate submission'
      );
    }
  }

  /**
   * Validate input data
   * @param input - Form submission data
   * @throws ValidationError if invalid
   */
  private validateInput(input: ProcessDownloadGateInput): void {
    if (!input.gateSlug || input.gateSlug.trim().length === 0) {
      throw new ValidationError('Gate slug is required');
    }

    if (!input.email || !input.email.includes('@')) {
      throw new ValidationError('Valid email is required');
    }

    // GDPR: consent must be explicit boolean
    if (typeof input.consentMarketing !== 'boolean') {
      throw new ValidationError('Marketing consent must be explicitly provided');
    }

    // User must accept marketing to download
    if (!input.consentMarketing) {
      throw new ValidationError('You must accept marketing consent to download');
    }
  }

  /**
   * Find gate by slug and validate it's active
   * @param slug - Gate slug
   * @returns DownloadGate entity
   * @throws GateNotFoundError, GateInactiveError, GateExpiredError
   */
  private async findAndValidateGate(slug: string) {
    const gate = await this.gateRepository.findBySlug(slug);

    if (!gate) {
      throw new GateNotFoundError(`Gate not found: ${slug}`);
    }

    if (!gate.active) {
      throw new GateInactiveError('This download gate is no longer active');
    }

    if (gate.expiresAt && gate.expiresAt < new Date()) {
      throw new GateExpiredError('This download gate has expired');
    }

    return gate;
  }

  /**
   * Check if user has already submitted to this gate
   * @param email - User email
   * @param gateId - Gate UUID
   * @throws DuplicateSubmissionError if exists
   */
  private async checkDuplicateSubmission(email: string, gateId: string): Promise<void> {
    const existing = await this.submissionRepository.findByEmailAndGate(email, gateId);

    if (existing) {
      throw new DuplicateSubmissionError(
        'You have already submitted to this download gate. Check your email for the download link.'
      );
    }
  }

  /**
   * Find existing contact or create new one
   * @param input - Form submission data
   * @param userId - Gate owner user ID
   * @returns Contact
   */
  private async findOrCreateContact(input: ProcessDownloadGateInput, userId: number) {
    let contact = await this.contactRepository.findByEmail(input.email, userId);

    if (!contact) {
      // Create new contact
      // consentMarketing=true means user accepts ALL brands (Backstage + Gee Beat)
      const result = await this.contactRepository.bulkImport([
        {
          userId,
          email: input.email,
          name: input.firstName || null,
          subscribed: input.consentMarketing, // Subscribed if accepted marketing
          source: DOWNLOAD_SOURCES.THE_BACKSTAGE, // Always from The Backstage platform
          metadata: {
            downloadGate: true,
            firstName: input.firstName,
            consentMarketing: input.consentMarketing,
            acceptedAllBrands: true, // User accepts Backstage + Gee Beat + Artist
          },
        },
      ]);

      // Fetch newly created contact
      contact = await this.contactRepository.findByEmail(input.email, userId);

      if (!contact) {
        throw new Error('Failed to create contact');
      }
    } else {
      // Update existing contact subscription status if needed
      if (contact.subscribed !== input.consentMarketing) {
        await this.contactRepository.updateSubscriptionStatus(
          contact.id,
          input.consentMarketing,
          userId
        );
      }
      // Note: Metadata update for existing contacts is not supported yet
      // Consent history will be logged separately
    }

    return contact;
  }

  /**
   * Create download submission record
   * @param input - Form submission data
   * @param gateId - Gate UUID
   * @returns Created submission
   */
  private async createSubmission(input: ProcessDownloadGateInput, gateId: string) {
    return await this.submissionRepository.create({
      gateId,
      email: input.email,
      firstName: input.firstName,
      consentMarketing: input.consentMarketing,
      ipAddress: input.ipAddress || undefined,
      userAgent: input.userAgent || undefined,
    });
  }

  /**
   * Log GDPR consent history
   * consentMarketing=true means user accepts ALL brands (Backstage + Gee Beat + Artist)
   * @param contactId - Contact ID
   * @param input - Form submission data
   * @param gate - Download gate
   */
  private async logConsentHistory(
    contactId: number,
    input: ProcessDownloadGateInput,
    gate: any
  ): Promise<void> {
    // Construct metadata compatible with ConsentHistoryMetadata
    const downloadMetadata = {
      acceptedBackstage: input.consentMarketing, // User accepts ALL when true
      acceptedGeeBeat: input.consentMarketing, // User accepts ALL when true
      acceptedArtist: true, // Always true (artist owns content)
      downloadSource: DOWNLOAD_SOURCES.THE_BACKSTAGE, // Always from The Backstage
      gateSlug: input.gateSlug,
      trackTitle: gate.title,
      artistName: gate.artistName || undefined,
    };

    // Log download gate submission consent
    await this.consentHistoryRepository.create({
      contactId,
      action: CONSENT_ACTIONS.SUBSCRIBE,
      timestamp: new Date(),
      source: CONSENT_SOURCES.DOWNLOAD_GATE,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: downloadMetadata as any, // Cast to ConsentHistoryMetadata (flexible JSONB)
    });
  }

  /**
   * Send confirmation email with next steps
   * @param email - User email
   * @param gate - Download gate
   * @param submissionId - Submission UUID
   */
  private async sendConfirmationEmail(
    email: string,
    gate: any,
    submissionId: string
  ): Promise<void> {
    try {
      // Import template dynamically
      const { DownloadGateConfirmationEmail } = await import(
        '@/infrastructure/email/templates/DownloadGateConfirmationEmail'
      );

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thebackstage.app';

      await this.emailProvider.send({
        to: email,
        subject: DownloadGateConfirmationEmail.getSubject(gate.title),
        html: DownloadGateConfirmationEmail.getHtml({
          trackTitle: gate.title,
          artistName: gate.artistName || 'Artist',
          submissionId,
          requiresVerification: this.requiresVerification(gate),
          verificationUrl: `${baseUrl}/gate/${gate.slug}`,
        }),
        // CAN-SPAM: Include unsubscribe link
        unsubscribeUrl: `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}`,
      });
    } catch (error) {
      // Log error but don't throw (email failure shouldn't block submission)
      console.error('[ProcessDownloadGateUseCase] Email send error:', error);
    }
  }

  /**
   * Check if gate requires any verifications
   * @param gate - Download gate
   * @returns true if verifications required
   */
  private requiresVerification(gate: any): boolean {
    return (
      gate.requireEmail ||
      gate.requireSoundcloudRepost ||
      gate.requireSoundcloudFollow ||
      gate.requireSpotifyConnect ||
      gate.requireInstagramFollow
    );
  }
}
