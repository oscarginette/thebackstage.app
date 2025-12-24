import { NextResponse } from 'next/server';
import { GetCampaignUseCase } from '@/domain/services/campaigns/GetCampaignUseCase';
import { UpdateCampaignUseCase, ValidationError as UpdateValidationError, NotFoundError as UpdateNotFoundError } from '@/domain/services/campaigns/UpdateCampaignUseCase';
import { DeleteCampaignUseCase, ValidationError as DeleteValidationError, NotFoundError as DeleteNotFoundError } from '@/domain/services/campaigns/DeleteCampaignUseCase';
import { emailCampaignRepository } from '@/infrastructure/database/repositories';

export const dynamic = 'force-dynamic';

/**
 * GET /api/campaigns/[id]
 * Get a specific email campaign by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const useCase = new GetCampaignUseCase(emailCampaignRepository);
    const campaign = await useCase.execute(id);

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/campaigns/[id]
 * Update an email campaign
 *
 * Body:
 * - subject: string (optional) - Updated subject
 * - htmlContent: string (optional) - Updated HTML content
 * - status: 'draft' | 'sent' (optional) - Updated status
 * - scheduledAt: string (optional) - Updated schedule (ISO date string)
 *
 * Note: Only draft campaigns can be updated. Sent campaigns are immutable.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();

    const useCase = new UpdateCampaignUseCase(emailCampaignRepository);
    const result = await useCase.execute({
      id,
      subject: body.subject,
      htmlContent: body.htmlContent,
      status: body.status,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      sentAt: body.status === 'sent' ? new Date() : undefined
    });

    return NextResponse.json({
      campaign: result.campaign,
      success: result.success
    });
  } catch (error: any) {
    console.error('Error updating campaign:', error);

    if (error instanceof UpdateNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof UpdateValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/campaigns/[id]
 * Delete an email campaign
 *
 * Note:
 * - Draft campaigns are hard deleted
 * - Sent campaigns cannot be deleted (returns 400 error)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const useCase = new DeleteCampaignUseCase(emailCampaignRepository);
    await useCase.execute(id);

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);

    if (error instanceof DeleteNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof DeleteValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
