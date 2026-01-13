/**
 * VerifySendingDomainUseCase
 *
 * Handles domain verification via Mailgun DNS checks.
 * Checks if user has configured DNS records correctly.
 *
 * Flow:
 * 1. Fetch domain by ID
 * 2. Verify ownership (security check)
 * 3. Validate domain can be verified (status check)
 * 4. Check Mailgun domain name exists
 * 5. Call Mailgun verification API (checks DNS records)
 * 6. Determine new status
 * 7. Build error message
 * 8. Update domain status in database
 * 9. Return verification result
 *
 * Verification Logic:
 * - Mailgun checks SPF, DKIM, DMARC records via DNS lookup
 * - Domain is "verified" only when SPF AND DKIM are valid
 * - DMARC is optional but recommended
 *
 * Status Transitions:
 * - pending → verified (success)
 * - pending → failed (DNS not configured)
 * - dns_configured → verified (success)
 * - dns_configured → failed (DNS configured incorrectly)
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (verify domain)
 * - OCP: Open for extension (easy to add verification rules)
 * - LSP: Works with any ISendingDomainRepository/IMailgunClient implementation
 * - ISP: Uses specific interfaces only
 * - DIP: Depends on interfaces, not concrete classes
 */

import { ISendingDomainRepository } from '../repositories/ISendingDomainRepository';
import { IMailgunClient } from '../providers/IMailgunClient';
import { SendingDomain, DomainStatus, DOMAIN_STATUS } from '../entities/SendingDomain';
import { AccessDeniedError } from '@/lib/errors';

export interface VerifySendingDomainInput {
  domainId: number;
  userId: number;
}

export interface VerifySendingDomainResult {
  success: boolean;
  status: DomainStatus;
  domain?: SendingDomain;
  error?: string;
}

/**
 * VerifySendingDomainUseCase
 *
 * Business logic for verifying artist-owned domains.
 * Orchestrates Mailgun verification and database updates.
 */
export class VerifySendingDomainUseCase {
  constructor(
    private readonly sendingDomainRepository: ISendingDomainRepository,
    private readonly mailgunClient: IMailgunClient
  ) {}

  /**
   * Execute domain verification
   *
   * @param input - Domain ID to verify
   * @returns Verification result with new status
   *
   * Example:
   * const result = await useCase.execute({ domainId: 123 });
   * if (result.success) {
   *   console.log('Domain verified!');
   * }
   */
  async execute(
    input: VerifySendingDomainInput
  ): Promise<VerifySendingDomainResult> {
    try {
      // 1. Fetch domain by ID
      const domain = await this.sendingDomainRepository.findById(input.domainId);
      if (!domain) {
        console.log('[VerifySendingDomain] Domain not found:', input.domainId);
        return {
          success: false,
          status: DOMAIN_STATUS.FAILED,
          error: 'Domain not found',
        };
      }

      // 2. Verify ownership (SECURITY: Prevent unauthorized domain verification)
      if (domain.userId !== input.userId) {
        console.warn('[VerifySendingDomain] Ownership check failed:', {
          domainId: input.domainId,
          domainUserId: domain.userId,
          requestUserId: input.userId,
        });
        throw new AccessDeniedError('You do not have permission to verify this domain');
      }

      console.log('[VerifySendingDomain] Verifying domain:', {
        id: domain.id,
        domain: domain.domain,
        currentStatus: domain.status,
      });

      // 3. Check if can verify (status must be pending or dns_configured)
      if (!domain.canVerify()) {
        console.log('[VerifySendingDomain] Domain cannot be verified:', {
          currentStatus: domain.status,
          reason: 'Invalid status for verification',
        });
        return {
          success: false,
          status: domain.status,
          error: `Cannot verify domain with status: ${domain.status}. Domain must be in 'pending' or 'dns_configured' status.`,
        };
      }

      // 4. Check if Mailgun domain name exists
      if (!domain.mailgunDomainName) {
        console.error('[VerifySendingDomain] Missing Mailgun domain name:', domain.id);
        return {
          success: false,
          status: domain.status,
          error: 'Mailgun domain not configured. Please delete and re-add this domain.',
        };
      }

      console.log('[VerifySendingDomain] Calling Mailgun verification API:', domain.mailgunDomainName);

      // 5. Verify with Mailgun (checks DNS records)
      const verificationResult = await this.mailgunClient.verifyDomain(
        domain.mailgunDomainName
      );

      console.log('[VerifySendingDomain] Mailgun verification result:', {
        verified: verificationResult.verified,
        spfVerified: verificationResult.spfVerified,
        dkimVerified: verificationResult.dkimVerified,
        dmarcVerified: verificationResult.dmarcVerified,
        error: verificationResult.error,
      });

      // 6. Determine new status based on verification result
      const newStatus = verificationResult.verified
        ? DOMAIN_STATUS.VERIFIED
        : DOMAIN_STATUS.FAILED;

      // 7. Build error message for failed verification
      const errorMessage = this.buildErrorMessage(verificationResult);

      console.log('[VerifySendingDomain] Updating domain status:', {
        oldStatus: domain.status,
        newStatus,
        errorMessage,
      });

      // 8. Update status in database
      const updatedDomain = await this.sendingDomainRepository.updateVerificationStatus(
        domain.id,
        {
          status: newStatus,
          errorMessage,
        }
      );

      // 9. Return result
      return {
        success: verificationResult.verified,
        status: newStatus,
        domain: updatedDomain,
        error: errorMessage || undefined,
      };
    } catch (error) {
      console.error('[VerifySendingDomain] Unexpected error:', error);

      // Don't expose internal errors to user
      return {
        success: false,
        status: DOMAIN_STATUS.FAILED,
        error: 'Failed to verify domain. Please try again later.',
      };
    }
  }

  /**
   * Build user-friendly error message for failed verification
   *
   * @param result - Mailgun verification result
   * @returns Error message or null if verified
   */
  private buildErrorMessage(
    result: {
      verified: boolean;
      spfVerified: boolean;
      dkimVerified: boolean;
      dmarcVerified: boolean;
      error?: string;
    }
  ): string | null {
    // If verified, no error message
    if (result.verified) {
      return null;
    }

    // Build specific error messages based on what failed
    const errors: string[] = [];

    if (!result.spfVerified) {
      errors.push('SPF record not verified');
    }

    if (!result.dkimVerified) {
      errors.push('DKIM record not verified');
    }

    if (!result.dmarcVerified) {
      errors.push('DMARC record not verified (optional)');
    }

    // If we have specific errors, return them
    if (errors.length > 0) {
      return `DNS verification failed: ${errors.join(', ')}. Please ensure all DNS records are configured correctly and allow up to 48 hours for DNS propagation.`;
    }

    // Fallback to generic error from Mailgun
    return result.error || 'DNS records not verified. Please check your DNS configuration.';
  }
}
