/**
 * Environment Variable Validation
 *
 * Validates all environment variables at startup using Zod.
 * Provides type-safe access to environment variables throughout the application.
 *
 * IMPORTANT: Import this file early in the application lifecycle to fail fast
 * if required environment variables are missing or invalid.
 */

import { z } from 'zod';

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database (Required for core functionality)
  POSTGRES_URL: z.string().url('Invalid POSTGRES_URL - must be a valid PostgreSQL URL'),

  // Database (Optional - Vercel-specific)
  POSTGRES_PRISMA_URL: z.string().url().optional(),
  POSTGRES_URL_NO_SSL: z.string().url().optional(),
  POSTGRES_URL_NON_POOLING: z.string().url().optional(),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_HOST: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DATABASE: z.string().optional(),

  // NextAuth (Required for authentication at runtime)
  NEXTAUTH_URL: z.string().url('Invalid NEXTAUTH_URL - must be a valid URL').optional(),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters for security').optional(),
  // Legacy: Accept AUTH_SECRET for backward compatibility (NextAuth v5)
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters for security').optional(),

  // Email Provider (Resend - Required for email functionality)
  RESEND_API_KEY: z.string().startsWith('re_', 'Invalid Resend API key format - must start with re_').optional(),
  SENDER_EMAIL: z.string().email('Invalid SENDER_EMAIL - must be a valid email address').optional(),

  // Email Recipients (JSON array)
  RECIPIENT_EMAILS: z.string().optional(),

  // Admin Configuration
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_SECRET: z.string().optional(),

  // Download Gates
  DOWNLOAD_TOKEN_SECRET: z.string().min(32, 'DOWNLOAD_TOKEN_SECRET must be at least 32 characters').optional(),

  // Token Encryption (for storing OAuth tokens)
  TOKEN_ENCRYPTION_KEY: z.string().length(64, 'TOKEN_ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes)').optional(),

  // Cron Jobs
  CRON_SECRET: z.string().min(32, 'CRON_SECRET must be at least 32 characters').optional(),

  // SoundCloud Configuration
  SOUNDCLOUD_USER_ID: z.string().optional(),
  SOUNDCLOUD_CLIENT_ID: z.string().optional(),
  SOUNDCLOUD_CLIENT_SECRET: z.string().optional(),
  SOUNDCLOUD_REDIRECT_URI: z.string().url().optional(),

  // Spotify Configuration
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  SPOTIFY_REDIRECT_URI: z.string().url().optional(),
  SPOTIFY_ARTIST_ID: z.string().optional(),

  // Cloudinary (Image Storage)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Webhooks
  RESEND_WEBHOOK_SECRET: z.string().optional(),

  // Mailgun Configuration
  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),
  MAILGUN_API_URL: z.string().url().default('https://api.mailgun.net'),
  MAILGUN_WEBHOOK_SIGNING_KEY: z.string().optional(),
  USE_MAILGUN: z.string().transform(val => val === 'true').default('false'),

  // Stripe (Payment Processing)
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'Invalid Stripe secret key - must start with sk_').optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'Invalid Stripe publishable key - must start with pk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Application URLs
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid NEXT_PUBLIC_APP_URL - must be a valid URL').optional(),
  BASE_URL: z.string().url().optional(),

  // Feature Flags (transformed to boolean)
  ENABLE_SOUNDCLOUD_OAUTH: z.string().transform(val => val === 'true').optional(),
  ENABLE_SPOTIFY_OAUTH: z.string().transform(val => val === 'true').optional(),
  ENABLE_EMAIL_VERIFICATION: z.string().transform(val => val === 'true').optional(),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').optional(),
  ENABLE_EMAIL_TRACKING: z.string().transform(val => val === 'true').optional(),

  // Upstash Redis (Rate Limiting)
  UPSTASH_REDIS_REST_URL: z.string().url('Invalid UPSTASH_REDIS_REST_URL - must be a valid URL').optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Legacy/Deprecated (for backward compatibility)
  BREVO_API_KEY: z.string().optional(),
  BREVO_TEMPLATE_ID: z.string().optional(),
  POSTMARK_API_KEY: z.string().optional(),
  POSTMARK_TEMPLATE_ID: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));

    // Extract field-level errors for clearer messaging
    const errors = parsed.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    console.error('\n📋 Missing or invalid variables:');
    for (const error of errors) {
      console.error(`  - ${error.path}: ${error.message}`);
    }

    throw new Error('Environment validation failed - check the errors above');
  }

  return parsed.data;
}

// Validate on module load (fail fast at startup)
export const env = validateEnv();

// Helper to access environment variables (typed and validated)
export function getEnv<K extends keyof Env>(key: K): Env[K] {
  return env[key];
}

// Helper for required variables (throws if undefined)
export function getRequiredEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = env[key];
  if (value === undefined || value === null) {
    throw new Error(`Required environment variable ${String(key)} is not set`);
  }
  return value as NonNullable<Env[K]>;
}

// Environment-specific helpers
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Database helpers
export const isLocalPostgres = (): boolean => {
  if (!env.POSTGRES_URL) return false;

  // Local PostgreSQL typically:
  // - Doesn't include password (localhost without auth)
  // - Doesn't include Neon/Vercel cloud providers
  // - Uses localhost or 127.0.0.1
  return (
    (!env.POSTGRES_URL.includes(':@') || env.POSTGRES_URL.includes('localhost') || env.POSTGRES_URL.includes('127.0.0.1')) &&
    !env.POSTGRES_URL.includes('neon.tech') &&
    !env.POSTGRES_URL.includes('.vercel-storage.')
  );
};

// URL helpers
export const getAppUrl = (): string => {
  return env.NEXT_PUBLIC_APP_URL || 'https://thebackstage.app';
};

export const getBaseUrl = (): string => {
  return env.BASE_URL || env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
};
