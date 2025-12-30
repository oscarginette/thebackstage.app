/**
 * useQuotaAccess Hook
 *
 * Checks if user has access to features based on quota limits and subscription status.
 * ADMIN BYPASS: Admins have unlimited access to all features.
 *
 * Clean Architecture: Presentation layer hook for UI state management.
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface QuotaInfo {
  currentContacts: number;
  maxContacts: number;
  currentEmails: number;
  maxEmails: number;
  subscriptionPlan: string;
  subscriptionExpiresAt: Date | null;
  quotaUsagePercent: {
    contacts: number;
    emails: number;
  };
}

interface UseQuotaAccessResult {
  loading: boolean;
  hasAccess: boolean;
  isExpired: boolean;
  isContactLimitReached: boolean;
  isEmailLimitReached: boolean;
  quotaInfo: QuotaInfo | null;
  error: string | null;
}

export function useQuotaAccess(): UseQuotaAccessResult {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ADMIN BYPASS: Admins have unlimited access
  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    fetchQuotaInfo();
  }, []);

  async function fetchQuotaInfo() {
    try {
      setLoading(true);
      const response = await fetch('/api/user/quota');

      if (!response.ok) {
        throw new Error('Failed to fetch quota information');
      }

      const data = await response.json();
      setQuotaInfo({
        ...data,
        subscriptionExpiresAt: data.subscriptionExpiresAt
          ? new Date(data.subscriptionExpiresAt)
          : null,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // ADMIN BYPASS: Admins never have restrictions
  if (isAdmin) {
    return {
      loading: false,
      hasAccess: true,
      isExpired: false,
      isContactLimitReached: false,
      isEmailLimitReached: false,
      quotaInfo,
      error,
    };
  }

  // Check if subscription has expired
  const isExpired =
    quotaInfo?.subscriptionExpiresAt !== null &&
    quotaInfo?.subscriptionExpiresAt !== undefined &&
    quotaInfo.subscriptionExpiresAt < new Date();

  // Check if contact limit is reached
  const isContactLimitReached =
    quotaInfo !== null && quotaInfo.currentContacts >= quotaInfo.maxContacts;

  // Check if email limit is reached
  const isEmailLimitReached =
    quotaInfo !== null &&
    quotaInfo.maxEmails < 999999999 &&
    quotaInfo.currentEmails >= quotaInfo.maxEmails;

  // User has access if subscription is not expired
  const hasAccess = !isExpired;

  return {
    loading,
    hasAccess,
    isExpired,
    isContactLimitReached,
    isEmailLimitReached,
    quotaInfo,
    error,
  };
}
