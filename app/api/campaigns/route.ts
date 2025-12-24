import { NextResponse } from 'next/server';
import { GetCampaignsUseCase } from '@/domain/services/campaigns/GetCampaignsUseCase';
import { CreateCampaignUseCase, ValidationError } from '@/domain/services/campaigns/CreateCampaignUseCase';
import { emailCampaignRepository } from '@/infrastructure/database/repositories';

export const dynamic = 'force-dynamic';

/**
 * GET /api/campaigns
 * List all email campaigns
 *
 * Query parameters:
 * - status: 'draft' | 'sent' (optional) - Filter by campaign status
 * - trackId: string (optional) - Filter by track ID
 * - templateId: string (optional) - Filter by template ID
 * - scheduledOnly: boolean (optional) - Only return scheduled campaigns
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'draft' | 'sent' | null;
    const trackId = searchParams.get('trackId');
    const templateId = searchParams.get('templateId');
    const scheduledOnly = searchParams.get('scheduledOnly') === 'true';

    const useCase = new GetCampaignsUseCase(emailCampaignRepository);
    const result = await useCase.execute({
      status: status || undefined,
      trackId: trackId || undefined,
      templateId: templateId || undefined,
      scheduledOnly
    });

    return NextResponse.json({
      campaigns: result.campaigns,
      count: result.count
    });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/campaigns
 * Create a new email campaign or draft
 *
 * Body:
 * - templateId: string (optional) - Template to base campaign on
 * - trackId: string (optional) - Track to link campaign to
 * - subject: string (required) - Campaign subject
 * - htmlContent: string (required) - Campaign HTML content
 * - status: 'draft' | 'sent' (optional, default: 'draft') - Initial status
 * - scheduledAt: string (optional) - ISO date string for scheduled sending
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const useCase = new CreateCampaignUseCase(emailCampaignRepository);
    const result = await useCase.execute({
      templateId: body.templateId,
      trackId: body.trackId,
      subject: body.subject,
      htmlContent: body.htmlContent,
      status: body.status || 'draft',
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null
    });

    return NextResponse.json({
      campaign: result.campaign,
      success: result.success
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating campaign:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
