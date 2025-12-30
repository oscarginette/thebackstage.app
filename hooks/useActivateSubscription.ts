/**
 * useActivateSubscription Hook
 *
 * Custom hook for managing subscription activation workflow.
 * Handles API communication, loading state, and error handling.
 *
 * Clean Architecture: Presentation layer (UI) hook
 * SOLID: Single Responsibility - Only manages activation state and API calls
 */

import { useState } from 'react';

interface ActivateSubscriptionParams {
  userIds: number[];
  plan: string;
  billingCycle: 'monthly' | 'annual';
  durationMonths: number;
}

interface ActivateSubscriptionResult {
  success: boolean;
  activatedCount: number;
  successCount: number;
  failedCount: number;
  errors?: Array<{ userId: number; error: string }>;
}

interface UseActivateSubscriptionReturn {
  activate: (params: ActivateSubscriptionParams) => Promise<ActivateSubscriptionResult>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for activating user subscriptions
 *
 * @example
 * const { activate, loading, error } = useActivateSubscription();
 *
 * const handleActivate = async () => {
 *   const result = await activate({
 *     userIds: [1, 2, 3],
 *     plan: 'pro',
 *     billingCycle: 'monthly',
 *     durationMonths: 12
 *   });
 *
 *   if (result.success) {
 *     console.log(`Activated ${result.activatedCount} users`);
 *   }
 * };
 */
export function useActivateSubscription(): UseActivateSubscriptionReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activate = async (
    params: ActivateSubscriptionParams
  ): Promise<ActivateSubscriptionResult> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/users/bulk-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: params.userIds,
          plan: params.plan,
          billingCycle: params.billingCycle,
          durationMonths: params.durationMonths,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to activate users');
      }

      const data: ActivateSubscriptionResult = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate users';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    activate,
    loading,
    error,
  };
}
