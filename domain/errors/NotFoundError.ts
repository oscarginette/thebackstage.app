/**
 * NotFoundError (Domain Layer Re-export)
 *
 * Re-exports NotFoundError from centralized error system.
 * Maintains Clean Architecture: Domain layer doesn't depend on infrastructure.
 *
 * Usage in domain layer:
 *   import { NotFoundError } from '@/domain/errors/NotFoundError';
 *   throw new NotFoundError('Campaign not found');
 *
 * For new code, prefer importing directly from '@/lib/errors':
 *   import { NotFoundError } from '@/lib/errors';
 */

export { NotFoundError } from '@/lib/errors';
