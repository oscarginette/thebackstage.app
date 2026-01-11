/**
 * GetBrevoIntegrationStatusUseCase
 *
 * Retrieves the current status of a user's Brevo integration including:
 * - Connection status
 * - Account information
 * - Import statistics
 * - Last sync timestamp
 *
 * Clean Architecture:
 * - Business logic: Get integration status
 * - Dependencies: IBrevoIntegrationRepository (DIP)
 * - No infrastructure coupling
 *
 * SOLID:
 * - SRP: Single responsibility (get integration status)
 * - DIP: Depends on interface, not concrete implementation
 */

import {
  IBrevoIntegrationRepository,
  BrevoIntegrationStatus,
} from '@/domain/repositories/IBrevoIntegrationRepository';

export interface GetBrevoIntegrationStatusInput {
  userId: number;
}

export class GetBrevoIntegrationStatusUseCase {
  constructor(private brevoIntegrationRepository: IBrevoIntegrationRepository) {}

  /**
   * Execute use case
   *
   * Fetches integration status including:
   * - Connection status
   * - Account details
   * - Contact statistics
   * - Import history
   */
  async execute(input: GetBrevoIntegrationStatusInput): Promise<BrevoIntegrationStatus> {
    // Delegate to repository (handles complex query with joins)
    return this.brevoIntegrationRepository.getStatus(input.userId);
  }
}
