export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string; // Reply-To header - responses go to this address
  tags?: Array<{ name: string; value: string }>;
  unsubscribeUrl?: string; // For List-Unsubscribe header (CAN-SPAM compliance)
}

export interface EmailResult {
  id?: string;
  success: boolean;
  error?: string;
}

export interface IEmailProvider {
  send(params: EmailParams): Promise<EmailResult>;
}
