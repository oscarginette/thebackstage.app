/**
 * Rate Limiting Configuration
 *
 * Infrastructure layer component for DDoS, brute force, and abuse protection.
 * Uses Upstash Redis (Vercel KV) for distributed rate limiting across serverless functions.
 *
 * Clean Architecture: This is an infrastructure concern, NOT business logic.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create Vercel KV (Redis) instance:
 *    - Go to Vercel Dashboard > Storage > Create Database > KV
 *    - Or: https://vercel.com/docs/storage/vercel-kv/quickstart
 *
 * 2. Copy environment variables to .env.local:
 *    UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
 *    UPSTASH_REDIS_REST_TOKEN=xxx
 *
 * 3. Install dependencies (if not already installed):
 *    npm install @upstash/ratelimit @upstash/redis
 *
 * TESTING:
 * Test rate limiting locally with curl:
 *
 * ```bash
 * # Test public endpoint (10 req/1min):
 * for i in {1..12}; do
 *   curl -X POST http://localhost:3002/api/auth/signup \
 *     -H "Content-Type: application/json" \
 *     -d "{\"email\":\"test$i@example.com\",\"password\":\"password123\"}" \
 *     -v 2>&1 | grep -E "HTTP|X-RateLimit"
 *   sleep 1
 * done
 *
 * # Test webhook endpoint (1000 req/1min):
 * for i in {1..1001}; do
 *   curl -X POST http://localhost:3002/api/webhooks/resend \
 *     -H "Content-Type: application/json" \
 *     -d '{"type":"email.sent","data":{}}' \
 *     -v 2>&1 | grep -E "HTTP|X-RateLimit"
 * done
 *
 * # Test authenticated endpoint (100 req/1min - requires auth cookie):
 * for i in {1..101}; do
 *   curl http://localhost:3002/api/contacts \
 *     -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
 *     -v 2>&1 | grep -E "HTTP|X-RateLimit"
 * done
 * ```
 *
 * Expected behavior:
 * - First N requests: 200 OK with X-RateLimit-Remaining decreasing
 * - After limit: 429 Too Many Requests with Retry-After header
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';

// Rate limit configurations per endpoint type
export const RATE_LIMITS = {
  // Public endpoints (login, signup): Prevent brute force attacks
  // By IP address to prevent credential stuffing
  public: {
    requests: 10,
    window: '1 m', // 1 minute
    description: 'Public endpoints (signup, login) - per IP',
  },

  // Authenticated endpoints: General API protection
  // By user ID to prevent abuse from authenticated users
  authenticated: {
    requests: 100,
    window: '1 m', // 1 minute
    description: 'Authenticated API endpoints - per user',
  },

  // Email sending: Stricter limit to prevent spam
  // By user ID to prevent email abuse
  email: {
    requests: 10,
    window: '1 m', // 1 minute
    description: 'Email sending endpoints (per authenticated user)',
  },

  // Webhooks: Very high limit for legitimate webhook providers
  // By endpoint to allow high-volume webhook traffic
  webhook: {
    requests: 1000,
    window: '1 m', // 1 minute
    description: 'Webhook endpoints (Resend, Stripe, Mailgun, etc.)',
  },

  // Admin endpoints: Very high limit or no limit
  // By user ID to allow admin operations without restriction
  admin: {
    requests: 10000,
    window: '1 m', // 1 minute (effectively no limit)
    description: 'Admin endpoints - minimal restrictions',
  },
} as const;

/**
 * Creates Redis client for Upstash
 *
 * Uses REST API (not TCP) for serverless compatibility.
 * Environment variables are auto-provided by Vercel KV.
 */
function createRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Graceful degradation: If Redis not configured, return null
  // Middleware will skip rate limiting (useful for local development without Redis)
  if (!url || !token) {
    console.warn(
      '⚠️  Rate limiting disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set'
    );
    return null;
  }

  return new Redis({
    url,
    token,
  });
}

// Singleton Redis client
const redis = createRedisClient();

/**
 * Creates rate limiter instances per endpoint type
 *
 * Uses sliding window algorithm for precise rate limiting.
 * Keys are automatically prefixed with "@upstash/ratelimit" namespace.
 */
function createRateLimiters() {
  if (!redis) {
    return null;
  }

  return {
    public: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.public.requests,
        RATE_LIMITS.public.window
      ),
      prefix: 'ratelimit:public',
      analytics: true, // Enable Upstash analytics
    }),

    authenticated: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.authenticated.requests,
        RATE_LIMITS.authenticated.window
      ),
      prefix: 'ratelimit:authenticated',
      analytics: true,
    }),

    email: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.email.requests,
        RATE_LIMITS.email.window
      ),
      prefix: 'ratelimit:email',
      analytics: true,
    }),

    webhook: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.webhook.requests,
        RATE_LIMITS.webhook.window
      ),
      prefix: 'ratelimit:webhook',
      analytics: true,
    }),

    admin: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.admin.requests,
        RATE_LIMITS.admin.window
      ),
      prefix: 'ratelimit:admin',
      analytics: true,
    }),
  };
}

// Singleton rate limiter instances
const rateLimiters = createRateLimiters();

/**
 * Extracts client identifier from request
 *
 * Priority:
 * 1. Authenticated user ID (best for preventing multi-IP abuse)
 * 2. IP address from x-forwarded-for (Vercel provides this)
 * 3. IP address from x-real-ip (fallback)
 * 4. Default identifier (should never happen in production)
 *
 * Why user ID over IP?
 * - Prevents authenticated users from bypassing limits via VPN/proxies
 * - More accurate for user-specific limits (email sending)
 *
 * Why IP for unauthenticated?
 * - Standard practice for public endpoints
 * - Works with Vercel's edge network
 */
export function getClientIdentifier(
  request: NextRequest,
  userId?: string
): string {
  // Prefer authenticated user ID for user-specific limits
  if (userId) {
    return `user:${userId}`;
  }

  // Extract IP from Vercel's headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  const ip = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Determines rate limiter type based on request path and authentication status
 *
 * Pattern matching for endpoint categorization:
 * - /api/admin/* -> admin limiter (very high/no limit)
 * - /api/webhooks/* -> webhook limiter (high limit for providers)
 * - /api/send-custom-email, /api/send-track -> email limiter (strict, per user)
 * - /api/auth/signup, /api/auth/login -> public limiter (moderate, per IP)
 * - Everything else authenticated -> authenticated limiter (per user)
 * - Everything else unauthenticated -> public limiter (per IP)
 *
 * @param pathname - Request pathname
 * @param isAuthenticated - Whether user is authenticated
 * @returns Rate limiter type to use
 */
export function getRateLimiterType(
  pathname: string,
  isAuthenticated: boolean
): keyof typeof RATE_LIMITS {
  // Admin endpoints: Minimal restrictions for admin operations
  if (pathname.startsWith('/api/admin/')) {
    return 'admin';
  }

  // Webhook endpoints: High limit for legitimate webhook providers
  if (pathname.startsWith('/api/webhooks/') || pathname.startsWith('/api/webhook/')) {
    return 'webhook';
  }

  // Email sending endpoints: Strict limit to prevent spam/abuse
  if (
    pathname === '/api/send-custom-email' ||
    pathname === '/api/send-track' ||
    pathname === '/api/campaigns'
  ) {
    return 'email';
  }

  // Public auth endpoints: Moderate limit to prevent brute force (per IP)
  if (
    pathname === '/api/auth/signup' ||
    pathname.startsWith('/api/auth/signin') ||
    pathname.startsWith('/api/auth/callback')
  ) {
    return 'public';
  }

  // Authenticated endpoints: General limit per user
  if (isAuthenticated) {
    return 'authenticated';
  }

  // Unauthenticated endpoints: Moderate limit per IP
  return 'public';
}

/**
 * Rate limit result interface
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp (seconds)
  pending?: Promise<unknown>; // Background analytics
}

/**
 * Checks rate limit for a request
 *
 * @param request - Next.js request object
 * @param userId - Optional authenticated user ID
 * @returns Rate limit result with success, limit, remaining, reset
 *
 * Usage in API routes:
 * ```typescript
 * import { checkRateLimit } from '@/lib/rate-limit';
 *
 * export async function POST(request: NextRequest) {
 *   const { success, remaining, reset } = await checkRateLimit(request);
 *
 *   if (!success) {
 *     return NextResponse.json(
 *       { error: 'Too many requests' },
 *       {
 *         status: 429,
 *         headers: {
 *           'X-RateLimit-Remaining': '0',
 *           'X-RateLimit-Reset': reset.toString(),
 *           'Retry-After': Math.ceil((reset * 1000 - Date.now()) / 1000).toString(),
 *         },
 *       }
 *     );
 *   }
 *
 *   // Process request...
 * }
 * ```
 */
export async function checkRateLimit(
  request: NextRequest,
  userId?: string
): Promise<RateLimitResult> {
  // Graceful degradation: If rate limiters not configured, allow all requests
  if (!rateLimiters) {
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }

  const pathname = request.nextUrl.pathname;
  const isAuthenticated = !!userId;
  const limiterType = getRateLimiterType(pathname, isAuthenticated);
  const identifier = getClientIdentifier(request, userId);

  const limiter = rateLimiters[limiterType];
  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    pending: result.pending,
  };
}

/**
 * Creates rate limit headers for HTTP responses
 *
 * Standard headers (RFC 6585):
 * - X-RateLimit-Limit: Maximum requests allowed
 * - X-RateLimit-Remaining: Requests remaining in current window
 * - X-RateLimit-Reset: Unix timestamp when limit resets
 * - Retry-After: Seconds until client can retry (only on 429)
 */
export function createRateLimitHeaders(
  result: RateLimitResult,
  includeRetryAfter = false
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (includeRetryAfter && !result.success) {
    // Calculate seconds until reset
    const retryAfterSeconds = Math.ceil((result.reset * 1000 - Date.now()) / 1000);
    headers['Retry-After'] = Math.max(0, retryAfterSeconds).toString();
  }

  return headers;
}

/**
 * Creates a 429 Too Many Requests response
 *
 * Includes:
 * - Standard rate limit headers
 * - Retry-After header (seconds)
 * - User-friendly error message
 */
export function createRateLimitResponse(
  result: RateLimitResult
): Response {
  const retryAfterSeconds = Math.ceil((result.reset * 1000 - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${retryAfterSeconds} seconds.`,
      limit: result.limit,
      reset: result.reset,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...createRateLimitHeaders(result, true),
      },
    }
  );
}
