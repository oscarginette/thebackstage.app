import { NextResponse } from 'next/server';
import { UseCaseFactory } from '@/lib/di-container';

export const dynamic = 'force-dynamic';

/**
 * Unsubscribe Endpoint (Clean Architecture)
 *
 * Acepta tanto GET como POST (CAN-SPAM compliant 1-click unsubscribe)
 * Query params: ?token=xxx
 *
 * Features:
 * - Token validation
 * - Idempotent (can call multiple times)
 * - GDPR audit trail logging
 * - IP and User-Agent tracking
 */
export async function GET(request: Request) {
  return handleUnsubscribe(request);
}

export async function POST(request: Request) {
  return handleUnsubscribe(request);
}

async function handleUnsubscribe(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing unsubscribe token' },
        { status: 400 }
      );
    }

    // Extract IP and User-Agent for audit trail
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      null;
    const userAgent = request.headers.get('user-agent') || null;

    // Get use case from factory (DI)
    const useCase = UseCaseFactory.createUnsubscribeUseCase();

    const result = await useCase.execute({
      token,
      ipAddress,
      userAgent
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: result.alreadyUnsubscribed
        ? 'Already unsubscribed'
        : 'Successfully unsubscribed',
      email: result.email
    });

  } catch (error: unknown) {
    console.error('Error in unsubscribe:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
