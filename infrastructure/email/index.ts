import { ResendEmailProvider } from './ResendEmailProvider';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined');
}

export const resendEmailProvider = new ResendEmailProvider(process.env.RESEND_API_KEY);
