/**
 * DownloadReadyEmail Template
 *
 * Sends download link after all verifications complete.
 * Includes direct download link with expiration info.
 *
 * Clean Architecture: Infrastructure layer template.
 */

export interface DownloadReadyEmailParams {
  trackTitle: string;
  artistName: string;
  downloadUrl: string;
  expiryHours: number;
  fileType?: string | null;
  fileSizeMb?: number | null;
}

export class DownloadReadyEmail {
  /**
   * Generate subject line
   */
  static getSubject(trackTitle: string): string {
    return `Your Download is Ready: ${trackTitle}`;
  }

  /**
   * Generate plain text email body
   */
  static getBody(params: DownloadReadyEmailParams): string {
    const fileInfo =
      params.fileType && params.fileSizeMb
        ? `${params.fileType.toUpperCase()} - ${params.fileSizeMb}MB`
        : '';

    return `
Your Download is Ready!

"${params.trackTitle}" by ${params.artistName}
${fileInfo}

Click the link below to download your track:
${params.downloadUrl}

This link will expire in ${params.expiryHours} hour${params.expiryHours !== 1 ? 's' : ''}.

Thanks for supporting ${params.artistName}!

---
The Backstage
https://thebackstage.app
`.trim();
  }

  /**
   * Generate HTML email body
   */
  static getHtml(params: DownloadReadyEmailParams): string {
    const fileInfo =
      params.fileType && params.fileSizeMb
        ? `<p style="margin-bottom: 20px; font-size: 14px; color: #666;">
        <strong>Format:</strong> ${params.fileType.toUpperCase()} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Size:</strong> ${params.fileSizeMb}MB
      </p>`
        : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Hero gradient -->
    <div style="background: linear-gradient(135deg, #FF5500 0%, #FF8C42 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 30px;">
      <h1 style="margin: 0; font-size: 28px;">Your Download is Ready!</h1>
    </div>

    <h2 style="color: #FF5500; margin-bottom: 12px; font-size: 22px;">${params.trackTitle}</h2>
    <p style="margin-bottom: 20px; font-size: 16px; color: #666;">
      by <strong>${params.artistName}</strong>
    </p>

    ${fileInfo}

    <div style="text-align: center; margin: 40px 0;">
      <a href="${params.downloadUrl}"
         style="display: inline-block;
                background-color: #FF5500;
                color: white;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;">
        Download Track
      </a>
    </div>

    <p style="margin-bottom: 20px; font-size: 14px; color: #666;">
      This link will expire in <strong>${params.expiryHours} hour${params.expiryHours !== 1 ? 's' : ''}</strong>.
    </p>

    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
      <p style="margin-bottom: 12px; font-size: 14px; color: #666;">
        Thanks for supporting ${params.artistName}!
      </p>
      <p style="margin-bottom: 0; font-size: 14px; color: #666;">
        Enjoy the music and feel free to share it with your friends.
      </p>
    </div>

    <p style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center;">
      The Backstage<br>
      <a href="https://thebackstage.app" style="color: #FF5500; text-decoration: none;">thebackstage.app</a>
    </p>
  </div>

  <p style="margin-top: 20px; text-align: center; font-size: 12px; color: #999;">
    If the button doesn't work, copy and paste this link into your browser:<br>
    <a href="${params.downloadUrl}" style="color: #666; word-break: break-all;">${params.downloadUrl}</a>
  </p>
</body>
</html>
`.trim();
  }
}
