import { IEmailAnalyticsRepository } from '../repositories/IEmailAnalyticsRepository';

export class GetEmailStatsUseCase {
  constructor(private analyticsRepository: IEmailAnalyticsRepository) {}

  async execute() {
    const [summary, recentEvents, trackStats, topEngaged, conversionRates] = await Promise.all([
      this.analyticsRepository.getEventsSummary(),
      this.analyticsRepository.getRecentEvents(50),
      this.analyticsRepository.getTrackStats(),
      this.analyticsRepository.getTopEngagedContacts(10),
      this.analyticsRepository.getConversionMetrics()
    ]);

    return {
      summary,
      recentEvents,
      trackStats,
      topEngagedContacts: topEngaged,
      conversionRates: conversionRates.toJSON()
    };
  }
}
