/**
 * IEmailProvider Interface
 *
 * Email provider abstraction for sending emails.
 * Implements Open/Closed Principle - easy to add new providers (Resend, SendGrid, Mailgun, etc).
 *
 * Clean Architecture: Domain layer interface.
 * SOLID Compliance: Dependency Inversion Principle - domain depends on abstraction.
 */

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string; // Reply-To header - responses go to this address
  tags?: Array<{ name: string; value: string }>; // Email provider tags for categorization
  unsubscribeUrl?: string; // For List-Unsubscribe header (CAN-SPAM compliance)
  headers?: Record<string, string>; // Custom email headers
}

export interface EmailResult {
  success: boolean;
  messageId?: string; // Email provider's message ID
  id?: string; // Alias for messageId (some providers use 'id')
  error?: string;
}

export interface IEmailProvider {
  /**
   * Send an email
   * @param params - Email parameters
   * @returns Result with success status and message ID
   */
  send(params: EmailParams): Promise<EmailResult>;
}
