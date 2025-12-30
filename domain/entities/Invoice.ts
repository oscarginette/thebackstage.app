/**
 * Invoice Entity
 *
 * Represents a payment invoice (Stripe-compatible + manual payment support).
 * Clean Architecture: Domain entity with validation and business logic.
 * SOLID: Single Responsibility - Invoice data and validation only.
 *
 * Immutability: Uses Object.freeze() to prevent modification after creation.
 */

import { PaymentMethod } from '../types/payments';

export interface InvoiceProps {
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

export class Invoice {
  private readonly props: InvoiceProps;

  private constructor(props: InvoiceProps) {
    this.props = props;
    this.validate();
    Object.freeze(this);
  }

  private validate(): void {
    // ID validation
    if (!this.props.id || typeof this.props.id !== 'string') {
      throw new Error('Invalid invoice ID: must be a non-empty string');
    }

    // Customer validation
    if (!this.props.customer_id || this.props.customer_id <= 0) {
      throw new Error('Invalid customer_id: must be a positive integer');
    }

    // Amount validation
    if (this.props.amount_due < 0) {
      throw new Error('Invalid amount_due: must be non-negative');
    }

    if (this.props.total < 0) {
      throw new Error('Invalid total: must be non-negative');
    }

    // Currency validation
    if (!this.props.currency || this.props.currency.length !== 3) {
      throw new Error('Invalid currency: must be 3-letter ISO code');
    }

    // Status validation
    const validStatuses = ['draft', 'open', 'paid', 'void', 'uncollectible'];
    if (!validStatuses.includes(this.props.status)) {
      throw new Error(`Invalid status: must be one of ${validStatuses.join(', ')}`);
    }

    // Payment method validation
    if (this.props.payment_method) {
      const validMethods: PaymentMethod[] = ['bank_transfer', 'paypal', 'cash', 'crypto', 'other'];
      if (!validMethods.includes(this.props.payment_method)) {
        throw new Error(`Invalid payment_method: must be one of ${validMethods.join(', ')}`);
      }
    }

    // Manual payment validation
    if (this.props.manually_created && !this.props.created_by_user_id) {
      throw new Error('Manual invoices must have created_by_user_id');
    }

    // Paid invoice validation
    if (this.props.paid && !this.props.paid_at) {
      throw new Error('Paid invoices must have paid_at timestamp');
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get customer_id(): number {
    return this.props.customer_id;
  }

  get subscription_id(): string | null {
    return this.props.subscription_id;
  }

  get amount_due(): number {
    return this.props.amount_due;
  }

  get total(): number {
    return this.props.total;
  }

  get currency(): string {
    return this.props.currency;
  }

  get status(): string {
    return this.props.status;
  }

  get paid(): boolean {
    return this.props.paid;
  }

  get paid_at(): Date | null {
    return this.props.paid_at;
  }

  get payment_method(): PaymentMethod | null {
    return this.props.payment_method;
  }

  get manually_created(): boolean {
    return this.props.manually_created;
  }

  get created(): Date {
    return this.props.created;
  }

  // Business logic methods

  /**
   * Check if invoice is paid
   */
  isPaid(): boolean {
    return this.props.paid && this.props.status === 'paid';
  }

  /**
   * Check if invoice is overdue
   */
  isOverdue(): boolean {
    if (this.props.paid) return false;
    if (!this.props.due_date) return false;
    return new Date() > this.props.due_date;
  }

  /**
   * Get amount in EUR (converted from cents)
   */
  getAmountInEur(): number {
    return this.props.amount_due / 100;
  }

  /**
   * Get total in EUR (converted from cents)
   */
  getTotalInEur(): number {
    return this.props.total / 100;
  }

  /**
   * Check if this is a manual payment
   */
  isManualPayment(): boolean {
    return this.props.manually_created;
  }

  /**
   * Return invoice data as plain object
   */
  toObject(): InvoiceProps {
    return { ...this.props };
  }

  /**
   * Return public invoice data (safe for API responses)
   */
  toPublic(): Omit<InvoiceProps, 'livemode'> {
    const { livemode, ...publicData } = this.props;
    return publicData;
  }

  // Static factory methods

  /**
   * Create Invoice from database row
   */
  static fromDatabase(row: any): Invoice {
    return new Invoice({
      id: row.id,
      object: row.object || 'invoice',
      customer_id: row.customer_id,
      subscription_id: row.subscription_id,
      amount_due: row.amount_due,
      amount_paid: row.amount_paid || 0,
      amount_remaining: row.amount_remaining || 0,
      subtotal: row.subtotal,
      total: row.total,
      tax: row.tax || 0,
      currency: row.currency,
      status: row.status,
      billing_reason: row.billing_reason,
      created: new Date(row.created),
      period_start: row.period_start ? new Date(row.period_start) : null,
      period_end: row.period_end ? new Date(row.period_end) : null,
      due_date: row.due_date ? new Date(row.due_date) : null,
      paid: row.paid || false,
      paid_at: row.paid_at ? new Date(row.paid_at) : null,
      payment_intent_id: row.payment_intent_id,
      payment_method: row.payment_method,
      payment_reference: row.payment_reference,
      payment_notes: row.payment_notes,
      manually_created: row.manually_created || false,
      created_by_user_id: row.created_by_user_id,
      metadata: row.metadata || {},
      description: row.description,
      invoice_pdf: row.invoice_pdf,
      hosted_invoice_url: row.hosted_invoice_url,
      livemode: row.livemode || false,
    });
  }

  /**
   * Create manual invoice (for admin-created payments)
   * Factory method for clean invoice creation
   */
  static createManual(params: {
    customer_id: number;
    amount: number; // Amount in EUR
    currency?: string;
    payment_method: PaymentMethod;
    payment_reference?: string;
    payment_notes?: string;
    description?: string;
    paid_at?: Date;
    created_by_user_id: number;
  }): Invoice {
    const now = new Date();
    const amountInCents = Math.round(params.amount * 100);

    // Generate invoice ID (format: in_manual_TIMESTAMP)
    const id = `in_manual_${Date.now()}`;

    return new Invoice({
      id,
      object: 'invoice',
      customer_id: params.customer_id,
      subscription_id: null,

      // Amounts in cents
      amount_due: amountInCents,
      amount_paid: amountInCents, // Manual payments are immediately paid
      amount_remaining: 0,
      subtotal: amountInCents,
      total: amountInCents,
      tax: 0,

      currency: params.currency || 'eur',

      status: 'paid',
      billing_reason: 'manual',

      created: now,
      period_start: now,
      period_end: now,
      due_date: now,

      paid: true,
      paid_at: params.paid_at || now,
      payment_intent_id: null,

      // Manual payment tracking
      payment_method: params.payment_method,
      payment_reference: params.payment_reference || null,
      payment_notes: params.payment_notes || null,
      manually_created: true,
      created_by_user_id: params.created_by_user_id,

      metadata: { source: 'admin_manual_payment' },
      description: params.description || null,

      invoice_pdf: null,
      hosted_invoice_url: null,

      livemode: false,
    });
  }
}
