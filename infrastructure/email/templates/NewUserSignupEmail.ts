/**
 * NewUserSignupEmail Template
 *
 * Generates admin notification email for new user signups.
 * Plain text format for simplicity and deliverability.
 *
 * Clean Architecture: Infrastructure layer template.
 */

export interface NewUserSignupEmailParams {
  userEmail: string;
  userName?: string;
  signupDate: Date;
  adminPanelUrl: string;
}

export class NewUserSignupEmail {
  /**
   * Generate subject line for admin notification
   */
  static getSubject(params: NewUserSignupEmailParams): string {
    return `[The Backstage] New user signup: ${params.userEmail}`;
  }

  /**
   * Generate plain text email body
   */
  static getBody(params: NewUserSignupEmailParams): string {
    const formattedDate = params.signupDate.toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'UTC',
    });

    return `
New User Signup

A new user has registered for The Backstage:

Email: ${params.userEmail}
Name: ${params.userName || 'Not provided'}
Signup Date: ${formattedDate} UTC

View user details:
${params.adminPanelUrl}

---
The Backstage Admin Notification
`.trim();
  }

  /**
   * Generate HTML email body
   * Simple HTML structure for better rendering
   */
  static getHtml(params: NewUserSignupEmailParams): string {
    const formattedDate = params.signupDate.toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'UTC',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb; margin-bottom: 20px;">New User Signup</h2>

  <p style="margin-bottom: 15px;">A new user has registered for The Backstage:</p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Email:</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${params.userEmail}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Name:</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${params.userName || 'Not provided'}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Signup Date:</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formattedDate} UTC</td>
    </tr>
  </table>

  <a href="${params.adminPanelUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View User Details</a>

  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
    The Backstage Admin Notification
  </p>
</body>
</html>
`.trim();
  }
}
