/**
 * Environment Variable Validation
 *
 * Validates environment variables using Zod with build-time vs runtime awareness.
 * Provides type-safe access to environment variables throughout the application.
 *
 * ARCHITECTURE:
 * - Build-time validation: Only validates variables needed for Next.js compilation
 * - Runtime validation: Validates remaining variables when the app starts serving requests
 *
 * This prevents Vercel build failures when runtime-only secrets aren't set during build.
 *
 * BUILD-TIME REQUIREMENTS (must be set in Vercel):
 * - POSTGRES_URL: Required for Prisma schema generation during build
 *
 * RUNTIME-ONLY VARIABLES (validated when app starts):
 * - SENDER_EMAIL: Only needed when sending emails
 * - TOKEN_ENCRYPTION_KEY: Only needed when encrypting OAuth tokens
 * - RESEND_API_KEY: Only needed when sending emails via Resend
 * - All other service credentials (Stripe, Cloudinary, etc.)
 *
 * WHY THIS MATTERS:
 * During Vercel deployment, the build runs in a sandboxed environment without
 * access to runtime secrets. By deferring validation of runtime-only variables,
 * we allow the build to succeed while still ensuring security at runtime.
 */

import { z } from 'zod';

// Helper: Convert empty strings to undefined for truly optional fields
const optionalString = () => z.preprocess(
  (val) => (val === '' ? undefined : val),
  z.string().optional()
);

// Detect if we're in build mode (Next.js compilation)
// Note: process.argv is not available in Edge Runtime, so we only check NEXT_PHASE
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database (Required for build - Prisma needs it)
  POSTGRES_URL: z.string().url('Invalid POSTGRES_URL - must be a valid PostgreSQL URL'),

  // Database (Optional - Vercel-specific)
  POSTGRES_PRISMA_URL: z.preprocess((val) => (val === '' ? undefined : val), z.string().url().optional()),
  POSTGRES_URL_NO_SSL: z.preprocess((val) => (val === '' ? undefined : val), z.string().url().optional()),
  POSTGRES_URL_NON_POOLING: z.preprocess((val) => (val === '' ? undefined : val), z.string().url().optional()),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_HOST: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DATABASE: z.string().optional(),

  // NextAuth (Required for authentication at runtime)
  NEXTAUTH_URL: z.preprocess((val) => (val === '' ? undefined : val), z.string().url('Invalid NEXTAUTH_URL - must be a valid URL').optional()),
  NEXTAUTH_SECRET: z.preprocess((val) => (val === '' ? undefined : val), z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters for security').optional()),
  // Legacy: Accept AUTH_SECRET for backward compatibility (NextAuth v5)
  AUTH_SECRET: z.preprocess((val) => (val === '' ? undefined : val), z.string().min(32, 'AUTH_SECRET must be at least 32 characters for security').optional()),

  // Email Provider (Resend - Required for email functionality at runtime)
  RESEND_API_KEY: z.preprocess(
    (val) => (val === '' ? undefined : val),
    isBuildTime
      ? z.string().optional()  // Build: any string or undefined
      : z.string().startsWith('re_', 'Invalid Resend API key format - must start with re_').optional()
  ),
  SENDER_EMAIL: z.preprocess(
    (val) => (val === '' ? undefined : val),
    isBuildTime
      ? z.string().optional()  // Build: any string or undefined
      : z.string().email('Invalid SENDER_EMAIL - must be a valid email address').optional()
  ),

  // Email Recipients (JSON array)
  RECIPIENT_EMAILS: z.string().optional(),

  // Admin Configuration
  ADMIN_EMAIL: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().email().optional()
  ),
  ADMIN_SECRET: z.string().optional(),

  // Download Gates
  DOWNLOAD_TOKEN_SECRET: z.preprocess((val) => (val === '' ? undefined : val), z.string().min(32, 'DOWNLOAD_TOKEN_SECRET must be at least 32 characters').optional()),

  // Token Encryption (for storing OAuth tokens - Runtime only)
  TOKEN_ENCRYPTION_KEY: z.preprocess(
    (val) => (val === '' ? undefined : val),
    isBuildTime
      ? z.string().optional()  // Build: any string or undefined
      : z.string().length(64, 'TOKEN_ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes)').optional()
  ),

  // Cron Jobs
  CRON_SECRET: z.preprocess((val) => (val === '' ? undefined : val), z.string().min(32, 'CRON_SECRET must be at least 32 characters').optional()),

  // SoundCloud Configuration
  SOUNDCLOUD_USER_ID: z.string().optional(),
  SOUNDCLOUD_CLIENT_ID: z.string().optional(),
  SOUNDCLOUD_CLIENT_SECRET: z.string().optional(),
  SOUNDCLOUD_REDIRECT_URI: z.preprocess((val) => (val === '' ? undefined : val), z.string().url().optional()),

  // Spotify Configuration
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  SPOTIFY_REDIRECT_URI: z.preprocess((val) => (val === '' ? undefined : val), z.string().url().optional()),
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
  USE_MAILGUN: z.string().default('false').transform(val => val === 'true'),

  // Stripe (Payment Processing)
  STRIPE_SECRET_KEY: z.preprocess((val) => (val === '' ? undefined : val), z.string().startsWith('sk_', 'Invalid Stripe secret key - must start with sk_').optional()),
  STRIPE_PUBLISHABLE_KEY: z.preprocess((val) => (val === '' ? undefined : val), z.string().startsWith('pk_', 'Invalid Stripe publishable key - must start with pk_').optional()),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Application URLs
  NEXT_PUBLIC_APP_URL: z.preprocess((val) => (val === '' ? undefined : val), z.string().url('Invalid NEXT_PUBLIC_APP_URL - must be a valid URL').optional()),
  NEXT_PUBLIC_DASHBOARD_URL: z.preprocess((val) => (val === '' ? undefined : val), z.string().url('Invalid NEXT_PUBLIC_DASHBOARD_URL - must be a valid URL').optional()),
  BASE_URL: z.preprocess((val) => (val === '' ? undefined : val), z.string().url().optional()),

  // Feature Flags (transformed to boolean)
  ENABLE_SOUNDCLOUD_OAUTH: z.string().transform(val => val === 'true').optional(),
  ENABLE_SPOTIFY_OAUTH: z.string().transform(val => val === 'true').optional(),
  ENABLE_EMAIL_VERIFICATION: z.string().transform(val => val === 'true').optional(),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').optional(),
  ENABLE_EMAIL_TRACKING: z.string().transform(val => val === 'true').optional(),

  // Email Testing (temporary filter for campaign testing)
  // Client-accessible via NEXT_PUBLIC prefix
  NEXT_PUBLIC_TEST_EMAIL_ONLY: z.string().default('false').transform(val => val === 'true'),

  // Upstash Redis (Rate Limiting)
  UPSTASH_REDIS_REST_URL: z.preprocess((val) => (val === '' ? undefined : val), z.string().url('Invalid UPSTASH_REDIS_REST_URL - must be a valid URL').optional()),
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
    const errors = parsed.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    // During build, provide helpful context
    if (isBuildTime) {
      console.error('❌ Build-time environment validation failed:');
      for (const error of errors) {
        console.error(`  - ${error.path}: ${error.message}`);
      }
      console.error('\n💡 Tip: Make sure POSTGRES_URL is set in your Vercel project settings.');
      throw new Error('Build-time environment validation failed');
    }

    // At runtime, show detailed errors
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    console.error('\n📋 Missing or invalid variables:');
    for (const error of errors) {
      console.error(`  - ${error.path}: ${error.message}`);
    }

    throw new Error('Environment validation failed - check the errors above');
  }

  // Log build vs runtime mode for debugging
  if (isBuildTime) {
    console.log('✅ Build-time environment validation passed');
    console.log('   Runtime-only variables will be validated when the app starts.');
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

/**
 * Runtime-only validation helper
 *
 * Use this for variables that must be valid at runtime but aren't needed during build.
 * Provides additional validation beyond what was done at module load time.
 *
 * @example
 * const senderEmail = getRequiredRuntimeEnv('SENDER_EMAIL');
 * // Throws if SENDER_EMAIL is missing or invalid
 */
export function getRequiredRuntimeEnv<K extends keyof Env>(
  key: K,
  customValidator?: (value: NonNullable<Env[K]>) => boolean
): NonNullable<Env[K]> {
  const value = getRequiredEnv(key);

  // Additional runtime validation if provided
  if (customValidator && !customValidator(value)) {
    throw new Error(
      `Environment variable ${String(key)} failed runtime validation. ` +
      `This may indicate the variable was not properly validated during build.`
    );
  }

  return value;
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
