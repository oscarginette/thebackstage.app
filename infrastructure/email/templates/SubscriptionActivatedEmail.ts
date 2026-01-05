/**
 * SubscriptionActivatedEmail Template
 *
 * Generates welcome email for users when their subscription is activated.
 * Includes plan details, features, and expiration information.
 *
 * Clean Architecture: Infrastructure layer template.
 */

export interface SubscriptionActivatedEmailParams {
  userEmail: string;
  userName?: string;
  planName: string;
  contactsLimit: number;
  emailsLimit: number;
  expiresAt?: Date;
  dashboardUrl: string;
}

export class SubscriptionActivatedEmail {
  /**
   * Generate subject line
   */
  static getSubject(params: SubscriptionActivatedEmailParams): string {
    return `Your ${params.planName} subscription is now active!`;
  }

  /**
   * Generate plain text email body
   */
  static getBody(params: SubscriptionActivatedEmailParams): string {
    const greeting = params.userName ? `Hi ${params.userName}` : 'Hello';

    const expirationText = params.expiresAt
      ? `\nExpires: ${params.expiresAt.toLocaleDateString('en-US', { dateStyle: 'long' })}`
      : '';

    return `
${greeting},

Welcome to The Backstage! Your ${params.planName} subscription is now active.

Your Plan Features:
- Contacts Limit: ${params.contactsLimit.toLocaleString()} contacts
- Monthly Emails: ${params.emailsLimit.toLocaleString()} emails${expirationText}

You can now start building your email campaigns and growing your audience.

Get started:
${params.dashboardUrl}

If you have any questions, feel free to reach out to our support team.

Best regards,
The Backstage Team

---
The Backstage - Email Marketing for Artists
`.trim();
  }

  /**
   * Generate HTML email body
   */
  static getHtml(params: SubscriptionActivatedEmailParams): string {
    const greeting = params.userName ? `Hi ${params.userName}` : 'Hello';

    const expirationRow = params.expiresAt
      ? `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Expires:</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${params.expiresAt.toLocaleDateString('en-US', { dateStyle: 'long' })}</td>
    </tr>`
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 28px;">Welcome to The Backstage!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your ${params.planName} subscription is now active</p>
  </div>

  <p style="margin-bottom: 15px; font-size: 16px;">${greeting},</p>

  <p style="margin-bottom: 20px;">Your subscription is now active and you're ready to start building your email campaigns.</p>

  <h2 style="color: #2563eb; margin-bottom: 15px; font-size: 20px;">Your Plan Features</h2>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: #f9fafb; border-radius: 6px; overflow: hidden;">
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Contacts Limit:</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${params.contactsLimit.toLocaleString()} contacts</td>
    </tr>
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Monthly Emails:</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${params.emailsLimit.toLocaleString()} emails</td>
    </tr>${expirationRow}
  </table>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${params.dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
  </div>

  <p style="margin-top: 30px; color: #6b7280;">If you have any questions, feel free to reach out to our support team.</p>

  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
    Best regards,<br>
    The Backstage Team
  </p>

  <p style="margin-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
    The Backstage - Email Marketing for Artists
  </p>
</body>
</html>
`.trim();
  }
}
