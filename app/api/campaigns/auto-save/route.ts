import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';

export const dynamic = 'force-dynamic';

/**
 * POST /api/campaigns/auto-save
 *
 * Auto-save campaign drafts in real-time.
 *
 * Body:
 * - campaignId?: string - Existing campaign ID (if updating)
 * - templateId?: string - Template ID
 * - trackId?: string - Track ID
 * - subject?: string - Email subject
 * - greeting?: string - Email greeting
 * - message?: string - Email message
 * - signature?: string - Email signature
 * - coverImageUrl?: string - Cover image URL
 * - scheduledAt?: string - Scheduled date (ISO format)
 *
 * Response:
 * - success: boolean - Always true (returns 200 even on validation errors)
 * - campaignId: string - Campaign ID (new or existing)
 * - isNew: boolean - Whether this was a new campaign
 * - savedAt: string - ISO timestamp of save
 *
 * Auth: Requires authenticated session
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // 2. Parse request body
    const body = await request.json();

    // 3. Execute use case
    const useCase = UseCaseFactory.createAutoSaveCampaignUseCase();

    const result = await useCase.execute({
      userId,
      campaignId: body.campaignId,
      templateId: body.templateId,
      trackId: body.trackId,
      subject: body.subject,
      greeting: body.greeting,
      message: body.message,
      signature: body.signature,
      coverImageUrl: body.coverImageUrl,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined
    });

    // 4. Return success (even if validation fails, we return 200)
    return NextResponse.json({
      success: result.success,
      campaignId: result.campaignId,
      isNew: result.isNew,
      savedAt: result.savedAt.toISOString()
    });

  } catch (error) {
    // Log error but still return 200 to avoid blocking user
    console.error('[AutoSave] Error:', error);

    // Return generic success to avoid blocking UI
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Auto-save failed',
      savedAt: new Date().toISOString()
    });
  }
}
