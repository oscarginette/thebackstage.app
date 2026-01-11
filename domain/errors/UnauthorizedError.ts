/**
 * UnauthorizedError (Domain Layer Re-export)
 *
 * Re-exports UnauthorizedError from centralized error system.
 * Maintains Clean Architecture: Domain layer doesn't depend on infrastructure.
 *
 * Usage in domain layer:
 *   import { UnauthorizedError } from '@/domain/errors/UnauthorizedError';
 *   throw new UnauthorizedError('Authentication required');
 *
 * For new code, prefer importing directly from '@/lib/errors':
 *   import { UnauthorizedError } from '@/lib/errors';
 */

export { UnauthorizedError } from '@/lib/errors';
