export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface EmailResult {
  id?: string;
  success: boolean;
  error?: string;
}

export interface IEmailProvider {
  send(params: EmailParams): Promise<EmailResult>;
}
