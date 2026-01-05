/**
 * SendNewUserNotificationUseCase
 *
 * Sends admin notification email when a new user signs up.
 * Fire-and-forget pattern - doesn't block signup flow.
 *
 * Clean Architecture: Domain service orchestrating email notification.
 * SOLID Compliance:
 * - SRP: Single responsibility (send admin notification)
 * - DIP: Depends on IUserRepository and IEmailProvider interfaces
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { IEmailProvider } from '../providers/IEmailProvider';
import { NewUserSignupEmail } from '@/infrastructure/email/templates/NewUserSignupEmail';
import { env, getAppUrl, getBaseUrl } from '@/lib/env';

export interface SendNewUserNotificationInput {
  userId: number;
}

export interface SendNewUserNotificationResult {
  success: boolean;
  error?: string;
}

export class SendNewUserNotificationUseCase {
  private readonly adminEmail: string;
  private readonly baseUrl: string;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailProvider: IEmailProvider,
    config?: {
      adminEmail?: string;
      baseUrl?: string;
    }
  ) {
    // Use environment variable or fallback to config parameter
    this.adminEmail =
      env.ADMIN_EMAIL ||
      config?.adminEmail ||
      'admin@backstage.app';

    this.baseUrl =
      getAppUrl() ||
      config?.baseUrl ||
      'https://backstage.app';
  }

  /**
   * Execute notification sending
   * Fire-and-forget: Logs errors but doesn't throw
   */
  async execute(
    input: SendNewUserNotificationInput
  ): Promise<SendNewUserNotificationResult> {
    try {
      // 1. Fetch user details
      const user = await this.userRepository.findById(input.userId);

      if (!user) {
        console.error(
          `[SendNewUserNotification] User not found: ${input.userId}`
        );
        return {
          success: false,
          error: 'User not found',
        };
      }

      // 2. Build admin panel URL
      const adminPanelUrl = `${this.baseUrl}/admin/users`;

      // 3. Generate email content
      const subject = NewUserSignupEmail.getSubject({
        userEmail: user.email,
        userName: user.name,
        signupDate: user.createdAt,
        adminPanelUrl,
      });

      const html = NewUserSignupEmail.getHtml({
        userEmail: user.email,
        userName: user.name,
        signupDate: user.createdAt,
        adminPanelUrl,
      });

      // 4. Send email to admin
      const result = await this.emailProvider.send({
        to: this.adminEmail,
        subject,
        html,
        from: env.SENDER_EMAIL
          ? `The Backstage <${env.SENDER_EMAIL}>`
          : undefined,
      });

      if (!result.success) {
        console.error(
          `[SendNewUserNotification] Email send failed:`,
          result.error
        );
        return {
          success: false,
          error: result.error,
        };
      }

      console.log(
        `[SendNewUserNotification] Admin notified for user: ${user.email}`
      );

      return {
        success: true,
      };
    } catch (error) {
      // Fire-and-forget: Log but don't throw
      console.error('[SendNewUserNotification] Unexpected error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
