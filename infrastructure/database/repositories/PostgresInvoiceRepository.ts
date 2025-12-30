/**
 * PostgresInvoiceRepository
 *
 * PostgreSQL implementation of IInvoiceRepository.
 * Clean Architecture: Infrastructure layer, implements domain interface.
 * SOLID: Dependency Inversion - implements interface defined in domain.
 *
 * Uses Vercel Postgres (@vercel/postgres) for database access.
 */

import { db } from '@/lib/db-config';
import { Invoice } from '@/domain/entities/Invoice';
import { IInvoiceRepository } from '@/domain/repositories/IInvoiceRepository';
import {
  PaymentHistoryEntry,
  PaymentHistoryFilters,
  PaginationParams,
  PaginatedPaymentHistory,
} from '@/domain/types/payments';

export class PostgresInvoiceRepository implements IInvoiceRepository {
  /**
   * Create a new invoice
   */
  async create(invoice: Invoice): Promise<Invoice> {
    const props = invoice.toObject();

    const result = await db`
      INSERT INTO invoices (
        id, object, customer_id, subscription_id,
        amount_due, amount_paid, amount_remaining,
        subtotal, total, tax, currency,
        status, billing_reason,
        created, period_start, period_end, due_date,
        paid, paid_at, payment_intent_id,
        payment_method, payment_reference, payment_notes,
        manually_created, created_by_user_id,
        metadata, description,
        invoice_pdf, hosted_invoice_url, livemode
      ) VALUES (
        ${props.id}, ${props.object}, ${props.customer_id}, ${props.subscription_id},
        ${props.amount_due}, ${props.amount_paid}, ${props.amount_remaining},
        ${props.subtotal}, ${props.total}, ${props.tax}, ${props.currency},
        ${props.status}, ${props.billing_reason},
        ${props.created}, ${props.period_start}, ${props.period_end}, ${props.due_date},
        ${props.paid}, ${props.paid_at}, ${props.payment_intent_id},
        ${props.payment_method}, ${props.payment_reference}, ${props.payment_notes},
        ${props.manually_created}, ${props.created_by_user_id},
        ${JSON.stringify(props.metadata)}, ${props.description},
        ${props.invoice_pdf}, ${props.hosted_invoice_url}, ${props.livemode}
      )
      RETURNING *
    `;

    return Invoice.fromDatabase(result[0]);
  }

  /**
   * Find invoice by ID
   */
  async findById(id: string): Promise<Invoice | null> {
    const result = await db`
      SELECT * FROM invoices WHERE id = ${id}
    `;

    if (result.length === 0) {
      return null;
    }

    return Invoice.fromDatabase(result[0]);
  }

  /**
   * Find all invoices for a customer
   */
  async findByCustomerId(customerId: number): Promise<Invoice[]> {
    const result = await db`
      SELECT * FROM invoices
      WHERE customer_id = ${customerId}
      ORDER BY created DESC
    `;

    return result.map((row: any) => Invoice.fromDatabase(row));
  }

  /**
   * Find all invoices for a subscription
   */
  async findBySubscriptionId(subscriptionId: string): Promise<Invoice[]> {
    const result = await db`
      SELECT * FROM invoices
      WHERE subscription_id = ${subscriptionId}
      ORDER BY created DESC
    `;

    return result.map((row: any) => Invoice.fromDatabase(row));
  }

  /**
   * Update invoice status
   */
  async updateStatus(id: string, status: string): Promise<Invoice> {
    const result = await db`
      UPDATE invoices
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error(`Invoice ${id} not found`);
    }

    return Invoice.fromDatabase(result[0]);
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(id: string, paidAt: Date): Promise<Invoice> {
    const result = await db`
      UPDATE invoices
      SET
        paid = true,
        paid_at = ${paidAt},
        status = 'paid',
        amount_paid = amount_due,
        amount_remaining = 0
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error(`Invoice ${id} not found`);
    }

    return Invoice.fromDatabase(result[0]);
  }

  /**
   * Get payment history with filters and pagination
   * Uses optimized payment_history_overview VIEW
   */
  async getPaymentHistory(
    filters?: PaymentHistoryFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedPaymentHistory> {
    // Default pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const offset = (page - 1) * limit;

    // Build WHERE clause dynamically based on filters
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.customer_id) {
      conditions.push(`customer_id = $${params.length + 1}`);
      params.push(filters.customer_id);
    }

    if (filters?.payment_method) {
      conditions.push(`payment_method = $${params.length + 1}`);
      params.push(filters.payment_method);
    }

    if (typeof filters?.manually_created === 'boolean') {
      conditions.push(`manually_created = $${params.length + 1}`);
      params.push(filters.manually_created);
    }

    if (typeof filters?.paid === 'boolean') {
      conditions.push(`paid = $${params.length + 1}`);
      params.push(filters.paid);
    }

    if (filters?.start_date) {
      conditions.push(`created >= $${params.length + 1}`);
      params.push(filters.start_date);
    }

    if (filters?.end_date) {
      conditions.push(`created <= $${params.length + 1}`);
      params.push(filters.end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM payment_history_overview
      ${whereClause}
    `;

    const countResult = await db.unsafe(countQuery, params);
    const total = parseInt(countResult[0].total, 10);
    const totalPages = Math.ceil(total / limit);

    // Get paginated data
    const dataQuery = `
      SELECT *
      FROM payment_history_overview
      ${whereClause}
      ORDER BY created DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;

    const dataResult = await db.unsafe(dataQuery, [...params, limit, offset]);

    // Map results to PaymentHistoryEntry type
    const data: PaymentHistoryEntry[] = dataResult.map((row: any) => ({
      id: row.id,
      customer_id: row.customer_id,
      customer_email: row.customer_email,
      customer_name: row.customer_name,
      amount_due: row.amount_due,
      amount_paid: row.amount_paid,
      currency: row.currency,
      status: row.status,
      paid: row.paid,
      paid_at: row.paid_at ? new Date(row.paid_at) : null,
      payment_method: row.payment_method,
      payment_reference: row.payment_reference,
      payment_notes: row.payment_notes,
      manually_created: row.manually_created,
      created_by_user_id: row.created_by_user_id,
      created_by_admin_email: row.created_by_admin_email,
      created_by_admin_name: row.created_by_admin_name,
      billing_reason: row.billing_reason,
      subscription_id: row.subscription_id,
      created: new Date(row.created),
      period_start: row.period_start ? new Date(row.period_start) : null,
      period_end: row.period_end ? new Date(row.period_end) : null,
      description: row.description,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get total revenue (sum of all paid invoices)
   */
  async getTotalRevenue(customerId?: number): Promise<number> {
    if (customerId) {
      const result = await db`
        SELECT COALESCE(SUM(amount_paid), 0) as total
        FROM invoices
        WHERE paid = true AND customer_id = ${customerId}
      `;
      return parseInt(result[0].total, 10);
    }

    const result = await db`
      SELECT COALESCE(SUM(amount_paid), 0) as total
      FROM invoices
      WHERE paid = true
    `;

    return parseInt(result[0].total, 10);
  }

  /**
   * Delete invoice (for testing only)
   */
  async delete(id: string): Promise<void> {
    await db`
      DELETE FROM invoices WHERE id = ${id}
    `;
  }
}
