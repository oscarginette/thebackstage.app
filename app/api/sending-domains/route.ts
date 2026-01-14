/**
 * GET/POST /api/sending-domains
 *
 * Manages user's sending domains for custom email sending.
 * Clean Architecture: Only HTTP orchestration, no business logic.
 *
 * USAGE:
 * - GET: List all domains for authenticated user
 * - POST: Add new domain and get DNS configuration
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sending-domains
 * List user's sending domains
 *
 * Returns all domains with their verification status and DNS records.
 *
 * Response:
 * {
 *   domains: [
 *     {
 *       id: 1,
 *       domain: "geebeat.com",
 *       status: "verified",
 *       dnsRecords: {...},
 *       ...
 *     }
 *   ]
 * }
 */
export async function GET() {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Execute Use Case (business logic)
    const useCase = UseCaseFactory.createGetUserSendingDomainsUseCase();
    const domains = await useCase.execute(Number(session.user.id));

    return NextResponse.json({
      domains: domains.map(d => d.toJSON())
    });
  } catch (error) {
    console.error('[GET /api/sending-domains] Error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sending-domains
 * Add new sending domain
 *
 * Creates domain in Mailgun, generates DNS records, and stores in database.
 *
 * Request Body:
 * {
 *   domain: "geebeat.com"
 * }
 *
 * Response (success):
 * {
 *   domain: { id: 1, domain: "geebeat.com", status: "dns_configured", ... },
 *   dnsRecords: {
 *     spf: { type: "TXT", name: "@", value: "v=spf1 ..." },
 *     dkim: { type: "TXT", name: "k1._domainkey", value: "..." },
 *     dmarc: { type: "TXT", name: "_dmarc", value: "..." }
 *   }
 * }
 *
 * Response (error):
 * {
 *   error: "Domain already registered" | "Invalid domain format" | ...
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();

    // DEBUG: Log session info
    console.log('[POST /api/sending-domains] Session debug:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', debug: { hasSession: !!session, hasUser: !!session?.user } },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const { domain } = body;

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Domain is required and must be a string' },
        { status: 400 }
      );
    }

    // Normalize domain (lowercase, trim)
    const normalizedDomain = domain.toLowerCase().trim();

    // Execute Use Case (business logic)
    const useCase = UseCaseFactory.createAddSendingDomainUseCase();
    const result = await useCase.execute({
      userId: Number(session.user.id),
      domain: normalizedDomain,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      domain: result.domain!.toJSON(),
      dnsRecords: result.dnsRecords,
    });
  } catch (error) {
    console.error('[POST /api/sending-domains] FATAL ERROR - Full details:');
    console.error('[POST /api/sending-domains] Error type:', error?.constructor?.name);
    console.error('[POST /api/sending-domains] Error instanceof Error:', error instanceof Error);

    if (error instanceof Error) {
      console.error('[POST /api/sending-domains] Error message:', error.message);
      console.error('[POST /api/sending-domains] Error stack:', error.stack);
      console.error('[POST /api/sending-domains] Error name:', error.name);
    }

    console.error('[POST /api/sending-domains] Error as object:', {
      error,
      errorString: String(error),
      errorKeys: Object.keys(error || {}),
    });

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
          debug: {
            name: error.name,
            stack: error.stack?.split('\n').slice(0, 5), // First 5 lines of stack
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', debug: { errorType: typeof error } },
      { status: 500 }
    );
  }
}
