import { PostgresTrackRepository } from './PostgresTrackRepository';
import { PostgresContactRepository } from './PostgresContactRepository';
import { PostgresEmailLogRepository } from './PostgresEmailLogRepository';
import { PostgresExecutionLogRepository } from './PostgresExecutionLogRepository';
import { PostgresEmailAnalyticsRepository } from './PostgresEmailAnalyticsRepository';
import { PostgresEmailEventRepository } from './PostgresEmailEventRepository';

// Singleton instances
export const trackRepository = new PostgresTrackRepository();
export const contactRepository = new PostgresContactRepository();
export const emailLogRepository = new PostgresEmailLogRepository();
export const executionLogRepository = new PostgresExecutionLogRepository();
export const emailAnalyticsRepository = new PostgresEmailAnalyticsRepository();
export const emailEventRepository = new PostgresEmailEventRepository();
