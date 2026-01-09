/**
 * AddContactsToMultipleListsUseCase
 *
 * Adds contacts to multiple lists simultaneously with validation and multi-tenant isolation.
 * Follows Single Responsibility Principle (SOLID).
 */

import type { IContactListRepository } from '../repositories/IContactListRepository';
import type { IContactRepository } from '../repositories/IContactRepository';

export interface AddContactsToMultipleListsInput {
  userId: number;
  listIds: string[];
  contactIds: number[];
}

export interface ListAddResult {
  listId: string;
  listName: string;
  addedCount: number;
  skippedCount: number;
  success: boolean;
  error?: string;
}

export interface AddContactsToMultipleListsResult {
  success: boolean;
  results: ListAddResult[];
  totalAdded: number;
  totalSkipped: number;
  failedLists: number;
}

export class AddContactsToMultipleListsUseCase {
  constructor(
    private listRepository: IContactListRepository,
    private contactRepository: IContactRepository
  ) {}

  async execute(
    input: AddContactsToMultipleListsInput
  ): Promise<AddContactsToMultipleListsResult> {
    // Validate that contacts belong to the user
    const allContacts = await this.contactRepository.findAll(input.userId);
    const validContactIds = new Set(allContacts.map((c) => c.id));
    const validIds = input.contactIds.filter((id) => validContactIds.has(id));

    if (validIds.length === 0) {
      throw new Error('No valid contacts to add');
    }

    // Process each list
    const results: ListAddResult[] = [];
    let totalAdded = 0;
    let totalSkipped = 0;
    let failedLists = 0;

    for (const listId of input.listIds) {
      try {
        // Validate that the list exists and belongs to the user
        const list = await this.listRepository.findById(listId, input.userId);

        if (!list) {
          results.push({
            listId,
            listName: 'Unknown',
            addedCount: 0,
            skippedCount: validIds.length,
            success: false,
            error: 'List not found or access denied',
          });
          failedLists++;
          continue;
        }

        // Add contacts (repository handles duplicates with ON CONFLICT)
        const addedCount = await this.listRepository.addContacts(
          listId,
          validIds,
          input.userId
        );

        const skippedCount = validIds.length - addedCount;

        results.push({
          listId,
          listName: list.name,
          addedCount,
          skippedCount,
          success: true,
        });

        totalAdded += addedCount;
        totalSkipped += skippedCount;
      } catch (error: any) {
        results.push({
          listId,
          listName: 'Unknown',
          addedCount: 0,
          skippedCount: validIds.length,
          success: false,
          error: error.message || 'Unknown error',
        });
        failedLists++;
      }
    }

    return {
      success: failedLists === 0,
      results,
      totalAdded,
      totalSkipped,
      failedLists,
    };
  }
}
