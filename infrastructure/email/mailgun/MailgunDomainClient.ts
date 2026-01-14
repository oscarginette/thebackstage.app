/**
 * MailgunDomainClient
 *
 * Implementation of IMailgunClient for Mailgun Domains API.
 * Handles domain creation, verification, and DNS record parsing.
 *
 * Purpose: Enable artists to verify their own domains for email sending.
 * Each verified domain allows sending from custom addresses (e.g., info@geebeat.com).
 *
 * Features:
 * - Creates domains in Mailgun with secure SMTP passwords
 * - Extracts and parses DNS records (SPF, DKIM, DMARC, MX, CNAME)
 * - Verifies DNS configuration status
 * - Handles errors gracefully with detailed error messages
 *
 * Clean Architecture: Infrastructure layer implementation.
 * SOLID: Implements IMailgunClient interface (DIP), single responsibility (SRP).
 *
 * @see infrastructure/email/mailgun/IMailgunClient.ts for interface
 * @see domain/entities/SendingDomain.ts for domain entity
 */

import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { randomBytes } from 'crypto';
import { DNSRecords } from '@/domain/entities/SendingDomain';
import {
  IMailgunClient,
  MailgunDomainCreationResult,
  MailgunDomainVerificationResult,
} from '@/domain/providers/IMailgunClient';

/**
 * MailgunDomainClient
 *
 * Concrete implementation of IMailgunClient using mailgun.js library.
 *
 * SECURITY:
 * - Generates secure random SMTP passwords (32 bytes = 256 bits)
 * - Uses parameterized API calls (no injection risk)
 * - API key stored in environment (never exposed to client)
 *
 * GDPR Compliance:
 * - No personal data stored in Mailgun (only domain names)
 * - DNS records are public information (not personal data)
 *
 * Robustness:
 * - Handles missing DNS records gracefully (returns empty strings)
 * - Detailed error logging for troubleshooting
 * - Validates DNS record structure before parsing
 */
export class MailgunDomainClient implements IMailgunClient {
  private mg: any;

  constructor(apiKey: string, apiUrl: string = 'https://api.mailgun.net') {
    const mailgun = new Mailgun(FormData);
    this.mg = mailgun.client({
      username: 'api',
      key: apiKey,
      url: apiUrl,
    });
  }

  /**
   * Create domain in Mailgun
   *
   * API: POST /v3/domains
   * Docs: https://documentation.mailgun.com/docs/mailgun/api-reference/openapi-final/tag/Domains/#tag/Domains/operation/postDomains
   *
   * @param domain - Domain name (e.g., "geebeat.com")
   * @returns Creation result with DNS records
   */
  async createDomain(domain: string): Promise<MailgunDomainCreationResult> {
    try {
      console.log('[MailgunDomainClient] Creating domain:', domain);
      console.log('[MailgunDomainClient] Mailgun client config:', {
        hasClient: !!this.mg,
        hasDomains: !!this.mg?.domains,
        hasCreate: !!this.mg?.domains?.create,
      });

      // Call Mailgun Domains API
      console.log('[MailgunDomainClient] Calling mg.domains.create with:', {
        name: domain,
        spam_action: 'disabled',
        wildcard: false,
      });

      const response = await this.mg.domains.create({
        name: domain,
        smtp_password: this.generateSecurePassword(),
        spam_action: 'disabled', // Don't reject spam (let user decide)
        wildcard: false,         // Don't accept wildcard subdomains
      });

      console.log('[MailgunDomainClient] Raw Mailgun response received');
      console.log('[MailgunDomainClient] Response type:', typeof response);
      console.log('[MailgunDomainClient] Response keys:', Object.keys(response || {}));

      console.log('[MailgunDomainClient] Domain created successfully:', {
        domain,
        mailgunDomainName: response.name,  // v4 API returns name directly
        state: response.state,
        hasSendingRecords: !!response.sending_dns_records,
        hasReceivingRecords: !!response.receiving_dns_records,
        recordsCount: response.sending_dns_records?.length || 0,
      });

      // Extract DNS records from response
      console.log('[MailgunDomainClient] Parsing DNS records...');
      const dnsRecords = this.parseDNSRecords(response);
      console.log('[MailgunDomainClient] DNS records parsed successfully');

      return {
        success: true,
        mailgunDomainName: response.name,  // v4 API returns name directly
        dnsRecords,
      };
    } catch (error: unknown) {
      // Enhanced error logging
      console.error('[MailgunDomainClient] ERROR - Detailed information:');
      console.error('[MailgunDomainClient] Error type:', error?.constructor?.name);
      console.error('[MailgunDomainClient] Error instanceof Error:', error instanceof Error);

      if (error instanceof Error) {
        console.error('[MailgunDomainClient] Error message:', error.message);
        console.error('[MailgunDomainClient] Error stack:', error.stack);
      }

      console.error('[MailgunDomainClient] Error as object:', {
        error,
        errorString: String(error),
        errorJSON: JSON.stringify(error, null, 2),
      });

      const errorMessage = this.extractErrorMessage(error);

      console.error('[MailgunDomainClient] Failed to create domain:', {
        domain,
        extractedErrorMessage: errorMessage,
      });

      return {
        success: false,
        mailgunDomainName: '',
        dnsRecords: this.getEmptyDNSRecords(),
        error: errorMessage,
      };
    }
  }

  /**
   * Verify domain DNS configuration
   *
   * API: GET /v3/domains/{domain}
   * Docs: https://documentation.mailgun.com/docs/mailgun/api-reference/openapi-final/tag/Domains/#tag/Domains/operation/getDomain
   *
   * @param mailgunDomainName - Mailgun domain identifier
   * @returns Verification result with status of each DNS record
   *
   * NOTE: Mailgun automatically checks DNS records and updates status.
   * A domain is considered verified when both SPF and DKIM are 'valid'.
   */
  async verifyDomain(
    mailgunDomainName: string
  ): Promise<MailgunDomainVerificationResult> {
    try {
      console.log('[MailgunDomainClient] Verifying domain:', mailgunDomainName);

      // Get domain details from Mailgun
      const domain = await this.mg.domains.get(mailgunDomainName);

      console.log('[MailgunDomainClient] Domain details:', {
        mailgunDomainName,
        state: domain.state,
        sending_dns_records_count: domain.sending_dns_records?.length || 0,
      });

      // Extract verification status for each record type
      const sendingRecords = domain.sending_dns_records || [];

      // SPF: TXT record without underscores (e.g., geebeat.com)
      const spfRecord = sendingRecords.find(
        (r: any) =>
          r.record_type === 'TXT' &&
          !r.name.includes('_') &&
          r.value?.includes('v=spf1')
      );
      const spfVerified = spfRecord?.valid === 'valid';

      // DKIM: TXT record with _domainkey (e.g., smtp._domainkey.geebeat.com)
      const dkimRecord = sendingRecords.find(
        (r: any) => r.record_type === 'TXT' && r.name.includes('_domainkey')
      );
      const dkimVerified = dkimRecord?.valid === 'valid';

      // DMARC: TXT record with _dmarc (e.g., _dmarc.geebeat.com)
      const dmarcRecord = sendingRecords.find(
        (r: any) => r.record_type === 'TXT' && r.name.includes('_dmarc')
      );
      const dmarcVerified = dmarcRecord?.valid === 'valid';

      // Overall verification: SPF + DKIM required (DMARC optional but recommended)
      const verified = spfVerified && dkimVerified;

      console.log('[MailgunDomainClient] Verification status:', {
        mailgunDomainName,
        verified,
        spfVerified,
        dkimVerified,
        dmarcVerified,
      });

      return {
        verified,
        spfVerified,
        dkimVerified,
        dmarcVerified,
        error: verified ? undefined : 'DNS records not verified. Check your DNS configuration.',
      };
    } catch (error: unknown) {
      const errorMessage = this.extractErrorMessage(error);

      console.error('[MailgunDomainClient] Verification failed:', {
        mailgunDomainName,
        error,
        errorMessage,
      });

      return {
        verified: false,
        spfVerified: false,
        dkimVerified: false,
        dmarcVerified: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Delete domain from Mailgun
   *
   * API: DELETE /v3/domains/{domain}
   * Docs: https://documentation.mailgun.com/docs/mailgun/api-reference/openapi-final/tag/Domains/#tag/Domains/operation/deleteDomain
   *
   * @param mailgunDomainName - Mailgun domain identifier
   *
   * CAUTION: This is destructive. All domain stats and logs will be lost.
   * Consider soft-delete in database instead of hard delete.
   */
  async deleteDomain(mailgunDomainName: string): Promise<void> {
    try {
      console.log('[MailgunDomainClient] Deleting domain:', mailgunDomainName);

      await this.mg.domains.destroy(mailgunDomainName);

      console.log('[MailgunDomainClient] Domain deleted successfully:', mailgunDomainName);
    } catch (error: unknown) {
      const errorMessage = this.extractErrorMessage(error);

      console.error('[MailgunDomainClient] Failed to delete domain:', {
        mailgunDomainName,
        error,
        errorMessage,
      });

      // Don't throw - treat deletion errors as non-fatal
      // Domain may already be deleted or not exist
    }
  }

  /**
   * Get domain information
   *
   * API: GET /v3/domains/{domain}
   *
   * @param mailgunDomainName - Mailgun domain identifier
   * @returns Domain details from Mailgun
   */
  async getDomainInfo(mailgunDomainName: string): Promise<any> {
    try {
      console.log('[MailgunDomainClient] Getting domain info:', mailgunDomainName);

      const domain = await this.mg.domains.get(mailgunDomainName);

      console.log('[MailgunDomainClient] Domain info retrieved:', {
        mailgunDomainName,
        state: domain.state,
      });

      return domain;
    } catch (error: unknown) {
      const errorMessage = this.extractErrorMessage(error);

      console.error('[MailgunDomainClient] Failed to get domain info:', {
        mailgunDomainName,
        error,
        errorMessage,
      });

      throw error; // Let caller handle
    }
  }

  /**
   * Parse DNS records from Mailgun API response
   *
   * Extracts SPF, DKIM, DMARC, MX, and tracking CNAME records.
   * Handles missing records gracefully (returns empty strings).
   *
   * @param response - Mailgun API response from domain creation
   * @returns Parsed DNS records in our domain format
   *
   * NOTE: Mailgun returns both sending_dns_records and receiving_dns_records.
   * - sending_dns_records: SPF, DKIM, tracking CNAME (required for sending)
   * - receiving_dns_records: MX records (required for receiving)
   */
  private parseDNSRecords(response: any): DNSRecords {
    const sendingRecords = response.sending_dns_records || [];
    const receivingRecords = response.receiving_dns_records || [];

    console.log('[MailgunDomainClient] Parsing DNS records:', {
      sendingRecordsCount: sendingRecords.length,
      receivingRecordsCount: receivingRecords.length,
    });

    // SPF: TXT record without underscores (e.g., geebeat.com)
    const spfRecord = sendingRecords.find(
      (r: any) =>
        r.record_type === 'TXT' &&
        !r.name.includes('_') &&
        r.value?.includes('v=spf1')
    );

    // DKIM: TXT record with _domainkey (e.g., smtp._domainkey.geebeat.com)
    const dkimRecord = sendingRecords.find(
      (r: any) => r.record_type === 'TXT' && r.name.includes('_domainkey')
    );

    // DMARC: TXT record with _dmarc (e.g., _dmarc.geebeat.com)
    // Mailgun generates a DMARC record automatically
    const dmarcRecord = sendingRecords.find(
      (r: any) => r.record_type === 'TXT' && r.name.includes('_dmarc')
    );

    // Tracking CNAME: For click/open tracking (optional)
    const trackingRecord = sendingRecords.find(
      (r: any) => r.record_type === 'CNAME'
    );

    // MX Records: For receiving emails (optional)
    const mxRecords = receivingRecords
      .filter((r: any) => r.record_type === 'MX')
      .map((r: any) => ({
        type: 'MX' as const,
        name: r.name || '',
        value: r.value || '',
        priority: r.priority || 10,
      }));

    const dnsRecords: DNSRecords = {
      spf: {
        type: 'TXT',
        name: spfRecord?.name || '',
        value: spfRecord?.value || '',
      },
      dkim: {
        type: 'TXT',
        name: dkimRecord?.name || '',
        value: dkimRecord?.value || '',
      },
      dmarc: {
        type: 'TXT',
        name: dmarcRecord?.name || '',
        value: dmarcRecord?.value || 'v=DMARC1; p=none', // Default DMARC policy
      },
    };

    // Add optional records if present
    if (trackingRecord) {
      dnsRecords.tracking = {
        type: 'CNAME',
        name: trackingRecord.name || '',
        value: trackingRecord.value || '',
      };
    }

    if (mxRecords.length > 0) {
      dnsRecords.mx = mxRecords;
    }

    console.log('[MailgunDomainClient] DNS records parsed:', {
      hasSPF: !!spfRecord,
      hasDKIM: !!dkimRecord,
      hasDMARC: !!dmarcRecord,
      hasTracking: !!trackingRecord,
      mxRecordsCount: mxRecords.length,
    });

    return dnsRecords;
  }

  /**
   * Generate secure SMTP password
   *
   * Uses crypto.randomBytes for cryptographically secure random password.
   * 32 bytes = 256 bits of entropy (very strong).
   *
   * @returns Secure random password (64-character hex string)
   */
  private generateSecurePassword(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Extract error message from unknown error type
   *
   * Handles different error formats from Mailgun API.
   *
   * @param error - Unknown error object
   * @returns User-friendly error message
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null) {
      // Mailgun errors have a 'message' property
      const mailgunError = error as any;
      if (mailgunError.message) {
        return mailgunError.message;
      }
    }

    return 'Failed to communicate with Mailgun API';
  }

  /**
   * Get empty DNS records structure
   *
   * Used when domain creation fails.
   *
   * @returns Empty DNS records
   */
  private getEmptyDNSRecords(): DNSRecords {
    return {
      spf: { type: 'TXT', name: '', value: '' },
      dkim: { type: 'TXT', name: '', value: '' },
      dmarc: { type: 'TXT', name: '', value: '' },
    };
  }
}
