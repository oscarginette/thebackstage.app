/**
 * Dependency Injection Container
 *
 * Centralized factory for creating repositories and use cases.
 * Implements Dependency Inversion Principle (SOLID).
 *
 * Benefits:
 * - Single source of truth for dependency wiring
 * - Easy to swap implementations (testing, different providers)
 * - Consistent instantiation across all API routes
 * - Type-safe dependency injection
 *
 * Usage:
 * ```typescript
 * import { UseCaseFactory } from '@/lib/di-container';
 * const useCase = UseCaseFactory.createUnsubscribeUseCase();
 * ```
 */

// ============================================================================
// Repository Imports
// ============================================================================
import { PostgresContactRepository } from '@/infrastructure/database/repositories/PostgresContactRepository';
import { PostgresConsentHistoryRepository } from '@/infrastructure/database/repositories/PostgresConsentHistoryRepository';
import { PostgresDownloadGateRepository } from '@/infrastructure/database/repositories/PostgresDownloadGateRepository';
import { PostgresDownloadAnalyticsRepository } from '@/infrastructure/database/repositories/PostgresDownloadAnalyticsRepository';
import { PostgresDownloadSubmissionRepository } from '@/infrastructure/database/repositories/PostgresDownloadSubmissionRepository';
import { PostgresTrackRepository } from '@/infrastructure/database/repositories/PostgresTrackRepository';
import { PostgresQuotaTrackingRepository } from '@/infrastructure/database/repositories/PostgresQuotaTrackingRepository';
import { PostgresEmailTemplateRepository } from '@/infrastructure/database/repositories/PostgresEmailTemplateRepository';
import { PostgresEmailCampaignRepository } from '@/infrastructure/database/repositories/PostgresEmailCampaignRepository';
import { PostgresEmailLogRepository } from '@/infrastructure/database/repositories/PostgresEmailLogRepository';
import { PostgresEmailEventRepository } from '@/infrastructure/database/repositories/PostgresEmailEventRepository';
import { PostgresEmailAnalyticsRepository } from '@/infrastructure/database/repositories/PostgresEmailAnalyticsRepository';
import { PostgresExecutionLogRepository } from '@/infrastructure/database/repositories/PostgresExecutionLogRepository';
import { PostgresContactImportHistoryRepository } from '@/infrastructure/database/repositories/PostgresContactImportHistoryRepository';
import { PostgresUserRepository } from '@/infrastructure/database/repositories/PostgresUserRepository';
import { PostgresUserSettingsRepository } from '@/infrastructure/database/repositories/PostgresUserSettingsRepository';
import { PostgresOAuthStateRepository } from '@/infrastructure/database/repositories/PostgresOAuthStateRepository';
import { PostgresPricingPlanRepository } from '@/infrastructure/database/repositories/PostgresPricingPlanRepository';
import { PostgresProductRepository } from '@/infrastructure/database/repositories/PostgresProductRepository';
import { PostgresPriceRepository } from '@/infrastructure/database/repositories/PostgresPriceRepository';
import { SoundCloudRepository } from '@/infrastructure/music-platforms/SoundCloudRepository';
import { SpotifyRepository } from '@/infrastructure/music-platforms/SpotifyRepository';
import type { IMusicPlatformRepository } from '@/domain/repositories/IMusicPlatformRepository';
import { SoundCloudClient as SoundCloudRSSClient } from '@/infrastructure/music-platforms/SoundCloudClient';
import { SpotifyClient } from '@/infrastructure/music-platforms/SpotifyClient';
import { PostgresSubscriptionRepository } from '@/infrastructure/database/repositories/PostgresSubscriptionRepository';
import { PostgresSubscriptionHistoryRepository } from '@/infrastructure/database/repositories/PostgresSubscriptionHistoryRepository';

// ============================================================================
// Repository Interface Imports
// ============================================================================
import type { IContactRepository } from '@/domain/repositories/IContactRepository';
import type { IConsentHistoryRepository } from '@/domain/repositories/IConsentHistoryRepository';
import type { IDownloadGateRepository } from '@/domain/repositories/IDownloadGateRepository';
import type { IDownloadAnalyticsRepository } from '@/domain/repositories/IDownloadAnalyticsRepository';
import type { IDownloadSubmissionRepository } from '@/domain/repositories/IDownloadSubmissionRepository';
import type { ITrackRepository } from '@/domain/repositories/ITrackRepository';
import type { IQuotaTrackingRepository } from '@/domain/repositories/IQuotaTrackingRepository';
import type { IEmailTemplateRepository } from '@/domain/repositories/IEmailTemplateRepository';
import type { IEmailCampaignRepository } from '@/domain/repositories/IEmailCampaignRepository';
import type { IEmailLogRepository } from '@/domain/repositories/IEmailLogRepository';
import type { IEmailEventRepository } from '@/domain/repositories/IEmailEventRepository';
import type { IEmailAnalyticsRepository } from '@/domain/repositories/IEmailAnalyticsRepository';
import type { IExecutionLogRepository } from '@/domain/repositories/IExecutionLogRepository';
import type { IContactImportHistoryRepository } from '@/domain/repositories/IContactImportHistoryRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import type { IUserSettingsRepository } from '@/domain/repositories/IUserSettingsRepository';
import type { IOAuthStateRepository } from '@/domain/repositories/IOAuthStateRepository';
import type { IPricingPlanRepository } from '@/domain/repositories/IPricingPlanRepository';
import type { IProductRepository } from '@/domain/repositories/IProductRepository';
import type { IPriceRepository } from '@/domain/repositories/IPriceRepository';
import type { ISubscriptionRepository } from '@/domain/repositories/ISubscriptionRepository';
import type { ISubscriptionHistoryRepository } from '@/domain/repositories/ISubscriptionHistoryRepository';

// ============================================================================
// Provider Imports
// ============================================================================
import { resendEmailProvider } from '@/infrastructure/email';
import type { IEmailProvider } from '@/infrastructure/email/IEmailProvider';
import type { IImageStorageProvider } from '@/infrastructure/storage/IImageStorageProvider';
import { SoundCloudClient } from '@/lib/soundcloud-client';

// ============================================================================
// Use Case Imports
// ============================================================================
import { EmailSentEvent } from '@/domain/events/EmailSentEvent';
import { EmailDeliveredEvent } from '@/domain/events/EmailDeliveredEvent';
import { EmailBouncedEvent } from '@/domain/events/EmailBouncedEvent';
import { EmailOpenedEvent } from '@/domain/events/EmailOpenedEvent';
import { EmailClickedEvent } from '@/domain/events/EmailClickedEvent';
import { EmailDelayedEvent } from '@/domain/events/EmailDelayedEvent';
import { UnsubscribeUseCase } from '@/domain/services/UnsubscribeUseCase';
import { ResubscribeUseCase } from '@/domain/services/ResubscribeUseCase';
import { SendTrackEmailUseCase } from '@/domain/services/SendTrackEmailUseCase';
import { SendNewTrackEmailsUseCase } from '@/domain/services/SendNewTrackEmailsUseCase';
import { SendCustomEmailUseCase } from '@/domain/services/SendCustomEmailUseCase';
import { SendTestEmailUseCase } from '@/domain/services/SendTestEmailUseCase';
import { SendDraftUseCase } from '@/domain/services/SendDraftUseCase';
import { GetContactsWithStatsUseCase } from '@/domain/services/GetContactsWithStatsUseCase';
import { DeleteContactsUseCase } from '@/domain/services/DeleteContactsUseCase';
import { ImportContactsUseCase } from '@/domain/services/ImportContactsUseCase';
import { FetchBrevoContactsUseCase } from '@/domain/services/FetchBrevoContactsUseCase';
import { CreateDownloadGateUseCase } from '@/domain/services/CreateDownloadGateUseCase';
import { UpdateDownloadGateUseCase } from '@/domain/services/UpdateDownloadGateUseCase';
import { DeleteDownloadGateUseCase } from '@/domain/services/DeleteDownloadGateUseCase';
import { ListDownloadGatesUseCase } from '@/domain/services/ListDownloadGatesUseCase';
import { GetDownloadGateUseCase } from '@/domain/services/GetDownloadGateUseCase';
import { GetGateStatsUseCase } from '@/domain/services/GetGateStatsUseCase';
import { ListGateSubmissionsUseCase } from '@/domain/services/ListGateSubmissionsUseCase';
import { SubmitEmailUseCase } from '@/domain/services/SubmitEmailUseCase';
import { GenerateDownloadTokenUseCase } from '@/domain/services/GenerateDownloadTokenUseCase';
import { ProcessDownloadUseCase } from '@/domain/services/ProcessDownloadUseCase';
import { TrackGateAnalyticsUseCase } from '@/domain/services/TrackGateAnalyticsUseCase';
import { VerifySoundCloudRepostUseCase } from '@/domain/services/VerifySoundCloudRepostUseCase';
import { VerifySoundCloudFollowUseCase } from '@/domain/services/VerifySoundCloudFollowUseCase';
import { CheckAllMusicPlatformsUseCase } from '@/domain/services/CheckAllMusicPlatformsUseCase';
import { GetSoundCloudTracksUseCase } from '@/domain/services/GetSoundCloudTracksUseCase';
import { CheckNewTracksUseCase } from '@/domain/services/CheckNewTracksUseCase';
import { ConnectSpotifyUseCase } from '@/domain/services/ConnectSpotifyUseCase';
import { CheckQuotaUseCase } from '@/domain/services/CheckQuotaUseCase';
import { CheckContactQuotaUseCase } from '@/domain/services/CheckContactQuotaUseCase';
import { CheckEmailQuotaUseCase } from '@/domain/services/CheckEmailQuotaUseCase';
import { GetEmailTemplatesUseCase } from '@/domain/services/GetEmailTemplatesUseCase';
import { CreateEmailTemplateUseCase } from '@/domain/services/CreateEmailTemplateUseCase';
import { GetDraftsUseCase } from '@/domain/services/GetDraftsUseCase';
import { SaveDraftUseCase } from '@/domain/services/SaveDraftUseCase';
import { GetEmailStatsUseCase } from '@/domain/services/GetEmailStatsUseCase';
import { GetCampaignStatsUseCase } from '@/domain/services/GetCampaignStatsUseCase';
import { ProcessEmailEventUseCase } from '@/domain/services/ProcessEmailEventUseCase';
import { UploadCoverImageUseCase } from '@/domain/services/UploadCoverImageUseCase';
import { GetUserSettingsUseCase } from '@/domain/services/GetUserSettingsUseCase';
import { UpdateUserSettingsUseCase } from '@/domain/services/UpdateUserSettingsUseCase';
import { CreateUserUseCase } from '@/domain/services/CreateUserUseCase';
import { SendNewUserNotificationUseCase } from '@/domain/services/SendNewUserNotificationUseCase';
import { SendSubscriptionActivatedEmailUseCase } from '@/domain/services/SendSubscriptionActivatedEmailUseCase';
import { ActivateUserSubscriptionUseCase } from '@/domain/services/ActivateUserSubscriptionUseCase';
import { BulkActivateUsersUseCase } from '@/domain/services/BulkActivateUsersUseCase';
import { GetProductsWithPricesUseCase } from '@/domain/services/GetProductsWithPricesUseCase';
import { CreateSubscriptionUseCase } from '@/domain/services/CreateSubscriptionUseCase';
import { CancelSubscriptionUseCase } from '@/domain/services/CancelSubscriptionUseCase';

// ============================================================================
// REPOSITORY FACTORY
// ============================================================================

/**
 * Factory for creating repository instances
 *
 * Centralizes repository instantiation to ensure consistency.
 * All factories return interface types (Dependency Inversion).
 */
export class RepositoryFactory {
  // Contact Management
  static createContactRepository(): IContactRepository {
    return new PostgresContactRepository();
  }

  static createConsentHistoryRepository(): IConsentHistoryRepository {
    return new PostgresConsentHistoryRepository();
  }

  static createContactImportHistoryRepository(): IContactImportHistoryRepository {
    return new PostgresContactImportHistoryRepository();
  }

  // Download Gates
  static createDownloadGateRepository(): IDownloadGateRepository {
    return new PostgresDownloadGateRepository();
  }

  static createDownloadAnalyticsRepository(): IDownloadAnalyticsRepository {
    return new PostgresDownloadAnalyticsRepository();
  }

  static createDownloadSubmissionRepository(): IDownloadSubmissionRepository {
    return new PostgresDownloadSubmissionRepository();
  }

  // Track Management
  static createTrackRepository(): ITrackRepository {
    return new PostgresTrackRepository();
  }

  // Email System
  static createEmailTemplateRepository(): IEmailTemplateRepository {
    return new PostgresEmailTemplateRepository();
  }

  static createEmailCampaignRepository(): IEmailCampaignRepository {
    return new PostgresEmailCampaignRepository();
  }

  static createEmailLogRepository(): IEmailLogRepository {
    return new PostgresEmailLogRepository();
  }

  static createEmailEventRepository(): IEmailEventRepository {
    return new PostgresEmailEventRepository();
  }

  static createEmailAnalyticsRepository(): IEmailAnalyticsRepository {
    return new PostgresEmailAnalyticsRepository();
  }

  // Quota & Execution
  static createQuotaTrackingRepository(): IQuotaTrackingRepository {
    return new PostgresQuotaTrackingRepository();
  }

  static createExecutionLogRepository(): IExecutionLogRepository {
    return new PostgresExecutionLogRepository();
  }

  // User Management
  static createUserRepository(): IUserRepository {
    return new PostgresUserRepository();
  }

  static createUserSettingsRepository(): IUserSettingsRepository {
    return new PostgresUserSettingsRepository();
  }

  static createOAuthStateRepository(): IOAuthStateRepository {
    return new PostgresOAuthStateRepository();
  }

  // Pricing & Subscriptions
  static createPricingPlanRepository(): IPricingPlanRepository {
    return new PostgresPricingPlanRepository();
  }

  static createProductRepository(): IProductRepository {
    return new PostgresProductRepository();
  }

  static createPriceRepository(): IPriceRepository {
    return new PostgresPriceRepository();
  }

  static createSubscriptionRepository(): ISubscriptionRepository {
    return new PostgresSubscriptionRepository();
  }

  static createSubscriptionHistoryRepository(): ISubscriptionHistoryRepository {
    return new PostgresSubscriptionHistoryRepository();
  }

  static createMusicPlatformRepository(platform: 'soundcloud' | 'spotify'): IMusicPlatformRepository {
    if (platform === 'soundcloud') {
      return new SoundCloudRepository(new SoundCloudRSSClient());
    } else {
      return new SpotifyRepository(new SpotifyClient());
    }
  }
}

// ============================================================================
// PROVIDER FACTORY
// ============================================================================

/**
 * Factory for creating provider instances
 *
 * Centralizes provider instantiation (email, storage, etc.).
 */
export class ProviderFactory {
  static createEmailProvider(): IEmailProvider {
    return resendEmailProvider;
  }

  static createSoundCloudClient(): SoundCloudClient {
    return new SoundCloudClient();
  }

  // Note: Image storage provider would be instantiated here when needed
  // static createImageStorageProvider(): IImageStorageProvider {
  //   return new S3ImageStorageProvider() or new CloudinaryProvider();
  // }
}

// ============================================================================
// USE CASE FACTORY
// ============================================================================

/**
 * Factory for creating use case instances with dependencies injected
 *
 * Each factory method creates a use case with all required dependencies.
 * This is the SINGLE SOURCE OF TRUTH for use case instantiation.
 */
export class UseCaseFactory {
  // ============================================================================
  // Contact Management Use Cases
  // ============================================================================

  static createUnsubscribeUseCase(): UnsubscribeUseCase {
    return new UnsubscribeUseCase(
      RepositoryFactory.createContactRepository(),
      RepositoryFactory.createConsentHistoryRepository()
    );
  }

  static createResubscribeUseCase(): ResubscribeUseCase {
    return new ResubscribeUseCase(
      RepositoryFactory.createContactRepository(),
      RepositoryFactory.createConsentHistoryRepository()
    );
  }

  static createGetContactsWithStatsUseCase(): GetContactsWithStatsUseCase {
    return new GetContactsWithStatsUseCase(
      RepositoryFactory.createContactRepository()
    );
  }

  static createDeleteContactsUseCase(): DeleteContactsUseCase {
    return new DeleteContactsUseCase(
      RepositoryFactory.createContactRepository()
    );
  }

  static createImportContactsUseCase(): ImportContactsUseCase {
    return new ImportContactsUseCase(
      RepositoryFactory.createContactRepository(),
      RepositoryFactory.createContactImportHistoryRepository()
    );
  }

  static createFetchBrevoContactsUseCase(brevoClient: any): FetchBrevoContactsUseCase {
    return new FetchBrevoContactsUseCase(brevoClient);
  }

  // ============================================================================
  // Email Sending Use Cases
  // ============================================================================

  static createSendTrackEmailUseCase(): SendTrackEmailUseCase {
    return new SendTrackEmailUseCase(
      ProviderFactory.createEmailProvider(),
      RepositoryFactory.createQuotaTrackingRepository()
    );
  }

  static createSendNewTrackEmailsUseCase(): SendNewTrackEmailsUseCase {
    return new SendNewTrackEmailsUseCase(
      RepositoryFactory.createContactRepository(),
      ProviderFactory.createEmailProvider(),
      RepositoryFactory.createTrackRepository(),
      RepositoryFactory.createExecutionLogRepository()
    );
  }

  static createSendCustomEmailUseCase(): SendCustomEmailUseCase {
    return new SendCustomEmailUseCase(
      RepositoryFactory.createContactRepository(),
      ProviderFactory.createEmailProvider(),
      RepositoryFactory.createEmailLogRepository(),
      RepositoryFactory.createExecutionLogRepository(),
      RepositoryFactory.createEmailCampaignRepository()
    );
  }

  static createSendTestEmailUseCase(): SendTestEmailUseCase {
    return new SendTestEmailUseCase(
      RepositoryFactory.createContactRepository(),
      ProviderFactory.createEmailProvider(),
      RepositoryFactory.createTrackRepository(),
      RepositoryFactory.createEmailLogRepository()
    );
  }

  static createSendDraftUseCase(): SendDraftUseCase {
    return new SendDraftUseCase(
      RepositoryFactory.createContactRepository(),
      ProviderFactory.createEmailProvider(),
      RepositoryFactory.createExecutionLogRepository(),
      RepositoryFactory.createEmailCampaignRepository()
    );
  }

  // ============================================================================
  // Download Gate Use Cases
  // ============================================================================

  static createCreateDownloadGateUseCase(): CreateDownloadGateUseCase {
    return new CreateDownloadGateUseCase(
      RepositoryFactory.createDownloadGateRepository()
    );
  }

  static createUpdateDownloadGateUseCase(): UpdateDownloadGateUseCase {
    return new UpdateDownloadGateUseCase(
      RepositoryFactory.createDownloadGateRepository(),
      RepositoryFactory.createDownloadSubmissionRepository()
    );
  }

  static createDeleteDownloadGateUseCase(): DeleteDownloadGateUseCase {
    return new DeleteDownloadGateUseCase(
      RepositoryFactory.createDownloadGateRepository()
    );
  }

  static createListDownloadGatesUseCase(): ListDownloadGatesUseCase {
    return new ListDownloadGatesUseCase(
      RepositoryFactory.createDownloadGateRepository(),
      RepositoryFactory.createDownloadAnalyticsRepository()
    );
  }

  static createGetDownloadGateUseCase(): GetDownloadGateUseCase {
    return new GetDownloadGateUseCase(
      RepositoryFactory.createDownloadGateRepository()
    );
  }

  static createGetGateStatsUseCase(): GetGateStatsUseCase {
    return new GetGateStatsUseCase(
      RepositoryFactory.createDownloadGateRepository(),
      RepositoryFactory.createDownloadAnalyticsRepository()
    );
  }

  static createListGateSubmissionsUseCase(): ListGateSubmissionsUseCase {
    return new ListGateSubmissionsUseCase(
      RepositoryFactory.createDownloadGateRepository(),
      RepositoryFactory.createDownloadSubmissionRepository()
    );
  }

  static createSubmitEmailUseCase(): SubmitEmailUseCase {
    return new SubmitEmailUseCase(
      RepositoryFactory.createDownloadGateRepository(),
      RepositoryFactory.createDownloadSubmissionRepository(),
      RepositoryFactory.createDownloadAnalyticsRepository(),
      RepositoryFactory.createContactRepository()
    );
  }

  static createGenerateDownloadTokenUseCase(): GenerateDownloadTokenUseCase {
    return new GenerateDownloadTokenUseCase(
      RepositoryFactory.createDownloadSubmissionRepository(),
      RepositoryFactory.createDownloadGateRepository()
    );
  }

  static createProcessDownloadUseCase(): ProcessDownloadUseCase {
    return new ProcessDownloadUseCase(
      RepositoryFactory.createDownloadSubmissionRepository(),
      RepositoryFactory.createDownloadGateRepository(),
      RepositoryFactory.createDownloadAnalyticsRepository()
    );
  }

  static createTrackGateAnalyticsUseCase(): TrackGateAnalyticsUseCase {
    return new TrackGateAnalyticsUseCase(
      RepositoryFactory.createDownloadAnalyticsRepository(),
      RepositoryFactory.createDownloadGateRepository()
    );
  }

  // ============================================================================
  // Music Platform Use Cases
  // ============================================================================

  static createVerifySoundCloudRepostUseCase(): VerifySoundCloudRepostUseCase {
    return new VerifySoundCloudRepostUseCase(
      RepositoryFactory.createDownloadSubmissionRepository(),
      RepositoryFactory.createDownloadGateRepository(),
      RepositoryFactory.createDownloadAnalyticsRepository(),
      ProviderFactory.createSoundCloudClient()
    );
  }

  static createVerifySoundCloudFollowUseCase(): VerifySoundCloudFollowUseCase {
    return new VerifySoundCloudFollowUseCase(
      RepositoryFactory.createDownloadSubmissionRepository(),
      RepositoryFactory.createDownloadGateRepository(),
      RepositoryFactory.createDownloadAnalyticsRepository(),
      ProviderFactory.createSoundCloudClient()
    );
  }

  static createCheckAllMusicPlatformsUseCase(): CheckAllMusicPlatformsUseCase {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return new CheckAllMusicPlatformsUseCase(
      RepositoryFactory.createMusicPlatformRepository('soundcloud'),
      RepositoryFactory.createMusicPlatformRepository('spotify'),
      RepositoryFactory.createContactRepository(),
      ProviderFactory.createEmailProvider(),
      RepositoryFactory.createTrackRepository(),
      RepositoryFactory.createExecutionLogRepository(),
      baseUrl
    );
  }

  static createGetSoundCloudTracksUseCase(): GetSoundCloudTracksUseCase {
    return new GetSoundCloudTracksUseCase(
      RepositoryFactory.createTrackRepository(),
      new SoundCloudRSSClient()
    );
  }

  static createCheckNewTracksUseCase(): CheckNewTracksUseCase {
    // Defaults to SoundCloud - would need to be made configurable per user
    return new CheckNewTracksUseCase(
      RepositoryFactory.createMusicPlatformRepository('soundcloud'),
      RepositoryFactory.createTrackRepository()
    );
  }

  static createConnectSpotifyUseCase(): ConnectSpotifyUseCase {
    return new ConnectSpotifyUseCase(
      RepositoryFactory.createDownloadSubmissionRepository(),
      RepositoryFactory.createDownloadAnalyticsRepository()
    );
  }

  // ============================================================================
  // Quota Use Cases
  // ============================================================================

  static createCheckQuotaUseCase(): CheckQuotaUseCase {
    return new CheckQuotaUseCase(
      RepositoryFactory.createQuotaTrackingRepository()
    );
  }

  static createCheckContactQuotaUseCase(): CheckContactQuotaUseCase {
    return new CheckContactQuotaUseCase(
      RepositoryFactory.createUserRepository(),
      RepositoryFactory.createContactRepository()
    );
  }

  static createCheckEmailQuotaUseCase(): CheckEmailQuotaUseCase {
    return new CheckEmailQuotaUseCase(
      RepositoryFactory.createUserRepository()
    );
  }

  // ============================================================================
  // Email Template Use Cases
  // ============================================================================

  static createGetEmailTemplatesUseCase(): GetEmailTemplatesUseCase {
    return new GetEmailTemplatesUseCase(
      RepositoryFactory.createEmailTemplateRepository()
    );
  }

  static createCreateEmailTemplateUseCase(): CreateEmailTemplateUseCase {
    return new CreateEmailTemplateUseCase(
      RepositoryFactory.createEmailTemplateRepository()
    );
  }

  // ============================================================================
  // Campaign Use Cases
  // ============================================================================

  static createGetDraftsUseCase(): GetDraftsUseCase {
    return new GetDraftsUseCase(
      RepositoryFactory.createEmailCampaignRepository()
    );
  }

  static createSaveDraftUseCase(): SaveDraftUseCase {
    return new SaveDraftUseCase(
      RepositoryFactory.createEmailCampaignRepository()
    );
  }

  // ============================================================================
  // Analytics Use Cases
  // ============================================================================

  static createGetEmailStatsUseCase(): GetEmailStatsUseCase {
    return new GetEmailStatsUseCase(
      RepositoryFactory.createEmailAnalyticsRepository()
    );
  }

  static createGetCampaignStatsUseCase(): GetCampaignStatsUseCase {
    return new GetCampaignStatsUseCase(
      RepositoryFactory.createEmailAnalyticsRepository()
    );
  }

  static createProcessEmailEventUseCase(): ProcessEmailEventUseCase {
    const emailEventRepo = RepositoryFactory.createEmailEventRepository();

    // Create event handler map
    const eventHandlers = new Map();
    eventHandlers.set('email.sent', new EmailSentEvent(emailEventRepo));
    eventHandlers.set('email.delivered', new EmailDeliveredEvent(emailEventRepo));
    eventHandlers.set('email.bounced', new EmailBouncedEvent(emailEventRepo));
    eventHandlers.set('email.opened', new EmailOpenedEvent(emailEventRepo));
    eventHandlers.set('email.clicked', new EmailClickedEvent(emailEventRepo));
    eventHandlers.set('email.delivery_delayed', new EmailDelayedEvent(emailEventRepo));

    return new ProcessEmailEventUseCase(emailEventRepo, eventHandlers);
  }

  // ============================================================================
  // User & Settings Use Cases
  // ============================================================================

  static createGetUserSettingsUseCase(): GetUserSettingsUseCase {
    return new GetUserSettingsUseCase(
      RepositoryFactory.createUserSettingsRepository()
    );
  }

  static createUpdateUserSettingsUseCase(): UpdateUserSettingsUseCase {
    return new UpdateUserSettingsUseCase(
      RepositoryFactory.createUserSettingsRepository()
    );
  }

  static createCreateUserUseCase(): CreateUserUseCase {
    return new CreateUserUseCase(
      RepositoryFactory.createUserRepository(),
      RepositoryFactory.createQuotaTrackingRepository()
    );
  }

  static createSendNewUserNotificationUseCase(): SendNewUserNotificationUseCase {
    return new SendNewUserNotificationUseCase(
      RepositoryFactory.createUserRepository(),
      ProviderFactory.createEmailProvider(),
      {
        adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
        baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }
    );
  }

  // ============================================================================
  // Subscription Use Cases
  // ============================================================================

  static createSendSubscriptionActivatedEmailUseCase(): SendSubscriptionActivatedEmailUseCase {
    return new SendSubscriptionActivatedEmailUseCase(
      RepositoryFactory.createUserRepository(),
      RepositoryFactory.createQuotaTrackingRepository(),
      ProviderFactory.createEmailProvider(),
      {
        baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }
    );
  }

  static createActivateUserSubscriptionUseCase(): ActivateUserSubscriptionUseCase {
    return new ActivateUserSubscriptionUseCase(
      RepositoryFactory.createUserRepository(),
      RepositoryFactory.createQuotaTrackingRepository(),
      RepositoryFactory.createSubscriptionHistoryRepository()
    );
  }

  static createBulkActivateUsersUseCase(): BulkActivateUsersUseCase {
    return new BulkActivateUsersUseCase(
      RepositoryFactory.createUserRepository(),
      RepositoryFactory.createQuotaTrackingRepository(),
      RepositoryFactory.createSubscriptionHistoryRepository()
    );
  }

  static createGetProductsWithPricesUseCase(): GetProductsWithPricesUseCase {
    return new GetProductsWithPricesUseCase(
      RepositoryFactory.createProductRepository(),
      RepositoryFactory.createPriceRepository()
    );
  }

  static createCreateSubscriptionUseCase(): CreateSubscriptionUseCase {
    return new CreateSubscriptionUseCase(
      RepositoryFactory.createSubscriptionRepository(),
      RepositoryFactory.createUserRepository(),
      RepositoryFactory.createProductRepository()
    );
  }

  static createCancelSubscriptionUseCase(): CancelSubscriptionUseCase {
    return new CancelSubscriptionUseCase(
      RepositoryFactory.createSubscriptionRepository()
    );
  }

  // ============================================================================
  // Miscellaneous Use Cases
  // ============================================================================

  static createUploadCoverImageUseCase(imageStorageProvider: IImageStorageProvider): UploadCoverImageUseCase {
    return new UploadCoverImageUseCase(imageStorageProvider);
  }
}
