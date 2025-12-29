/**
 * Signup API Route
 *
 * Handles user registration for multi-tenant email system.
 * Clean Architecture: API route only orchestrates, business logic in UseCase.
 *
 * Flow:
 * 1. Parse request body
 * 2. Call CreateUserUseCase
 * 3. Return result (success or error)
 *
 * SOLID Compliance:
 * - SRP: This route only handles HTTP orchestration
 * - DIP: Depends on interfaces (IUserRepository)
 * - No business logic here (all in CreateUserUseCase)
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreateUserUseCase } from '@/domain/services/CreateUserUseCase';
import { SendNewUserNotificationUseCase } from '@/domain/services/SendNewUserNotificationUseCase';
import { PostgresUserRepository } from '@/infrastructure/database/repositories/PostgresUserRepository';
import { PostgresQuotaTrackingRepository } from '@/infrastructure/database/repositories/PostgresQuotaTrackingRepository';
import { ResendEmailProvider } from '@/infrastructure/email/ResendEmailProvider';
import { env, getAppUrl, getBaseUrl } from '@/lib/env';

// Instantiate repositories
const userRepository = new PostgresUserRepository();
const quotaRepository = new PostgresQuotaTrackingRepository();

// Instantiate email provider (lazy initialization to avoid errors if RESEND_API_KEY not set)
let emailProvider: ResendEmailProvider | null = null;
function getEmailProvider(): ResendEmailProvider | null {
  if (!emailProvider && env.RESEND_API_KEY) {
    emailProvider = new ResendEmailProvider(env.RESEND_API_KEY);
  }
  return emailProvider;
}

/**
 * POST /api/auth/signup
 *
 * Create new user account
 *
 * Request Body:
 * {
 *   email: string,
 *   password: string,
 *   passwordConfirm?: string
 * }
 *
 * Response (Success):
 * {
 *   success: true,
 *   user: { id, email, createdAt }
 * }
 *
 * Response (Error):
 * {
 *   success: false,
 *   error: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body
    if (!body.email || !body.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    // Create use case instance
    const createUserUseCase = new CreateUserUseCase(
      userRepository,
      quotaRepository
    );

    // Execute use case
    const result = await createUserUseCase.execute({
      email: body.email,
      password: body.password,
      passwordConfirm: body.passwordConfirm,
    });

    // Handle result
    if (!result.success) {
      // Determine appropriate HTTP status code
      let statusCode = 400;
      if (result.error?.includes('already registered')) {
        statusCode = 409; // Conflict
      }

      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: statusCode }
      );
    }

    // Send admin notification (fire-and-forget, non-blocking)
    if (result.user && getEmailProvider()) {
      const notificationUseCase = new SendNewUserNotificationUseCase(
        userRepository,
        getEmailProvider()!
      );

      // Fire and forget - don't await, don't block signup response
      notificationUseCase
        .execute({ userId: result.user.id })
        .catch((error) => {
          console.error('[Signup] Failed to send admin notification:', error);
        });
    }

    // Success
    return NextResponse.json(
      {
        success: true,
        user: result.user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
