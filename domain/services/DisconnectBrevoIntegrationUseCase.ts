/**
 * DisconnectBrevoIntegrationUseCase
 *
 * Disconnects a user's Brevo integration by deactivating it.
 * Keeps historical data for audit purposes (soft delete).
 *
 * Business logic:
 * 1. Deactivate integration (set is_active = false)
 * 2. Clear API key (security best practice)
 * 3. Keep account info and import history (audit trail)
 *
 * Clean Architecture:
 * - Business logic: Deactivate integration
 * - Dependencies: IBrevoIntegrationRepository (DIP)
 * - No infrastructure coupling
 *
 * SOLID:
 * - SRP: Single responsibility (disconnect integration)
 * - DIP: Depends on interface, not concrete implementation
 */

import { IBrevoIntegrationRepository } from '@/domain/repositories/IBrevoIntegrationRepository';

export interface DisconnectBrevoIntegrationInput {
  userId: number;
}

export interface DisconnectBrevoIntegrationResult {
  success: boolean;
  message: string;
}

export class DisconnectBrevoIntegrationUseCase {
  constructor(private brevoIntegrationRepository: IBrevoIntegrationRepository) {}

  /**
   * Execute use case
   *
   * Deactivates the Brevo integration for the user
   * Throws error if no integration exists
   */
  async execute(input: DisconnectBrevoIntegrationInput): Promise<DisconnectBrevoIntegrationResult> {
    // Deactivate integration (soft delete)
    const wasDeactivated = await this.brevoIntegrationRepository.deactivate(input.userId);

    if (!wasDeactivated) {
      throw new Error('No Brevo integration found');
    }

    return {
      success: true,
      message: 'Brevo integration disconnected successfully',
    };
  }
}
