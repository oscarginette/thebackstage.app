/**
 * POST /api/demo-sends/[sendId]/track
 * Webhook for tracking demo email events (open/click)
 *
 * This is a PUBLIC endpoint - no authentication required.
 * Called by email provider (Resend, Mailgun, etc) to track events.
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextRequest, NextResponse } from 'next/server';
import { TrackDemoOpenUseCase } from '@/domain/services/TrackDemoOpenUseCase';
import { TrackDemoClickUseCase } from '@/domain/services/TrackDemoClickUseCase';
import { demoSendRepository } from '@/infrastructure/database/repositories';
import { TrackDemoEventSchema } from '@/lib/validation-schemas';

/**
 * POST /api/demo-sends/[sendId]/track
 * Tracks email events (open/click) for demo sends
 *
 * NO AUTHENTICATION - Public webhook endpoint
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sendId: string }> }
) {
  try {
    const { sendId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validation = TrackDemoEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { event, timestamp } = validation.data;

    // Execute appropriate use case based on event type
    if (event === 'open') {
      const useCase = new TrackDemoOpenUseCase(demoSendRepository);
      const result = await useCase.execute({
        sendId,
        openedAt: timestamp ? new Date(timestamp) : new Date(),
      });

      if (!result.success) {
        // Still return 200 OK for idempotency (already tracked)
        return NextResponse.json({ message: 'Event already tracked' });
      }

      return NextResponse.json({ message: 'Open event tracked successfully' });
    } else if (event === 'click') {
      const useCase = new TrackDemoClickUseCase(demoSendRepository);
      const result = await useCase.execute({
        sendId,
        clickedAt: timestamp ? new Date(timestamp) : new Date(),
      });

      if (!result.success) {
        // Still return 200 OK for idempotency (already tracked)
        return NextResponse.json({ message: 'Event already tracked' });
      }

      return NextResponse.json({ message: 'Click event tracked successfully' });
    }

    return NextResponse.json(
      { error: 'Unknown event type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error tracking demo event:', error);
    // Return 200 OK even on error (webhook best practice - don't trigger retries)
    return NextResponse.json(
      { message: 'Error tracked, but acknowledged' },
      { status: 200 }
    );
  }
}
