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
import { PostgresEmailSignatureRepository } from '@/infrastructure/database/repositories/PostgresEmailSignatureRepository';
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
import { SpotifyClient as SpotifyMusicPlatformClient } from '@/infrastructure/music-platforms/SpotifyClient';
import { PostgresSubscriptionRepository } from '@/infrastructure/database/repositories/PostgresSubscriptionRepository';
import { PostgresSubscriptionHistoryRepository } from '@/infrastructure/database/repositories/PostgresSubscriptionHistoryRepository';
import { PostgresContactListRepository } from '@/infrastructure/database/repositories/PostgresContactListRepository';
import { PostgresUserAppearanceRepository } from '@/infrastructure/database/repositories/PostgresUserAppearanceRepository';
import { PostgresAutoSaveSubscriptionRepository } from '@/infrastructure/database/repositories/PostgresAutoSaveSubscriptionRepository';
import { PostgresInvoiceRepository } from '@/infrastructure/database/repositories/PostgresInvoiceRepository';
import { PostgresBrevoIntegrationRepository } from '@/infrastructure/database/repositories/PostgresBrevoIntegrationRepository';
import { PostgresBrevoImportHistoryRepository } from '@/infrastructure/database/repositories/PostgresBrevoImportHistoryRepository';
import { PostgresSavedReleasesRepository } from '@/infrastructure/database/repositories/PostgresSavedReleasesRepository';
import { PostgresUserNotificationPreferencesRepository } from '@/infrastructure/database/repositories/PostgresUserNotificationPreferencesRepository';
import { PostgresSendingDomainRepository } from '@/infrastructure/database/repositories/PostgresSendingDomainRepository';

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
import type { IEmailSignatureRepository } from '@/domain/repositories/IEmailSignatureRepository';
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
import type { IContactListRepository } from '@/domain/repositories/IContactListRepository';
import type { IUserAppearanceRepository } from '@/domain/repositories/IUserAppearanceRepository';
import type { IAutoSaveSubscriptionRepository } from '@/domain/repositories/IAutoSaveSubscriptionRepository';
import type { IInvoiceRepository } from '@/domain/repositories/IInvoiceRepository';
import type { IBrevoIntegrationRepository } from '@/domain/repositories/IBrevoIntegrationRepository';
import type { IBrevoImportHistoryRepository } from '@/domain/repositories/IBrevoImportHistoryRepository';
import type { ISavedReleasesRepository } from '@/domain/repositories/ISavedReleasesRepository';
import type { IUserNotificationPreferencesRepository } from '@/domain/repositories/IUserNotificationPreferencesRepository';
import type { ISendingDomainRepository } from '@/domain/repositories/ISendingDomainRepository';

// ============================================================================
// Provider Imports (Domain Interfaces)
// ============================================================================
import { resendEmailProvider } from '@/infrastructure/email';
import type { IEmailProvider } from '@/domain/providers/IEmailProvider';
import type { IImageStorageProvider } from '@/domain/providers/IImageStorageProvider';
import type { ICsvGenerator } from '@/domain/providers/ICsvGenerator';
import type { IMailgunClient } from '@/domain/providers/IMailgunClient';
import { SoundCloudClient } from '@/lib/soundcloud-client';
import { SpotifyClient } from '@/lib/spotify-client';
import { CsvGenerator } from '@/infrastructure/csv/CsvGenerator';
import { MailgunDomainClient } from '@/infrastructure/email/mailgun/MailgunDomainClient';

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
import { CompileEmailHtmlUseCase } from '@/domain/services/CompileEmailHtmlUseCase';
import { GetContactsWithStatsUseCase } from '@/domain/services/GetContactsWithStatsUseCase';
import { DeleteContactsUseCase } from '@/domain/services/DeleteContactsUseCase';
import { ImportContactsUseCase } from '@/domain/services/ImportContactsUseCase';
import { CreateContactUseCase } from '@/domain/services/CreateContactUseCase';
import { ExportContactsUseCase } from '@/domain/services/ExportContactsUseCase';
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
import { ProcessDownloadGateUseCase } from '@/domain/services/ProcessDownloadGateUseCase';
import { ValidateDownloadTokenUseCase } from '@/domain/services/ValidateDownloadTokenUseCase';
import { TrackGateAnalyticsUseCase } from '@/domain/services/TrackGateAnalyticsUseCase';
import { VerifySoundCloudRepostUseCase } from '@/domain/services/VerifySoundCloudRepostUseCase';
import { VerifySoundCloudFollowUseCase } from '@/domain/services/VerifySoundCloudFollowUseCase';
import { PostSoundCloudCommentUseCase } from '@/domain/services/PostSoundCloudCommentUseCase';
import { UpdateSoundCloudTrackBuyLinkUseCase } from '@/domain/services/UpdateSoundCloudTrackBuyLinkUseCase';
import { CheckAllMusicPlatformsUseCase } from '@/domain/services/CheckAllMusicPlatformsUseCase';
import { GetSoundCloudTracksUseCase } from '@/domain/services/GetSoundCloudTracksUseCase';
import { CheckNewTracksUseCase } from '@/domain/services/CheckNewTracksUseCase';
import { CheckAllUsersSoundCloudReleasesUseCase } from '@/domain/services/CheckAllUsersSoundCloudReleasesUseCase';
import { CheckAllUsersSpotifyReleasesUseCase } from '@/domain/services/CheckAllUsersSpotifyReleasesUseCase';
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
import { GetUserEmailSignatureUseCase } from '@/domain/services/GetUserEmailSignatureUseCase';
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
import { PromoteUserToAdminUseCase } from '@/domain/services/PromoteUserToAdminUseCase';
import { DeleteUsersUseCase } from '@/domain/services/DeleteUsersUseCase';
import { GetPricingPlansUseCase } from '@/domain/services/GetPricingPlansUseCase';
import { DeleteTracksByPatternUseCase } from '@/domain/services/DeleteTracksByPatternUseCase';
import { GetExecutionHistoryUseCase } from '@/domain/services/GetExecutionHistoryUseCase';
import { GetCampaignPreviewUseCase } from '@/domain/services/GetCampaignPreviewUseCase';
import { UpdatePixelConfigUseCase } from '@/domain/services/UpdatePixelConfigUseCase';
import { GetContactListsWithStatsUseCase } from '@/domain/services/GetContactListsWithStatsUseCase';
import { CreateContactListUseCase } from '@/domain/services/CreateContactListUseCase';
import { UpdateContactListUseCase } from '@/domain/services/UpdateContactListUseCase';
import { DeleteContactListUseCase } from '@/domain/services/DeleteContactListUseCase';
import { AddContactsToListUseCase } from '@/domain/services/AddContactsToListUseCase';
import { RemoveContactsFromListUseCase } from '@/domain/services/RemoveContactsFromListUseCase';
import { AddContactsToMultipleListsUseCase } from '@/domain/services/AddContactsToMultipleListsUseCase';
import { GetListContactsUseCase } from '@/domain/services/GetListContactsUseCase';
import { GetUserAppearanceUseCase } from '@/domain/services/GetUserAppearanceUseCase';
import { UpdateUserAppearanceUseCase } from '@/domain/services/UpdateUserAppearanceUseCase';
import { UpdateEmailSignatureUseCase } from '@/domain/services/UpdateEmailSignatureUseCase';
import { FollowSpotifyArtistUseCase } from '@/domain/services/FollowSpotifyArtistUseCase';
import { CreateAutoSaveSubscriptionUseCase } from '@/domain/services/CreateAutoSaveSubscriptionUseCase';
import { TrackPixelEventUseCase } from '@/domain/services/TrackPixelEventUseCase';
import { GetPaymentHistoryUseCase } from '@/domain/services/GetPaymentHistoryUseCase';
import { CreateManualPaymentUseCase } from '@/domain/services/CreateManualPaymentUseCase';
import { UpdateEmailTemplateUseCase } from '@/domain/services/email-templates/UpdateEmailTemplateUseCase';
import { DeleteEmailTemplateUseCase } from '@/domain/services/email-templates/DeleteEmailTemplateUseCase';
import { CheckNewReleasesUseCase } from '@/domain/services/CheckNewReleasesUseCase';
import { ImportBrevoContactsUseCase } from '@/domain/services/ImportBrevoContactsUseCase';
import { GetBrevoImportHistoryUseCase } from '@/domain/services/GetBrevoImportHistoryUseCase';
import { UpdateUserSenderEmailUseCase } from '@/domain/services/UpdateUserSenderEmailUseCase';
import { ResendCampaignUseCase } from '@/domain/services/ResendCampaignUseCase';
import { AutoSaveCampaignUseCase } from '@/domain/services/campaigns/AutoSaveCampaignUseCase';
import { GetAllUsersUseCase } from '@/domain/services/admin/GetAllUsersUseCase';
import { ToggleUserActiveUseCase } from '@/domain/services/admin/ToggleUserActiveUseCase';
import { UpdateUserQuotaUseCase } from '@/domain/services/admin/UpdateUserQuotaUseCase';
import { GetUserNotificationPreferencesUseCase } from '@/domain/services/GetUserNotificationPreferencesUseCase';
import { UpdateUserNotificationPreferencesUseCase } from '@/domain/services/UpdateUserNotificationPreferencesUseCase';
import { RequestPasswordResetUseCase } from '@/domain/services/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from '@/domain/services/ResetPasswordUseCase';
import { AddSendingDomainUseCase } from '@/domain/services/AddSendingDomainUseCase';
import { VerifySendingDomainUseCase } from '@/domain/services/VerifySendingDomainUseCase';
import { GetUserSendingDomainsUseCase } from '@/domain/services/GetUserSendingDomainsUseCase';
import { DeleteSendingDomainUseCase } from '@/domain/services/DeleteSendingDomainUseCase';

// ============================================================================
// Infrastructure Imports
// ============================================================================
import { BrevoAPIClient } from '@/infrastructure/brevo/BrevoAPIClient';
import { env } from '@/lib/env';

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

  static createEmailSignatureRepository(): IEmailSignatureRepository {
    return new PostgresEmailSignatureRepository();
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

  static createContactListRepository(): IContactListRepository {
    return new PostgresContactListRepository();
  }

  static createUserAppearanceRepository(): IUserAppearanceRepository {
    return new PostgresUserAppearanceRepository();
  }

  static createAutoSaveSubscriptionRepository(): IAutoSaveSubscriptionRepository {
    return new PostgresAutoSaveSubscriptionRepository();
  }

  static createInvoiceRepository(): IInvoiceRepository {
    return new PostgresInvoiceRepository();
  }

  static createBrevoIntegrationRepository(): IBrevoIntegrationRepository {
    return new PostgresBrevoIntegrationRepository();
  }

  static createBrevoImportHistoryRepository(): IBrevoImportHistoryRepository {
    return new PostgresBrevoImportHistoryRepository();
  }

  static createSavedReleasesRepository(): ISavedReleasesRepository {
    return new PostgresSavedReleasesRepository();
  }

  static createUserNotificationPreferencesRepository(): IUserNotificationPreferencesRepository {
    return new PostgresUserNotificationPreferencesRepository();
  }

  static createSendingDomainRepository(): ISendingDomainRepository {
    return new PostgresSendingDomainRepository();
  }

  static createMusicPlatformRepository(platform: 'soundcloud' | 'spotify'): IMusicPlatformRepository {
    if (platform === 'soundcloud') {
      return new SoundCloudRepository(new SoundCloudRSSClient());
    } else {
      return new SpotifyRepository(new SpotifyMusicPlatformClient());
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
    // Feature flag para migración gradual Resend → Mailgun
    if (env.USE_MAILGUN) {
      // Lazy import to avoid loading Mailgun SDK when not needed
      const { MailgunEmailProvider } = require('@/infrastructure/email/MailgunEmailProvider');

      const apiKey = env.MAILGUN_API_KEY;
      const domain = env.MAILGUN_DOMAIN;
      const apiUrl = env.MAILGUN_API_URL || 'https://api.mailgun.net';

      if (!apiKey || !domain) {
        console.error('[ProviderFactory] Mailgun credentials missing, falling back to Resend');
        return resendEmailProvider;
      }

      console.log('[ProviderFactory] Using Mailgun email provider');
      return new MailgunEmailProvider(apiKey, domain, apiUrl);
    }

    // Default: Resend
    console.log('[ProviderFactory] Using Resend email provider');
    return resendEmailProvider;
  }

  static createSoundCloudClient(): SoundCloudClient {
    return new SoundCloudClient();
  }

  static createMailgunClient(): IMailgunClient {
    return new MailgunDomainClient(
      env.MAILGUN_API_KEY || '',
      env.MAILGUN_API_URL
    );
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

  static createCreateContactUseCase(): CreateContactUseCase {
    return new CreateContactUseCase(
      RepositoryFactory.createContactRepository(),
      RepositoryFactory.createConsentHistoryRepository()
    );
  }

  static createExportContactsUseCase(): ExportContactsUseCase {
    return new ExportContactsUseCase(
      RepositoryFactory.createContactRepository(),
      RepositoryFactory.createUserSettingsRepository(),
      new CsvGenerator()
    );
  }

  static createFetchBrevoContactsUseCase(brevoClient: any): FetchBrevoContactsUseCase {
    return new FetchBrevoContactsUseCase(brevoClient);
  }

  static createBrevoAPIClient(apiKeyEncrypted: string): BrevoAPIClient {
    return new BrevoAPIClient(apiKeyEncrypted);
  }

  static createImportBrevoContactsUseCase(brevoClient: BrevoAPIClient): ImportBrevoContactsUseCase {
    return new ImportBrevoContactsUseCase(
      RepositoryFactory.createBrevoIntegrationRepository(),
      RepositoryFactory.createBrevoImportHistoryRepository(),
      RepositoryFactory.createContactRepository(),
      brevoClient
    );
  }

  static createGetBrevoImportHistoryUseCase(): GetBrevoImportHistoryUseCase {
    return new GetBrevoImportHistoryUseCase(
      RepositoryFactory.createBrevoImportHistoryRepository()
    );
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
      RepositoryFactory.createExecutionLogRepository(),
      RepositoryFactory.createUserRepository()
    );
  }

  static createSendCustomEmailUseCase(): SendCustomEmailUseCase {
    const signatureRepo = RepositoryFactory.createEmailSignatureRepository();
    const getSignatureUseCase = new GetUserEmailSignatureUseCase(signatureRepo);

    return new SendCustomEmailUseCase(
      RepositoryFactory.createContactRepository(),
      ProviderFactory.createEmailProvider(),
      RepositoryFactory.createEmailLogRepository(),
      RepositoryFactory.createExecutionLogRepository(),
      RepositoryFactory.createEmailCampaignRepository(),
      getSignatureUseCase
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
      RepositoryFactory.createEmailCampaignRepository(),
      UseCaseFactory.createCompileEmailHtmlUseCase(),
      RepositoryFactory.createUserSettingsRepository(),
      RepositoryFactory.createSendingDomainRepository()
    );
  }

  static createCompileEmailHtmlUseCase(): CompileEmailHtmlUseCase {
    return new CompileEmailHtmlUseCase(
      RepositoryFactory.createEmailSignatureRepository()
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

  static createUpdatePixelConfigUseCase(): UpdatePixelConfigUseCase {
    return new UpdatePixelConfigUseCase(
      RepositoryFactory.createDownloadGateRepository()
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
    // Note: PixelTrackingService can be injected here if needed
    const { PixelTrackingService } = require('@/infrastructure/pixel/PixelTrackingService');
    return new SubmitEmailUseCase(
      RepositoryFactory.createDownloadGateRepository(),
      RepositoryFactory.createDownloadSubmissionRepository(),
      RepositoryFactory.createDownloadAnalyticsRepository(),
      RepositoryFactory.createContactRepository(),
      new PixelTrackingService()
    );
  }

  static createGenerateDownloadTokenUseCase(): GenerateDownloadTokenUseCase {
    return new GenerateDownloadTokenUseCase(
      RepositoryFactory.createDownloadSubmissionRepository(),
      RepositoryFactory.createDownloadGateRepository()
    );
  }

  static createProcessDownloadUseCase(): ProcessDownloadUseCase {
    const { PixelTrackingService } = require('@/infrastructure/pixel/PixelTrackingService');
    return new ProcessDownloadUseCase(
      RepositoryFactory.createDownloadSubmissionRepository(),
      RepositoryFactory.createDownloadGateRepository(),
      RepositoryFactory.createDownloadAnalyticsRepository(),
      new PixelTrackingService()
    );
  }

  static createProcessDownloadGateUseCase(): ProcessDownloadGateUseCase {
    return new ProcessDownloadGateUseCase(
      RepositoryFactory.createDownloadGateRepository(),
      RepositoryFactory.createDownloadSubmissionRepository(),
      RepositoryFactory.createContactRepository(),
      RepositoryFactory.createConsentHistoryRepository(),
      ProviderFactory.createEmailProvider()
    );
  }

  static createValidateDownloadTokenUseCase(): ValidateDownloadTokenUseCase {
    return new ValidateDownloadTokenUseCase(
      RepositoryFactory.createDownloadSubmissionRepository(),
      RepositoryFactory.createDownloadGateRepository()
    );
  }

  static createTrackGateAnalyticsUseCase(): TrackGateAnalyticsUseCase {
    const { PixelTrackingService } = require('@/infrastructure/pixel/PixelTrackingService');
    return new TrackGateAnalyticsUseCase(
      RepositoryFactory.createDownloadAnalyticsRepository(),
      RepositoryFactory.createDownloadGateRepository(),
      new PixelTrackingService()
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

  static createPostSoundCloudCommentUseCase(): PostSoundCloudCommentUseCase {
    return new PostSoundCloudCommentUseCase(
      RepositoryFactory.createDownloadSubmissionRepository(),
      RepositoryFactory.createDownloadGateRepository(),
      RepositoryFactory.createDownloadAnalyticsRepository(),
      ProviderFactory.createSoundCloudClient()
    );
  }

  static createUpdateSoundCloudTrackBuyLinkUseCase(): UpdateSoundCloudTrackBuyLinkUseCase {
    return new UpdateSoundCloudTrackBuyLinkUseCase(
      RepositoryFactory.createDownloadGateRepository(),
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
      RepositoryFactory.createUserRepository(),
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

  static createDeleteTracksByPatternUseCase(): DeleteTracksByPatternUseCase {
    return new DeleteTracksByPatternUseCase(
      RepositoryFactory.createTrackRepository()
    );
  }

  static createCheckAllUsersSoundCloudReleasesUseCase(): CheckAllUsersSoundCloudReleasesUseCase {
    return new CheckAllUsersSoundCloudReleasesUseCase(
      RepositoryFactory.createUserRepository(),
      RepositoryFactory.createMusicPlatformRepository('soundcloud'),
      RepositoryFactory.createTrackRepository(),
      RepositoryFactory.createContactRepository(),
      ProviderFactory.createEmailProvider(),
      RepositoryFactory.createExecutionLogRepository()
    );
  }

  static createCheckAllUsersSpotifyReleasesUseCase(): CheckAllUsersSpotifyReleasesUseCase {
    return new CheckAllUsersSpotifyReleasesUseCase(
      RepositoryFactory.createUserRepository(),
      RepositoryFactory.createMusicPlatformRepository('spotify'),
      RepositoryFactory.createTrackRepository(),
      RepositoryFactory.createContactRepository(),
      ProviderFactory.createEmailProvider(),
      RepositoryFactory.createExecutionLogRepository()
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
    const signatureRepo = RepositoryFactory.createEmailSignatureRepository();
    const getSignatureUseCase = new GetUserEmailSignatureUseCase(signatureRepo);

    return new SaveDraftUseCase(
      RepositoryFactory.createEmailCampaignRepository(),
      getSignatureUseCase
    );
  }

  static createResendCampaignUseCase(): ResendCampaignUseCase {
    return new ResendCampaignUseCase(
      RepositoryFactory.createEmailCampaignRepository()
    );
  }

  static createAutoSaveCampaignUseCase(): AutoSaveCampaignUseCase {
    return new AutoSaveCampaignUseCase(
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

  static createGetExecutionHistoryUseCase(): GetExecutionHistoryUseCase {
    return new GetExecutionHistoryUseCase(
      RepositoryFactory.createTrackRepository(),
      RepositoryFactory.createExecutionLogRepository()
    );
  }

  static createGetCampaignPreviewUseCase(): GetCampaignPreviewUseCase {
    return new GetCampaignPreviewUseCase(
      RepositoryFactory.createExecutionLogRepository(),
      RepositoryFactory.createEmailCampaignRepository(),
      RepositoryFactory.createUserRepository()
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
      RepositoryFactory.createPricingPlanRepository(),
      RepositoryFactory.createSubscriptionHistoryRepository()
    );
  }

  static createBulkActivateUsersUseCase(): BulkActivateUsersUseCase {
    const activateSubscriptionUseCase = UseCaseFactory.createActivateUserSubscriptionUseCase();
    return new BulkActivateUsersUseCase(activateSubscriptionUseCase);
  }

  static createGetProductsWithPricesUseCase(): GetProductsWithPricesUseCase {
    return new GetProductsWithPricesUseCase(
      RepositoryFactory.createProductRepository(),
      RepositoryFactory.createPriceRepository()
    );
  }

  static createGetPricingPlansUseCase(): GetPricingPlansUseCase {
    return new GetPricingPlansUseCase(
      RepositoryFactory.createPricingPlanRepository()
    );
  }

  static createCreateSubscriptionUseCase(): CreateSubscriptionUseCase {
    return new CreateSubscriptionUseCase(
      RepositoryFactory.createSubscriptionRepository(),
      RepositoryFactory.createPriceRepository(),
      RepositoryFactory.createProductRepository()
    );
  }

  static createCancelSubscriptionUseCase(): CancelSubscriptionUseCase {
    return new CancelSubscriptionUseCase(
      RepositoryFactory.createSubscriptionRepository()
    );
  }

  static createDeleteUsersUseCase(): DeleteUsersUseCase {
    return new DeleteUsersUseCase(
      RepositoryFactory.createUserRepository()
    );
  }

  static createPromoteUserToAdminUseCase(expectedSecret: string): PromoteUserToAdminUseCase {
    return new PromoteUserToAdminUseCase(
      RepositoryFactory.createUserRepository(),
      expectedSecret
    );
  }

  // ============================================================================
  // Contact List Use Cases
  // ============================================================================

  static createGetContactListsWithStatsUseCase(): GetContactListsWithStatsUseCase {
    return new GetContactListsWithStatsUseCase(
      RepositoryFactory.createContactListRepository()
    );
  }

  static createCreateContactListUseCase(): CreateContactListUseCase {
    return new CreateContactListUseCase(
      RepositoryFactory.createContactListRepository()
    );
  }

  static createUpdateContactListUseCase(): UpdateContactListUseCase {
    return new UpdateContactListUseCase(
      RepositoryFactory.createContactListRepository()
    );
  }

  static createDeleteContactListUseCase(): DeleteContactListUseCase {
    return new DeleteContactListUseCase(
      RepositoryFactory.createContactListRepository()
    );
  }

  static createAddContactsToListUseCase(): AddContactsToListUseCase {
    return new AddContactsToListUseCase(
      RepositoryFactory.createContactListRepository(),
      RepositoryFactory.createContactRepository()
    );
  }

  static createRemoveContactsFromListUseCase(): RemoveContactsFromListUseCase {
    return new RemoveContactsFromListUseCase(
      RepositoryFactory.createContactListRepository()
    );
  }

  static createAddContactsToMultipleListsUseCase(): AddContactsToMultipleListsUseCase {
    return new AddContactsToMultipleListsUseCase(
      RepositoryFactory.createContactListRepository(),
      RepositoryFactory.createContactRepository()
    );
  }

  static createGetListContactsUseCase(): GetListContactsUseCase {
    return new GetListContactsUseCase(
      RepositoryFactory.createContactListRepository()
    );
  }

  // ============================================================================
  // User Appearance Use Cases
  // ============================================================================

  static createGetUserAppearanceUseCase(): GetUserAppearanceUseCase {
    return new GetUserAppearanceUseCase(
      RepositoryFactory.createUserAppearanceRepository()
    );
  }

  static createUpdateUserAppearanceUseCase(): UpdateUserAppearanceUseCase {
    return new UpdateUserAppearanceUseCase(
      RepositoryFactory.createUserAppearanceRepository()
    );
  }

  // ============================================================================
  // Email Signature Use Cases
  // ============================================================================

  static createGetUserEmailSignatureUseCase(): GetUserEmailSignatureUseCase {
    return new GetUserEmailSignatureUseCase(
      RepositoryFactory.createEmailSignatureRepository()
    );
  }

  static createUpdateEmailSignatureUseCase(): UpdateEmailSignatureUseCase {
    return new UpdateEmailSignatureUseCase(
      RepositoryFactory.createEmailSignatureRepository()
    );
  }

  // ============================================================================
  // Payment Use Cases
  // ============================================================================

  static createGetPaymentHistoryUseCase(): GetPaymentHistoryUseCase {
    return new GetPaymentHistoryUseCase(
      RepositoryFactory.createInvoiceRepository()
    );
  }

  static createCreateManualPaymentUseCase(): CreateManualPaymentUseCase {
    return new CreateManualPaymentUseCase(
      RepositoryFactory.createInvoiceRepository(),
      RepositoryFactory.createUserRepository()
    );
  }

  // ============================================================================
  // Spotify Use Cases
  // ============================================================================

  static createFollowSpotifyArtistUseCase(spotifyClient: any): FollowSpotifyArtistUseCase {
    return new FollowSpotifyArtistUseCase(
      spotifyClient,
      RepositoryFactory.createDownloadSubmissionRepository()
    );
  }

  static createCreateAutoSaveSubscriptionUseCase(tokenEncryption: any): CreateAutoSaveSubscriptionUseCase {
    return new CreateAutoSaveSubscriptionUseCase(
      RepositoryFactory.createAutoSaveSubscriptionRepository(),
      tokenEncryption
    );
  }

  static createCheckNewReleasesUseCase(): CheckNewReleasesUseCase {
    const { TokenEncryption } = require('@/infrastructure/encryption/TokenEncryption');
    return new CheckNewReleasesUseCase(
      RepositoryFactory.createAutoSaveSubscriptionRepository(),
      RepositoryFactory.createSavedReleasesRepository(),
      new SpotifyClient(),
      new TokenEncryption()
    );
  }

  // ============================================================================
  // Email Template Use Cases
  // ============================================================================

  static createUpdateEmailTemplateUseCase(): UpdateEmailTemplateUseCase {
    return new UpdateEmailTemplateUseCase(
      RepositoryFactory.createEmailTemplateRepository()
    );
  }

  static createDeleteEmailTemplateUseCase(): DeleteEmailTemplateUseCase {
    return new DeleteEmailTemplateUseCase(
      RepositoryFactory.createEmailTemplateRepository()
    );
  }

  // ============================================================================
  // Pixel Tracking Use Cases
  // ============================================================================

  static createTrackPixelEventUseCase(): TrackPixelEventUseCase {
    const { PixelTrackingService } = require('@/infrastructure/pixel/PixelTrackingService');
    return new TrackPixelEventUseCase(
      new PixelTrackingService()
    );
  }

  // ============================================================================
  // Miscellaneous Use Cases
  // ============================================================================

  static createUploadCoverImageUseCase(imageStorageProvider: IImageStorageProvider): UploadCoverImageUseCase {
    return new UploadCoverImageUseCase(imageStorageProvider);
  }

  // ============================================================================
  // Admin Use Cases
  // ============================================================================

  static createGetAllUsersUseCase(): GetAllUsersUseCase {
    return new GetAllUsersUseCase(
      RepositoryFactory.createUserRepository()
    );
  }

  static createToggleUserActiveUseCase(): ToggleUserActiveUseCase {
    return new ToggleUserActiveUseCase(
      RepositoryFactory.createUserRepository()
    );
  }

  static createUpdateUserQuotaUseCase(): UpdateUserQuotaUseCase {
    return new UpdateUserQuotaUseCase(
      RepositoryFactory.createUserRepository()
    );
  }

  // ============================================================================
  // Notification Preferences Use Cases
  // ============================================================================

  static createGetUserNotificationPreferencesUseCase(): GetUserNotificationPreferencesUseCase {
    return new GetUserNotificationPreferencesUseCase(
      RepositoryFactory.createUserNotificationPreferencesRepository()
    );
  }

  static createUpdateUserNotificationPreferencesUseCase(): UpdateUserNotificationPreferencesUseCase {
    return new UpdateUserNotificationPreferencesUseCase(
      RepositoryFactory.createUserNotificationPreferencesRepository()
    );
  }

  // ============================================================================
  // Password Reset Use Cases
  // ============================================================================

  static createRequestPasswordResetUseCase(): RequestPasswordResetUseCase {
    return new RequestPasswordResetUseCase(
      RepositoryFactory.createUserRepository(),
      ProviderFactory.createEmailProvider()
    );
  }

  static createResetPasswordUseCase(): ResetPasswordUseCase {
    return new ResetPasswordUseCase(
      RepositoryFactory.createUserRepository()
    );
  }

  // ============================================================================
  // Sending Domain Use Cases
  // ============================================================================

  static createAddSendingDomainUseCase(): AddSendingDomainUseCase {
    return new AddSendingDomainUseCase(
      RepositoryFactory.createSendingDomainRepository(),
      ProviderFactory.createMailgunClient()
    );
  }

  static createVerifySendingDomainUseCase(): VerifySendingDomainUseCase {
    return new VerifySendingDomainUseCase(
      RepositoryFactory.createSendingDomainRepository(),
      ProviderFactory.createMailgunClient()
    );
  }

  static createGetUserSendingDomainsUseCase(): GetUserSendingDomainsUseCase {
    return new GetUserSendingDomainsUseCase(
      RepositoryFactory.createSendingDomainRepository()
    );
  }

  static createDeleteSendingDomainUseCase(): DeleteSendingDomainUseCase {
    return new DeleteSendingDomainUseCase(
      RepositoryFactory.createSendingDomainRepository(),
      ProviderFactory.createMailgunClient()
    );
  }

  // ============================================================================
  // User Configuration Use Cases
  // ============================================================================

  static createUpdateUserSenderEmailUseCase(): UpdateUserSenderEmailUseCase {
    return new UpdateUserSenderEmailUseCase(
      RepositoryFactory.createUserRepository(),
      RepositoryFactory.createSendingDomainRepository()
    );
  }

  // ============================================================================
  // Warm-up Use Cases
  // ============================================================================

  static createStartWarmupCampaignUseCase() {
    const { StartWarmupCampaignUseCase } = require('@/domain/services/warmup/StartWarmupCampaignUseCase');
    return new StartWarmupCampaignUseCase(
      RepositoryFactory.createEmailCampaignRepository(),
      RepositoryFactory.createContactRepository()
    );
  }

  static createSendWarmupBatchUseCase() {
    const { SendWarmupBatchUseCase } = require('@/domain/services/warmup/SendWarmupBatchUseCase');
    return new SendWarmupBatchUseCase(
      RepositoryFactory.createEmailCampaignRepository(),
      RepositoryFactory.createContactRepository(),
      ProviderFactory.createEmailProvider(),
      RepositoryFactory.createEmailLogRepository()
    );
  }

  static createCheckWarmupHealthUseCase() {
    const { CheckWarmupHealthUseCase } = require('@/domain/services/warmup/CheckWarmupHealthUseCase');
    return new CheckWarmupHealthUseCase(
      RepositoryFactory.createEmailCampaignRepository(),
      RepositoryFactory.createEmailEventRepository()
    );
  }

  static createGetWarmupStatusUseCase() {
    const { GetWarmupStatusUseCase } = require('@/domain/services/warmup/GetWarmupStatusUseCase');
    return new GetWarmupStatusUseCase(
      RepositoryFactory.createEmailCampaignRepository(),
      RepositoryFactory.createContactRepository(),
      UseCaseFactory.createCheckWarmupHealthUseCase()
    );
  }

  static createPauseWarmupCampaignUseCase() {
    const { PauseWarmupCampaignUseCase } = require('@/domain/services/warmup/PauseWarmupCampaignUseCase');
    return new PauseWarmupCampaignUseCase(
      RepositoryFactory.createEmailCampaignRepository()
    );
  }

  static createResumeWarmupCampaignUseCase() {
    const { ResumeWarmupCampaignUseCase } = require('@/domain/services/warmup/ResumeWarmupCampaignUseCase');
    return new ResumeWarmupCampaignUseCase(
      RepositoryFactory.createEmailCampaignRepository()
    );
  }
}
