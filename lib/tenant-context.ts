/**
 * Tenant Context Helper
 *
 * Extracts tenant (user) information from authenticated session.
 * Used in API routes to identify which user is making the request.
 *
 * Multi-tenant Architecture:
 * - Each user operates in their own isolated tenant context
 * - All database queries must be scoped to the current tenant (userId)
 * - Prevents cross-tenant data access (security)
 *
 * Usage in API routes:
 * ```typescript
 * const { userId, userEmail, role } = await getTenantContext();
 * // Now query only this user's data
 * ```
 */

import { auth } from './auth';
import { UserRole } from '@/domain/types/user-roles';

export interface TenantContext {
  userId: number;
  userEmail: string;
  role: UserRole;
}

/**
 * Get tenant context from authenticated session
 *
 * SECURITY: This function throws an error if no session exists.
 * Always use this in protected API routes.
 *
 * @throws Error if not authenticated
 * @returns TenantContext with userId, userEmail, role
 */
export async function getTenantContext(): Promise<TenantContext> {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error('Unauthorized: No active session');
  }

  if (!session.user.id || !session.user.email) {
    throw new Error('Unauthorized: Invalid session data');
  }

  const userId = parseInt(session.user.id);
  if (isNaN(userId) || userId <= 0) {
    throw new Error('Unauthorized: Invalid user ID');
  }

  return {
    userId,
    userEmail: session.user.email,
    role: session.user.role || 'user',
  };
}

/**
 * Get tenant context without throwing
 * Returns null if not authenticated
 *
 * Use this when authentication is optional
 *
 * @returns TenantContext or null
 */
export async function getTenantContextOrNull(): Promise<TenantContext | null> {
  try {
    return await getTenantContext();
  } catch {
    return null;
  }
}

/**
 * Check if current user is admin
 *
 * @throws Error if not authenticated
 * @returns True if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const context = await getTenantContext();
  const { USER_ROLES } = await import('@/domain/types/user-roles');
  return context.role === USER_ROLES.ADMIN;
}

/**
 * Require admin role
 * Throws error if not admin
 *
 * Use this at the start of admin-only API routes:
 * ```typescript
 * await requireAdmin();
 * // Rest of admin logic...
 * ```
 *
 * @throws Error if not authenticated or not admin
 */
export async function requireAdmin(): Promise<void> {
  const context = await getTenantContext();
  const { USER_ROLES } = await import('@/domain/types/user-roles');
  if (context.role !== USER_ROLES.ADMIN) {
    throw new Error('Forbidden: Admin access required');
  }
}
