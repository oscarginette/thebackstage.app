/**
 * CreateManualPaymentUseCase
 *
 * Handles creation of manual payments by admin users.
 * Clean Architecture: Business logic in domain layer, no infrastructure dependencies.
 * SOLID: Single Responsibility - only creates manual payments.
 *
 * Use Case Flow:
 * 1. Validate input (admin permissions, customer exists, amount > 0)
 * 2. Create Invoice entity using factory method
 * 3. Save to database via repository
 * 4. Return result
 */

import { Invoice } from '../entities/Invoice';
import { IInvoiceRepository } from '../repositories/IInvoiceRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { CreateManualPaymentInput } from '../types/payments';

export interface CreateManualPaymentResult {
  success: boolean;
  invoice?: Invoice;
  error?: string;
}

export class CreateManualPaymentUseCase {
  constructor(
    private invoiceRepository: IInvoiceRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(input: CreateManualPaymentInput): Promise<CreateManualPaymentResult> {
    try {
      // 1. Validate input
      const validationError = this.validateInput(input);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // 2. Verify admin user exists and has admin role
      const admin = await this.userRepository.findById(input.created_by_user_id);
      if (!admin) {
        return { success: false, error: 'Admin user not found' };
      }

      if (!admin.isAdmin()) {
        return { success: false, error: 'User does not have admin privileges' };
      }

      // 3. Verify customer exists
      const customer = await this.userRepository.findById(input.customer_id);
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }

      // 4. Create invoice entity using factory method
      const invoice = Invoice.createManual({
        customer_id: input.customer_id,
        amount: input.amount,
        currency: input.currency,
        payment_method: input.payment_method,
        payment_reference: input.payment_reference,
        payment_notes: input.payment_notes,
        description: input.description,
        paid_at: input.paid_at,
        created_by_user_id: input.created_by_user_id,
      });

      // 5. Save to database
      const savedInvoice = await this.invoiceRepository.create(invoice);

      return {
        success: true,
        invoice: savedInvoice,
      };
    } catch (error) {
      console.error('Error creating manual payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Validate input data
   * Returns error message if invalid, null if valid
   */
  private validateInput(input: CreateManualPaymentInput): string | null {
    // Customer ID validation
    if (!input.customer_id || input.customer_id <= 0) {
      return 'Invalid customer_id: must be a positive integer';
    }

    // Amount validation
    if (!input.amount || input.amount <= 0) {
      return 'Invalid amount: must be greater than 0';
    }

    if (input.amount > 1000000) {
      return 'Invalid amount: exceeds maximum allowed (€1,000,000)';
    }

    // Payment method validation
    const validMethods = ['bank_transfer', 'paypal', 'cash', 'crypto', 'other'];
    if (!input.payment_method || !validMethods.includes(input.payment_method)) {
      return `Invalid payment_method: must be one of ${validMethods.join(', ')}`;
    }

    // Admin user validation
    if (!input.created_by_user_id || input.created_by_user_id <= 0) {
      return 'Invalid created_by_user_id: must be a positive integer';
    }

    // Currency validation (if provided)
    if (input.currency && input.currency.length !== 3) {
      return 'Invalid currency: must be 3-letter ISO code';
    }

    // Payment reference validation (optional)
    if (input.payment_reference && input.payment_reference.length > 255) {
      return 'Invalid payment_reference: must not exceed 255 characters';
    }

    // Payment notes validation (optional)
    if (input.payment_notes && input.payment_notes.length > 5000) {
      return 'Invalid payment_notes: must not exceed 5000 characters';
    }

    // Description validation (optional)
    if (input.description && input.description.length > 1000) {
      return 'Invalid description: must not exceed 1000 characters';
    }

    return null;
  }
}
