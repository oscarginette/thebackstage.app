/**
 * DownloadGateConfirmationEmail Template
 *
 * Sends confirmation email after download gate form submission.
 * Includes next steps for verification and download.
 *
 * Clean Architecture: Infrastructure layer template.
 */

export interface DownloadGateConfirmationEmailParams {
  trackTitle: string;
  artistName: string;
  submissionId: string;
  requiresVerification: boolean;
  verificationUrl: string;
}

export class DownloadGateConfirmationEmail {
  /**
   * Generate subject line
   */
  static getSubject(trackTitle: string): string {
    return `Download "${trackTitle}" - Verification Required`;
  }

  /**
   * Generate plain text email body
   */
  static getBody(params: DownloadGateConfirmationEmailParams): string {
    return `
Thanks for your submission!

You're one step closer to downloading "${params.trackTitle}" by ${params.artistName}.

${
  params.requiresVerification
    ? `Complete the verification steps to get your download link:
${params.verificationUrl}`
    : 'Your download link will be sent shortly!'
}

Submission ID: ${params.submissionId}

---
The Backstage
https://thebackstage.app
`.trim();
  }

  /**
   * Generate HTML email body
   */
  static getHtml(params: DownloadGateConfirmationEmailParams): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #FF5500; margin-bottom: 24px; font-size: 24px;">Thanks for your submission!</h2>

    <p style="margin-bottom: 20px; font-size: 16px;">
      You're one step closer to downloading <strong>"${params.trackTitle}"</strong> by ${params.artistName}.
    </p>

    ${
      params.requiresVerification
        ? `
    <p style="margin-bottom: 30px; font-size: 16px;">
      Complete the verification steps to get your download link:
    </p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${params.verificationUrl}"
         style="display: inline-block;
                background-color: #FF5500;
                color: white;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;">
        Complete Verification
      </a>
    </div>
    `
        : `
    <p style="margin-bottom: 30px; font-size: 16px;">
      Your download link will be sent shortly!
    </p>
    `
    }

    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
      <p style="margin-bottom: 12px; font-size: 14px; color: #666;">
        <strong>Submission ID:</strong> ${params.submissionId}
      </p>
    </div>

    <p style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center;">
      The Backstage<br>
      <a href="https://thebackstage.app" style="color: #FF5500; text-decoration: none;">thebackstage.app</a>
    </p>
  </div>

  ${
    params.requiresVerification
      ? `
  <p style="margin-top: 20px; text-align: center; font-size: 12px; color: #999;">
    If the button doesn't work, copy and paste this link into your browser:<br>
    <a href="${params.verificationUrl}" style="color: #666; word-break: break-all;">${params.verificationUrl}</a>
  </p>
  `
      : ''
  }
</body>
</html>
`.trim();
  }
}
