/**
 * SendSubscriptionActivatedEmailUseCase
 *
 * Sends welcome email to user when their subscription is activated.
 * Includes plan details, features, and dashboard link.
 *
 * Clean Architecture: Domain service orchestrating user notification.
 * SOLID Compliance:
 * - SRP: Single responsibility (send subscription activation email)
 * - DIP: Depends on IUserRepository, IQuotaTrackingRepository, and IEmailProvider
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { IQuotaTrackingRepository } from '../repositories/IQuotaTrackingRepository';
import { IEmailProvider } from '../providers/IEmailProvider';
import { SubscriptionActivatedEmail } from '@/infrastructure/email/templates/SubscriptionActivatedEmail';

export interface SendSubscriptionActivatedEmailInput {
  userId: number;
}

export interface SendSubscriptionActivatedEmailResult {
  success: boolean;
  error?: string;
}

export class SendSubscriptionActivatedEmailUseCase {
  private readonly baseUrl: string;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly quotaRepository: IQuotaTrackingRepository,
    private readonly emailProvider: IEmailProvider,
    config?: {
      baseUrl?: string;
    }
  ) {
    this.baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      config?.baseUrl ||
      'https://backstage.app';
  }

  /**
   * Execute subscription activation email
   * Fire-and-forget: Logs errors but doesn't throw
   */
  async execute(
    input: SendSubscriptionActivatedEmailInput
  ): Promise<SendSubscriptionActivatedEmailResult> {
    try {
      // 1. Fetch user details
      const user = await this.userRepository.findById(input.userId);

      if (!user) {
        console.error(
          `[SendSubscriptionActivatedEmail] User not found: ${input.userId}`
        );
        return {
          success: false,
          error: 'User not found',
        };
      }

      // 2. Fetch quota/subscription details
      const quota = await this.quotaRepository.getByUserId(input.userId);

      if (!quota) {
        console.error(
          `[SendSubscriptionActivatedEmail] Quota not found for user: ${input.userId}`
        );
        return {
          success: false,
          error: 'Quota not found',
        };
      }

      // 3. Build dashboard URL
      const dashboardUrl = `${this.baseUrl}/dashboard`;

      // 4. Determine plan name based on quota limits
      const planName = this.getPlanName(quota.monthlyLimit);

      // 5. Generate email content
      const subject = SubscriptionActivatedEmail.getSubject({
        userEmail: user.email,
        userName: user.name,
        planName,
        contactsLimit: quota.monthlyLimit,
        emailsLimit: quota.monthlyLimit,
        dashboardUrl,
      });

      const html = SubscriptionActivatedEmail.getHtml({
        userEmail: user.email,
        userName: user.name,
        planName,
        contactsLimit: quota.monthlyLimit,
        emailsLimit: quota.monthlyLimit,
        dashboardUrl,
      });

      // 6. Send email to user
      const result = await this.emailProvider.send({
        to: user.email,
        subject,
        html,
        from: process.env.SENDER_EMAIL
          ? `Backstage <${process.env.SENDER_EMAIL}>`
          : undefined,
      });

      if (!result.success) {
        console.error(
          `[SendSubscriptionActivatedEmail] Email send failed:`,
          result.error
        );
        return {
          success: false,
          error: result.error,
        };
      }

      console.log(
        `[SendSubscriptionActivatedEmail] User notified: ${user.email}`
      );

      return {
        success: true,
      };
    } catch (error) {
      // Fire-and-forget: Log but don't throw
      console.error(
        '[SendSubscriptionActivatedEmail] Unexpected error:',
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Determine plan name based on quota limits
   * Can be customized based on business logic
   */
  private getPlanName(monthlyLimit: number): string {
    if (monthlyLimit >= 10000) {
      return 'Pro';
    } else if (monthlyLimit >= 5000) {
      return 'Growth';
    } else if (monthlyLimit >= 1000) {
      return 'Starter';
    } else {
      return 'Free';
    }
  }
}
