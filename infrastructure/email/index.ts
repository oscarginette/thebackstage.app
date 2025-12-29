import { ResendEmailProvider } from './ResendEmailProvider';
import { getRequiredEnv } from '@/lib/env';

// Validate RESEND_API_KEY is set (fail fast)
const resendApiKey = getRequiredEnv('RESEND_API_KEY');

export const resendEmailProvider = new ResendEmailProvider(resendApiKey);
