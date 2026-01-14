/**
 * UpdateUserSenderEmailUseCase
 *
 * Updates user's custom sender email configuration for newsletters.
 * Enables artists to send emails from their own verified domain (e.g., "info@geebeat.com").
 *
 * Clean Architecture: Business logic in domain layer.
 * SOLID: Single Responsibility (updates sender config),
 *        Dependency Inversion (depends on interfaces).
 *
 * IMPORTANT: Domain must be verified in sending_domains table for emails to send successfully.
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { ISendingDomainRepository } from '../repositories/ISendingDomainRepository';
import { DomainNotFoundError, DomainNotVerifiedError } from '@/lib/errors';

export interface UpdateUserSenderEmailInput {
  userId: number;
  senderEmail: string | null;
  senderName: string | null;
}

export interface UpdateUserSenderEmailResult {
  success: boolean;
  message: string;
}

export class UpdateUserSenderEmailUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sendingDomainRepository: ISendingDomainRepository
  ) {}

  async execute(input: UpdateUserSenderEmailInput): Promise<UpdateUserSenderEmailResult> {
    console.log('[UpdateUserSenderEmailUseCase] START:', {
      userId: input.userId,
      senderEmail: input.senderEmail,
      senderName: input.senderName,
    });

    // 1. If clearing sender email (null), allow it without validation
    if (input.senderEmail === null) {
      await this.userRepository.updateSenderEmail(
        input.userId,
        null,
        null
      );

      console.log('[UpdateUserSenderEmailUseCase] Sender email cleared');
      return {
        success: true,
        message: 'Sender email cleared. Emails will use default sender.',
      };
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.senderEmail)) {
      console.error('[UpdateUserSenderEmailUseCase] Invalid email format:', input.senderEmail);
      return {
        success: false,
        message: 'Invalid email format',
      };
    }

    // 3. Extract domain from email (e.g., "info@geebeat.com" → "geebeat.com")
    const domainMatch = input.senderEmail.match(/@(.+)$/);
    if (!domainMatch || !domainMatch[1]) {
      console.error('[UpdateUserSenderEmailUseCase] Could not extract domain from:', input.senderEmail);
      return {
        success: false,
        message: 'Could not extract domain from email',
      };
    }

    const domain = domainMatch[1].toLowerCase().trim();

    console.log('[UpdateUserSenderEmailUseCase] Extracted domain:', domain);

    // 4. Check if domain is verified in sending_domains table
    try {
      const sendingDomain = await this.sendingDomainRepository.findByUserIdAndDomain(
        input.userId,
        domain
      );

      if (!sendingDomain) {
        console.error('[UpdateUserSenderEmailUseCase] Domain not found for user:', {
          userId: input.userId,
          domain,
        });
        throw new DomainNotFoundError(
          `Domain ${domain} is not configured. Please verify it in /settings/sending-domains first.`
        );
      }

      if (!sendingDomain.isVerified()) {
        console.error('[UpdateUserSenderEmailUseCase] Domain not verified:', {
          userId: input.userId,
          domain,
          status: sendingDomain.status,
        });
        throw new DomainNotVerifiedError(
          `Domain ${domain} is not verified yet. Please complete verification in /settings/sending-domains.`
        );
      }

      console.log('[UpdateUserSenderEmailUseCase] Domain is verified:', domain);
    } catch (error) {
      console.error('[UpdateUserSenderEmailUseCase] Domain validation failed:', error);

      if (error instanceof DomainNotFoundError || error instanceof DomainNotVerifiedError) {
        return {
          success: false,
          message: error.message,
        };
      }

      throw error;
    }

    // 5. Update sender email configuration
    await this.userRepository.updateSenderEmail(
      input.userId,
      input.senderEmail.toLowerCase().trim(),
      input.senderName?.trim() || null
    );

    console.log('[UpdateUserSenderEmailUseCase] Sender email updated successfully');

    return {
      success: true,
      message: `Sender email updated to ${input.senderEmail}`,
    };
  }
}
