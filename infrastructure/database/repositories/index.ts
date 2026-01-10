import { PostgresTrackRepository } from './PostgresTrackRepository';
import { PostgresContactRepository } from './PostgresContactRepository';
import { PostgresEmailLogRepository } from './PostgresEmailLogRepository';
import { PostgresExecutionLogRepository } from './PostgresExecutionLogRepository';
import { PostgresEmailAnalyticsRepository } from './PostgresEmailAnalyticsRepository';
import { PostgresEmailEventRepository } from './PostgresEmailEventRepository';
import { PostgresEmailTemplateRepository } from './PostgresEmailTemplateRepository';
import { PostgresEmailCampaignRepository } from './PostgresEmailCampaignRepository';
import { PostgresDownloadGateRepository } from './PostgresDownloadGateRepository';
import { PostgresDownloadSubmissionRepository } from './PostgresDownloadSubmissionRepository';
import { PostgresProductRepository } from './PostgresProductRepository';
import { PostgresPriceRepository } from './PostgresPriceRepository';
import { PostgresSubscriptionRepository } from './PostgresSubscriptionRepository';
import { PostgresInvoiceRepository } from './PostgresInvoiceRepository';
import { PostgresBrevoIntegrationRepository } from './PostgresBrevoIntegrationRepository';
import { PostgresBrevoImportHistoryRepository } from './PostgresBrevoImportHistoryRepository';
import { PostgresDemoRepository } from './PostgresDemoRepository';
import { PostgresDemoSendRepository } from './PostgresDemoSendRepository';
import { PostgresDemoSupportRepository } from './PostgresDemoSupportRepository';

// Singleton instances
export const trackRepository = new PostgresTrackRepository();
export const contactRepository = new PostgresContactRepository();
export const emailLogRepository = new PostgresEmailLogRepository();
export const executionLogRepository = new PostgresExecutionLogRepository();
export const emailAnalyticsRepository = new PostgresEmailAnalyticsRepository();
export const emailEventRepository = new PostgresEmailEventRepository();
export const emailTemplateRepository = new PostgresEmailTemplateRepository();
export const emailCampaignRepository = new PostgresEmailCampaignRepository();
export const downloadGateRepository = new PostgresDownloadGateRepository();
export const downloadSubmissionRepository = new PostgresDownloadSubmissionRepository();

// Subscription system repositories
export const productRepository = new PostgresProductRepository();
export const priceRepository = new PostgresPriceRepository();
export const subscriptionRepository = new PostgresSubscriptionRepository();
export const invoiceRepository = new PostgresInvoiceRepository();

// Brevo integration repositories
export const brevoIntegrationRepository = new PostgresBrevoIntegrationRepository();
export const brevoImportHistoryRepository = new PostgresBrevoImportHistoryRepository();

// Demo system repositories
export const demoRepository = new PostgresDemoRepository();
export const demoSendRepository = new PostgresDemoSendRepository();
export const demoSupportRepository = new PostgresDemoSupportRepository();
