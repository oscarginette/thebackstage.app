/**
 * GetDraftsUseCase
 *
 * Use case for retrieving email campaign drafts.
 * Supports filtering and searching drafts.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles draft retrieval logic
 * - Dependency Inversion: Depends on interfaces, not implementations
 */

import { IEmailCampaignRepository, FindCampaignsOptions } from '@/domain/repositories/IEmailCampaignRepository';

export interface GetDraftsInput {
  trackId?: string;
  templateId?: string;
  scheduledOnly?: boolean;
}

export interface DraftSummary {
  id: string;
  subject: string;
  templateId: string | null;
  trackId: string | null;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isScheduled: boolean;
  isCustomEmail: boolean;
}

export class GetDraftsUseCase {
  constructor(private campaignRepository: IEmailCampaignRepository) {}

  /**
   * Get all drafts
   */
  async execute(input?: GetDraftsInput): Promise<DraftSummary[]> {
    const options: FindCampaignsOptions = {
      status: 'draft',
      trackId: input?.trackId,
      templateId: input?.templateId,
      scheduledOnly: input?.scheduledOnly
    };

    const drafts = await this.campaignRepository.findAll(options);

    // Convert to summary format and sort by updated date (newest first)
    return drafts
      .map(draft => this.toDraftSummary(draft))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Get draft by ID
   */
  async getById(id: string) {
    const draft = await this.campaignRepository.findById(id);

    if (!draft) {
      return null;
    }

    // Ensure it's a draft
    if (draft.status !== 'draft') {
      throw new Error('Campaign is not a draft');
    }

    return draft;
  }

  /**
   * Get scheduled drafts (drafts with future scheduledAt)
   */
  async getScheduled(): Promise<DraftSummary[]> {
    const scheduled = await this.campaignRepository.getScheduled();

    return scheduled
      .filter(campaign => campaign.status === 'draft')
      .map(draft => this.toDraftSummary(draft))
      .sort((a, b) => {
        // Sort by scheduled date (earliest first)
        if (!a.scheduledAt || !b.scheduledAt) return 0;
        return a.scheduledAt.getTime() - b.scheduledAt.getTime();
      });
  }

  /**
   * Get drafts count
   */
  async getCount(): Promise<number> {
    return await this.campaignRepository.count('draft');
  }

  /**
   * Get drafts linked to a specific track
   */
  async getByTrackId(trackId: string): Promise<DraftSummary[]> {
    const campaigns = await this.campaignRepository.findByTrackId(trackId);

    return campaigns
      .filter(campaign => campaign.status === 'draft')
      .map(draft => this.toDraftSummary(draft))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Get drafts based on a specific template
   */
  async getByTemplateId(templateId: string): Promise<DraftSummary[]> {
    const campaigns = await this.campaignRepository.findByTemplateId(templateId);

    return campaigns
      .filter(campaign => campaign.status === 'draft')
      .map(draft => this.toDraftSummary(draft))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Convert campaign to draft summary
   */
  private toDraftSummary(campaign: any): DraftSummary {
    const now = new Date();
    const isScheduled = campaign.scheduledAt && new Date(campaign.scheduledAt) > now;

    return {
      id: campaign.id,
      subject: campaign.subject,
      templateId: campaign.templateId,
      trackId: campaign.trackId,
      scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt) : null,
      createdAt: new Date(campaign.createdAt),
      updatedAt: new Date(campaign.updatedAt),
      isScheduled,
      isCustomEmail: !campaign.templateId && !campaign.trackId
    };
  }
}
