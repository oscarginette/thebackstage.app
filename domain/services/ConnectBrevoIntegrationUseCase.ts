/**
 * ConnectBrevoIntegrationUseCase
 *
 * Connects a user's Brevo account by validating and storing their API key.
 *
 * Business logic:
 * 1. Validate API key by fetching account info from Brevo
 * 2. Encrypt API key
 * 3. Store integration in database
 * 4. Return connection result
 *
 * Clean Architecture:
 * - Business logic: API key validation and storage
 * - Dependencies: IBrevoIntegrationRepository, IBrevoAPIClient (DIP)
 * - No infrastructure coupling
 *
 * SOLID:
 * - SRP: Single responsibility (connect Brevo integration)
 * - DIP: Depends on interfaces, not concrete implementations
 */

import { IBrevoIntegrationRepository } from '@/domain/repositories/IBrevoIntegrationRepository';
import { IBrevoAPIClient } from '@/domain/repositories/IBrevoAPIClient';

export interface ConnectBrevoIntegrationInput {
  userId: number;
  apiKey: string;
}

export interface ConnectBrevoIntegrationResult {
  success: boolean;
  integration: {
    id: number;
    accountEmail: string;
    accountName: string;
    companyName: string | null;
    connectedAt: Date;
  };
}

export class ConnectBrevoIntegrationUseCase {
  constructor(
    private brevoIntegrationRepository: IBrevoIntegrationRepository,
    private brevoAPIClient: IBrevoAPIClient
  ) {}

  /**
   * Execute use case
   *
   * Validates API key, encrypts it, and stores integration
   */
  async execute(input: ConnectBrevoIntegrationInput): Promise<ConnectBrevoIntegrationResult> {
    // 1. Validate API key by fetching account info from Brevo
    const accountInfo = await this.validateAPIKey(input.apiKey);

    // 2. Encrypt API key (simple base64 for now - TODO: use proper encryption)
    const apiKeyEncrypted = this.encryptAPIKey(input.apiKey);

    // 3. Store integration in database (upsert: create or update)
    const integration = await this.brevoIntegrationRepository.upsert({
      userId: input.userId,
      apiKeyEncrypted,
      accountEmail: accountInfo.email,
      accountName: accountInfo.name,
      companyName: accountInfo.companyName,
    });

    // 4. Return result
    return {
      success: true,
      integration: {
        id: integration.id,
        accountEmail: integration.accountEmail || '',
        accountName: integration.accountName || '',
        companyName: integration.companyName,
        connectedAt: integration.createdAt,
      },
    };
  }

  /**
   * Validate API key by calling Brevo API
   *
   * Throws error if key is invalid
   */
  private async validateAPIKey(apiKey: string): Promise<{
    email: string;
    name: string;
    companyName: string | null;
  }> {
    try {
      // Call Brevo API to get account info
      const accountInfo = await this.brevoAPIClient.getAccountInfo(apiKey);

      return {
        email: accountInfo.email,
        name: accountInfo.firstName && accountInfo.lastName
          ? `${accountInfo.firstName} ${accountInfo.lastName}`
          : accountInfo.email,
        companyName: accountInfo.companyName || null,
      };
    } catch (error: any) {
      // Check if it's an authentication error
      if (error.status === 401 || error.statusCode === 401) {
        throw new Error('Invalid API key. Please check your Brevo API key and try again.');
      }

      throw new Error(`Brevo API error: ${error.message}`);
    }
  }

  /**
   * Encrypt API key
   *
   * TODO: Use proper encryption (AES-256) instead of base64
   * For production, use pgcrypto or application-level encryption
   */
  private encryptAPIKey(apiKey: string): string {
    return Buffer.from(apiKey).toString('base64');
  }
}
