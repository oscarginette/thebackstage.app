/**
 * DeleteContactsUseCase
 *
 * Handles bulk deletion of contacts by IDs.
 * Clean Architecture: Business logic in domain layer.
 * SOLID: Single Responsibility (only handles contact deletion orchestration),
 *        Dependency Inversion (depends on IContactRepository interface).
 */

import { IContactRepository } from '../repositories/IContactRepository';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface DeleteContactsInput {
  ids: number[];
  userId: number;
}

export interface DeleteContactsResult {
  success: boolean;
  deleted: number;
  error?: string;
}

export class DeleteContactsUseCase {
  constructor(private readonly contactRepository: IContactRepository) {}

  async execute(input: DeleteContactsInput): Promise<DeleteContactsResult> {
    // 1. Validate input
    this.validateInput(input);

    // 2. Delete contacts via repository (with user isolation)
    const deleted = await this.contactRepository.delete(input.ids, input.userId);

    // 3. Return result
    return {
      success: true,
      deleted,
    };
  }

  /**
   * Validate deletion input
   * Business rule: IDs array must not be empty and all IDs must be positive integers
   */
  private validateInput(input: DeleteContactsInput): void {
    if (!input.ids || !Array.isArray(input.ids)) {
      throw new ValidationError('IDs must be an array');
    }

    if (input.ids.length === 0) {
      throw new ValidationError('IDs array cannot be empty');
    }

    // Validate each ID is a positive integer
    for (const id of input.ids) {
      if (!Number.isInteger(id) || id <= 0) {
        throw new ValidationError(
          `All IDs must be positive integers (invalid ID: ${id})`
        );
      }
    }
  }
}
