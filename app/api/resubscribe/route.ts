import { NextResponse } from 'next/server';
import { ResubscribeUseCase } from '@/domain/services/ResubscribeUseCase';
import { PostgresContactRepository } from '@/infrastructure/database/repositories/PostgresContactRepository';
import { PostgresConsentHistoryRepository } from '@/infrastructure/database/repositories/PostgresConsentHistoryRepository';

export const dynamic = 'force-dynamic';

/**
 * Resubscribe Endpoint (Clean Architecture)
 *
 * Allows users to re-subscribe after unsubscribing
 * Accepts both GET and POST
 * Query params: ?token=xxx
 *
 * Features:
 * - Token validation
 * - Idempotent (can call multiple times)
 * - GDPR audit trail logging
 * - IP and User-Agent tracking
 */
export async function GET(request: Request) {
  return handleResubscribe(request);
}

export async function POST(request: Request) {
  return handleResubscribe(request);
}

async function handleResubscribe(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      );
    }

    // Extract IP and User-Agent for audit trail
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      null;
    const userAgent = request.headers.get('user-agent') || null;

    // Dependency injection
    const contactRepository = new PostgresContactRepository();
    const consentHistoryRepository = new PostgresConsentHistoryRepository();

    // Execute use case
    const useCase = new ResubscribeUseCase(
      contactRepository,
      consentHistoryRepository
    );

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
      message: result.alreadySubscribed
        ? 'Already subscribed'
        : 'Successfully re-subscribed',
      email: result.email
    });

  } catch (error: any) {
    console.error('Error in resubscribe:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
