/**
 * NavigateToListCreationUseCase
 *
 * Handles navigation to the list creation interface when user needs to create
 * a contact list from within the email editor context.
 *
 * Clean Architecture: This use case encapsulates the business logic for
 * transitioning from email editing to list creation workflow.
 */

export interface INavigationService {
  navigateToTab(tab: string, subTab?: string): void;
}

export interface IModalService {
  closeModal(): void;
}

export interface NavigateToListCreationInput {
  onModalClose: () => void;
  onNavigate: (tab: string, subTab: string) => void;
}

export interface NavigateToListCreationResult {
  success: boolean;
}

export class NavigateToListCreationUseCase {
  /**
   * Execute navigation to list creation.
   *
   * This use case follows Single Responsibility Principle:
   * - Only handles the workflow of navigating from email editor to list creation
   * - Delegates modal closing to caller
   * - Delegates navigation to caller
   *
   * @param input - Modal close and navigation callbacks
   * @returns Result indicating success
   */
  execute(input: NavigateToListCreationInput): NavigateToListCreationResult {
    this.validateInput(input);

    // Step 1: Close the current modal (email editor)
    input.onModalClose();

    // Step 2: Navigate to Audience tab > Lists sub-tab
    input.onNavigate('audience', 'lists');

    return { success: true };
  }

  private validateInput(input: NavigateToListCreationInput): void {
    if (!input.onModalClose || typeof input.onModalClose !== 'function') {
      throw new Error('onModalClose callback is required');
    }

    if (!input.onNavigate || typeof input.onNavigate !== 'function') {
      throw new Error('onNavigate callback is required');
    }
  }
}
