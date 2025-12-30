/**
 * GetPaymentHistoryUseCase
 *
 * Retrieves payment history with filters and pagination.
 * Clean Architecture: Business logic in domain layer, no infrastructure dependencies.
 * SOLID: Single Responsibility - only fetches payment history.
 *
 * Use Case Flow:
 * 1. Validate pagination parameters
 * 2. Apply filters (if any)
 * 3. Fetch from repository using optimized VIEW
 * 4. Return paginated results
 */

import { IInvoiceRepository } from '../repositories/IInvoiceRepository';
import {
  PaymentHistoryFilters,
  PaginationParams,
  PaginatedPaymentHistory,
} from '../types/payments';

export interface GetPaymentHistoryInput {
  filters?: PaymentHistoryFilters;
  pagination?: PaginationParams;
}

export class GetPaymentHistoryUseCase {
  constructor(private invoiceRepository: IInvoiceRepository) {}

  async execute(input: GetPaymentHistoryInput): Promise<PaginatedPaymentHistory> {
    // 1. Validate and set default pagination
    const pagination = this.validatePagination(input.pagination);

    // 2. Validate filters
    const filters = this.validateFilters(input.filters);

    // 3. Fetch from repository
    const result = await this.invoiceRepository.getPaymentHistory(filters, pagination);

    return result;
  }

  /**
   * Validate pagination parameters
   * Returns validated pagination with defaults
   */
  private validatePagination(pagination?: PaginationParams): PaginationParams {
    const defaultPagination = { page: 1, limit: 50 };

    if (!pagination) {
      return defaultPagination;
    }

    // Validate page
    let page = pagination.page;
    if (!page || page < 1) {
      page = 1;
    }

    // Validate limit (max 100 to prevent performance issues)
    let limit = pagination.limit;
    if (!limit || limit < 1) {
      limit = 50;
    }
    if (limit > 100) {
      limit = 100;
    }

    return { page, limit };
  }

  /**
   * Validate filters
   * Returns validated filters (removes invalid values)
   */
  private validateFilters(filters?: PaymentHistoryFilters): PaymentHistoryFilters | undefined {
    if (!filters) {
      return undefined;
    }

    const validatedFilters: PaymentHistoryFilters = {};

    // Customer ID filter
    if (filters.customer_id && filters.customer_id > 0) {
      validatedFilters.customer_id = filters.customer_id;
    }

    // Payment method filter
    if (filters.payment_method) {
      const validMethods = ['bank_transfer', 'paypal', 'cash', 'crypto', 'other'];
      if (validMethods.includes(filters.payment_method)) {
        validatedFilters.payment_method = filters.payment_method;
      }
    }

    // Manually created filter
    if (typeof filters.manually_created === 'boolean') {
      validatedFilters.manually_created = filters.manually_created;
    }

    // Paid filter
    if (typeof filters.paid === 'boolean') {
      validatedFilters.paid = filters.paid;
    }

    // Date range filters
    if (filters.start_date instanceof Date) {
      validatedFilters.start_date = filters.start_date;
    }

    if (filters.end_date instanceof Date) {
      validatedFilters.end_date = filters.end_date;
    }

    // Return undefined if no valid filters
    return Object.keys(validatedFilters).length > 0 ? validatedFilters : undefined;
  }
}
