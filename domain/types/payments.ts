/**
 * Payment System Types
 *
 * Clean Architecture: Domain types with no external dependencies.
 * Defines payment methods, invoice interfaces, and payment history structures.
 */

/**
 * Supported payment methods for manual payments
 */
export type PaymentMethod = 'bank_transfer' | 'paypal' | 'cash' | 'crypto' | 'other';

/**
 * Invoice with payment tracking fields
 * Extends Stripe invoice model with manual payment support
 */
export interface PaymentInvoice {
  id: string;
  object: string;
  customer_id: number;
  subscription_id: string | null;

  // Amounts (in cents)
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  subtotal: number;
  total: number;
  tax: number;

  // Currency
  currency: string;

  // Status
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  billing_reason: string | null;

  // Dates
  created: Date;
  period_start: Date | null;
  period_end: Date | null;
  due_date: Date | null;

  // Payment
  paid: boolean;
  paid_at: Date | null;
  payment_intent_id: string | null;

  // Manual payment tracking
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  payment_notes: string | null;
  manually_created: boolean;
  created_by_user_id: number | null;

  // Metadata
  metadata: Record<string, any>;
  description: string | null;

  // PDF
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;

  // Internal
  livemode: boolean;
}

/**
 * Input for creating a manual payment
 */
export interface CreateManualPaymentInput {
  customer_id: number;
  amount: number; // Amount in EUR (will be converted to cents)
  currency?: string; // Default: 'eur'
  payment_method: PaymentMethod;
  payment_reference?: string;
  payment_notes?: string;
  description?: string;
  paid_at?: Date; // Default: now
  created_by_user_id: number; // Admin who created the payment
}

/**
 * Payment history entry (from VIEW)
 * Denormalized data for efficient dashboard queries
 */
export interface PaymentHistoryEntry {
  id: string;
  customer_id: number;
  customer_email: string;
  customer_name: string | null;

  amount_due: number;
  amount_paid: number;
  currency: string;

  status: string;
  paid: boolean;
  paid_at: Date | null;

  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  payment_notes: string | null;

  manually_created: boolean;
  created_by_user_id: number | null;
  created_by_admin_email: string | null;
  created_by_admin_name: string | null;

  billing_reason: string | null;
  subscription_id: string | null;

  created: Date;
  period_start: Date | null;
  period_end: Date | null;
  description: string | null;
}

/**
 * Filters for payment history queries
 */
export interface PaymentHistoryFilters {
  customer_id?: number;
  payment_method?: PaymentMethod;
  manually_created?: boolean;
  paid?: boolean;
  start_date?: Date;
  end_date?: Date;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated payment history response
 */
export interface PaginatedPaymentHistory {
  data: PaymentHistoryEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
