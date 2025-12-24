import { IContactRepository, Contact, ContactStats } from '../repositories/IContactRepository';

export interface GetContactsWithStatsResult {
  contacts: Contact[];
  stats: ContactStats;
}

/**
 * GetContactsWithStatsUseCase
 *
 * Retrieves all contacts with aggregated statistics.
 * Follows Clean Architecture and SOLID principles.
 *
 * SRP: Only responsible for fetching contacts and their statistics
 * DIP: Depends on IContactRepository interface, not concrete implementation
 */
export class GetContactsWithStatsUseCase {
  constructor(private contactRepository: IContactRepository) {}

  /**
   * Executes the use case to retrieve contacts and statistics for a specific user
   *
   * @param userId - The ID of the user whose contacts to retrieve
   * @returns Promise with contacts array and aggregated stats
   */
  async execute(userId: number): Promise<GetContactsWithStatsResult> {
    const [contacts, stats] = await Promise.all([
      this.contactRepository.findAll(userId),
      this.contactRepository.getStats(userId)
    ]);

    return {
      contacts,
      stats
    };
  }
}
