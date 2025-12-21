import { EmailMetrics } from '../value-objects/EmailMetrics';

export interface EventsSummary {
  event_type: string;
  total: number;
  unique_contacts: number;
  unique_tracks: number;
}

export interface RecentEvent {
  event_type: string;
  created_at: string;
  email: string;
  name: string | null;
  track_title: string | null;
  event_data: any;
}

export interface TrackStats {
  title: string;
  track_id: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unique_recipients: number;
}

export interface EngagedContact {
  email: string;
  name: string | null;
  opens: number;
  clicks: number;
  last_interaction: string;
}

export interface CampaignStat {
  track_id: string;
  track_title: string;
  track_url: string;
  published_at: string;
  total_sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
}

export interface IEmailAnalyticsRepository {
  getEventsSummary(): Promise<EventsSummary[]>;
  getRecentEvents(limit: number): Promise<RecentEvent[]>;
  getTrackStats(): Promise<TrackStats[]>;
  getTopEngagedContacts(limit: number): Promise<EngagedContact[]>;
  getConversionMetrics(): Promise<EmailMetrics>;
  getCampaignStats(trackId?: string): Promise<CampaignStat[]>;
}
