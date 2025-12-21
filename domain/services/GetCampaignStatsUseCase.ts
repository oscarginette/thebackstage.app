import { IEmailAnalyticsRepository } from '../repositories/IEmailAnalyticsRepository';

export class GetCampaignStatsUseCase {
  constructor(private analyticsRepository: IEmailAnalyticsRepository) {}

  async execute(trackId?: string) {
    const stats = await this.analyticsRepository.getCampaignStats(trackId);

    return {
      stats: stats.map(stat => ({
        ...stat,
        delivery_rate: this.calculateRate(stat.delivered, stat.total_sent),
        open_rate: this.calculateRate(stat.opened, stat.delivered),
        click_rate: this.calculateRate(stat.clicked, stat.opened),
        bounce_rate: this.calculateRate(stat.bounced, stat.total_sent)
      }))
    };
  }

  private calculateRate(numerator: number, denominator: number): number {
    return denominator > 0 ? Math.round((numerator / denominator) * 10000) / 100 : 0;
  }
}
