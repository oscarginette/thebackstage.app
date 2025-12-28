/**
 * Subscription Type Definitions
 *
 * Type definitions for the subscription and pricing system.
 * Used across domain entities and repositories.
 *
 * Clean Architecture: Domain types with no external dependencies.
 */

/**
 * Subscription plan tiers
 * - free: 100 contacts, 500 emails/month
 * - pro: 1,000 contacts, 5,000 emails/month
 * - business: 5,000 contacts, 25,000 emails/month
 * - unlimited: 10,000+ contacts, unlimited emails
 */
export type SubscriptionPlanName = 'free' | 'pro' | 'business' | 'unlimited';

/**
 * Pricing plan definition
 * Represents a subscription tier with its limits and pricing
 */
export interface PricingPlan {
  id: number;
  name: SubscriptionPlanName;
  displayName: string;
  maxContacts: number;
  maxMonthlyEmails: number;
  priceMonthly: number; // in cents (e.g., 999 = $9.99)
  priceYearly: number; // in cents
  features: string[];
  active: boolean;
  createdAt: Date;
}

/**
 * Subscription history entry
 * Audit trail for subscription changes (GDPR compliance)
 */
export interface SubscriptionHistory {
  id: number;
  userId: number;
  action: SubscriptionAction;
  planName: SubscriptionPlanName;
  previousPlanName?: SubscriptionPlanName;
  durationMonths?: number;
  startDate?: Date;
  expiresAt?: Date;
  notes?: string;
  changedBy?: number; // Admin user ID who made the change
  ipAddress?: string;
  timestamp: Date;
}

/**
 * Subscription action types
 */
export type SubscriptionAction =
  | 'activated'
  | 'upgraded'
  | 'downgraded'
  | 'renewed'
  | 'cancelled'
  | 'expired'
  | 'suspended';

/**
 * Input for creating subscription history record
 */
export interface CreateSubscriptionHistoryInput {
  userId: number;
  action: SubscriptionAction;
  planName: SubscriptionPlanName;
  previousPlanName?: SubscriptionPlanName;
  durationMonths?: number;
  startDate?: Date;
  expiresAt?: Date;
  notes?: string;
  changedBy?: number;
  ipAddress?: string;
}

/**
 * Input for updating user subscription
 */
export interface UpdateSubscriptionInput {
  subscriptionPlan: SubscriptionPlanName;
  subscriptionStartedAt: Date;
  subscriptionExpiresAt?: Date;
  maxContacts: number;
  maxMonthlyEmails: number;
}

/**
 * Quota check result for contacts
 */
export interface ContactQuotaCheck {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
}

/**
 * Quota check result for emails
 */
export interface EmailQuotaCheck {
  allowed: boolean;
  currentCount: number;
  limit: number;
  wouldExceedBy: number;
}
