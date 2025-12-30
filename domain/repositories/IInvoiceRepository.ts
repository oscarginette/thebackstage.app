/**
 * Invoice Repository Interface
 *
 * Clean Architecture: Domain interface with no implementation details.
 * SOLID: Dependency Inversion - domain depends on interface, not concrete implementation.
 *
 * Use Cases depend on this interface, PostgresInvoiceRepository implements it.
 */

import { Invoice } from '../entities/Invoice';
import {
  PaymentHistoryEntry,
  PaymentHistoryFilters,
  PaginationParams,
  PaginatedPaymentHistory,
} from '../types/payments';

export interface IInvoiceRepository {
  /**
   * Create a new invoice
   * @param invoice - Invoice entity to create
   * @returns Created invoice with database ID
   */
  create(invoice: Invoice): Promise<Invoice>;

  /**
   * Find invoice by ID
   * @param id - Invoice ID
   * @returns Invoice or null if not found
   */
  findById(id: string): Promise<Invoice | null>;

  /**
   * Find all invoices for a customer
   * @param customerId - User ID
   * @returns Array of invoices
   */
  findByCustomerId(customerId: number): Promise<Invoice[]>;

  /**
   * Find all invoices for a subscription
   * @param subscriptionId - Subscription ID
   * @returns Array of invoices
   */
  findBySubscriptionId(subscriptionId: string): Promise<Invoice[]>;

  /**
   * Update invoice status
   * @param id - Invoice ID
   * @param status - New status
   * @returns Updated invoice
   */
  updateStatus(id: string, status: string): Promise<Invoice>;

  /**
   * Mark invoice as paid
   * @param id - Invoice ID
   * @param paidAt - Payment timestamp
   * @returns Updated invoice
   */
  markAsPaid(id: string, paidAt: Date): Promise<Invoice>;

  /**
   * Get payment history with filters and pagination
   * Used by admin dashboard
   * @param filters - Optional filters
   * @param pagination - Page and limit
   * @returns Paginated payment history
   */
  getPaymentHistory(
    filters?: PaymentHistoryFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedPaymentHistory>;

  /**
   * Get total revenue (sum of all paid invoices)
   * @param customerId - Optional customer filter
   * @returns Total revenue in cents
   */
  getTotalRevenue(customerId?: number): Promise<number>;

  /**
   * Delete invoice (for testing only)
   * @param id - Invoice ID
   */
  delete(id: string): Promise<void>;
}
