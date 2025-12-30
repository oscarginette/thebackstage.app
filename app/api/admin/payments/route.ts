/**
 * Admin Payments API Route
 *
 * POST /api/admin/payments - Create manual payment
 * GET /api/admin/payments - Fetch payment history with filters
 *
 * Clean Architecture: API route -> Use Case -> Repository
 * SOLID: Only orchestration, no business logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CreateManualPaymentUseCase } from '@/domain/services/CreateManualPaymentUseCase';
import { GetPaymentHistoryUseCase } from '@/domain/services/GetPaymentHistoryUseCase';
import { PostgresInvoiceRepository } from '@/infrastructure/database/repositories/PostgresInvoiceRepository';
import { PostgresUserRepository } from '@/infrastructure/database/repositories/PostgresUserRepository';
import { PaymentMethod } from '@/domain/types/payments';

/**
 * POST - Create manual payment
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // 2. Check admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await request.json();

    // 4. Validate required fields
    if (!body.customer_id || !body.amount || !body.payment_method) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_id, amount, payment_method' },
        { status: 400 }
      );
    }

    // 5. Initialize repositories
    const invoiceRepository = new PostgresInvoiceRepository();
    const userRepository = new PostgresUserRepository();

    // 6. Execute use case
    const useCase = new CreateManualPaymentUseCase(invoiceRepository, userRepository);
    const result = await useCase.execute({
      customer_id: parseInt(body.customer_id),
      amount: parseFloat(body.amount),
      currency: body.currency,
      payment_method: body.payment_method as PaymentMethod,
      payment_reference: body.payment_reference,
      payment_notes: body.payment_notes,
      description: body.description,
      paid_at: body.paid_at ? new Date(body.paid_at) : undefined,
      created_by_user_id: session.user.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // 7. Return success response
    return NextResponse.json(
      {
        success: true,
        invoice: result.invoice?.toPublic(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create manual payment API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch payment history with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // 2. Check admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      );
    }

    // 3. Parse query parameters
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Filters
    const customer_id = searchParams.get('customer_id')
      ? parseInt(searchParams.get('customer_id')!)
      : undefined;
    const payment_method = searchParams.get('payment_method') as PaymentMethod | undefined;
    const manually_created = searchParams.get('manually_created')
      ? searchParams.get('manually_created') === 'true'
      : undefined;
    const paid = searchParams.get('paid')
      ? searchParams.get('paid') === 'true'
      : undefined;
    const start_date = searchParams.get('start_date')
      ? new Date(searchParams.get('start_date')!)
      : undefined;
    const end_date = searchParams.get('end_date')
      ? new Date(searchParams.get('end_date')!)
      : undefined;

    // 4. Initialize repository
    const invoiceRepository = new PostgresInvoiceRepository();

    // 5. Execute use case
    const useCase = new GetPaymentHistoryUseCase(invoiceRepository);
    const result = await useCase.execute({
      filters: {
        customer_id,
        payment_method,
        manually_created,
        paid,
        start_date,
        end_date,
      },
      pagination: {
        page,
        limit,
      },
    });

    // 6. Return success response
    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get payment history API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
