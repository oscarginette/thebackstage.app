/**
 * ForbiddenError (Domain Layer Re-export)
 *
 * Re-exports AccessDeniedError as ForbiddenError for backward compatibility.
 * Maintains Clean Architecture: Domain layer doesn't depend on infrastructure.
 *
 * Note: This is an alias for AccessDeniedError (same HTTP 403 status).
 *
 * Usage in domain layer:
 *   import { ForbiddenError } from '@/domain/errors/ForbiddenError';
 *   throw new ForbiddenError('Insufficient permissions');
 *
 * For new code, prefer importing AccessDeniedError from '@/lib/errors':
 *   import { AccessDeniedError } from '@/lib/errors';
 */

export { AccessDeniedError as ForbiddenError } from '@/lib/errors';
