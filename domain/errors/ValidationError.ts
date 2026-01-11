/**
 * ValidationError (Domain Layer Re-export)
 *
 * Re-exports ValidationError from centralized error system.
 * Maintains Clean Architecture: Domain layer doesn't depend on infrastructure.
 *
 * Usage in domain layer:
 *   import { ValidationError } from '@/domain/errors/ValidationError';
 *   throw new ValidationError('Email is required');
 *
 * For new code, prefer importing directly from '@/lib/errors':
 *   import { ValidationError } from '@/lib/errors';
 */

export { ValidationError } from '@/lib/errors';
