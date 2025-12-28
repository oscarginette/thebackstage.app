/**
 * PricingPlan Entity
 *
 * Domain entity representing subscription pricing tiers.
 * All plans include UNLIMITED download gates.
 * Pricing is based on max_contacts (main metric) and max_monthly_emails (cost metric).
 *
 * Clean Architecture: Domain entity with no external dependencies.
 * SOLID: Single Responsibility - Pricing plan data and validation only.
 */

export type PlanTier = 'free' | 'pro' | 'business' | 'unlimited';

export interface PricingPlanProps {
  id: number;
  planName: string;
  maxContacts: number;
  maxMonthlyEmails: number | null; // NULL = unlimited
  priceMonthlyEur: number;
  features: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PricingPlan {
  private constructor(private readonly props: PricingPlanProps) {
    this.validate();
  }

  private validate(): void {
    // Plan name validation
    const validPlanNames = ['Free', 'Pro', 'Business', 'Unlimited'];
    if (!validPlanNames.includes(this.props.planName)) {
      throw new Error(`Invalid plan name: must be one of ${validPlanNames.join(', ')}`);
    }

    // Max contacts validation (must be positive)
    if (!this.props.maxContacts || this.props.maxContacts <= 0) {
      throw new Error('Invalid maxContacts: must be greater than 0');
    }

    // Max monthly emails validation (must be positive or null for unlimited)
    if (this.props.maxMonthlyEmails !== null && this.props.maxMonthlyEmails <= 0) {
      throw new Error('Invalid maxMonthlyEmails: must be greater than 0 or null (unlimited)');
    }

    // Price validation (must be non-negative)
    if (this.props.priceMonthlyEur < 0) {
      throw new Error('Invalid priceMonthlyEur: must be non-negative');
    }

    // Features validation (must be array)
    if (!Array.isArray(this.props.features)) {
      throw new Error('Invalid features: must be an array');
    }
  }

  // Getters

  get id(): number {
    return this.props.id;
  }

  get planName(): string {
    return this.props.planName;
  }

  get maxContacts(): number {
    return this.props.maxContacts;
  }

  get maxMonthlyEmails(): number | null {
    return this.props.maxMonthlyEmails;
  }

  get priceMonthlyEur(): number {
    return this.props.priceMonthlyEur;
  }

  get features(): string[] {
    return [...this.props.features]; // Return copy to prevent mutation
  }

  get active(): boolean {
    return this.props.active;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods

  /**
   * Check if this is the Free tier
   */
  isFree(): boolean {
    return this.props.planName === 'Free';
  }

  /**
   * Check if this plan has unlimited emails
   */
  hasUnlimitedEmails(): boolean {
    return this.props.maxMonthlyEmails === null;
  }

  /**
   * Check if this plan supports a given number of contacts
   */
  supportsContactCount(contactCount: number): boolean {
    return contactCount <= this.props.maxContacts;
  }

  /**
   * Check if this plan supports a given email volume
   */
  supportsEmailVolume(emailCount: number): boolean {
    if (this.hasUnlimitedEmails()) {
      return true;
    }
    return emailCount <= (this.props.maxMonthlyEmails || 0);
  }

  /**
   * Get plan tier as lowercase enum value
   */
  getTier(): PlanTier {
    return this.props.planName.toLowerCase() as PlanTier;
  }

  /**
   * Get formatted price string
   */
  getFormattedPrice(): string {
    if (this.props.priceMonthlyEur === 0) {
      return 'Free';
    }
    return `€${this.props.priceMonthlyEur.toFixed(2)}/month`;
  }

  /**
   * Get formatted contact limit
   */
  getFormattedContactLimit(): string {
    if (this.props.maxContacts >= 10000) {
      return `${(this.props.maxContacts / 1000).toFixed(0)}K+ contacts`;
    }
    return `${this.props.maxContacts.toLocaleString()} contacts`;
  }

  /**
   * Get formatted email limit
   */
  getFormattedEmailLimit(): string {
    if (this.hasUnlimitedEmails()) {
      return 'Unlimited emails/month';
    }
    const emails = this.props.maxMonthlyEmails || 0;
    if (emails >= 1000) {
      return `${(emails / 1000).toFixed(0)}K emails/month`;
    }
    return `${emails.toLocaleString()} emails/month`;
  }

  /**
   * Compare this plan to another (for upgrades/downgrades)
   * Returns: 1 if this plan is higher tier, -1 if lower, 0 if equal
   */
  compareTier(otherPlan: PricingPlan): number {
    const tierOrder: Record<string, number> = {
      'Free': 0,
      'Pro': 1,
      'Business': 2,
      'Unlimited': 3
    };

    const thisTier = tierOrder[this.props.planName];
    const otherTier = tierOrder[otherPlan.planName];

    if (thisTier > otherTier) return 1;
    if (thisTier < otherTier) return -1;
    return 0;
  }

  /**
   * Check if upgrading from current plan to target plan
   */
  isUpgradeTo(targetPlan: PricingPlan): boolean {
    return this.compareTier(targetPlan) < 0;
  }

  /**
   * Check if downgrading from current plan to target plan
   */
  isDowngradeTo(targetPlan: PricingPlan): boolean {
    return this.compareTier(targetPlan) > 0;
  }

  /**
   * Return plan data as plain object (for API responses)
   */
  toJSON(): {
    id: number;
    planName: string;
    tier: PlanTier;
    maxContacts: number;
    maxMonthlyEmails: number | null;
    priceMonthlyEur: number;
    features: string[];
    active: boolean;
    formattedPrice: string;
    formattedContactLimit: string;
    formattedEmailLimit: string;
  } {
    return {
      id: this.props.id,
      planName: this.props.planName,
      tier: this.getTier(),
      maxContacts: this.props.maxContacts,
      maxMonthlyEmails: this.props.maxMonthlyEmails,
      priceMonthlyEur: this.props.priceMonthlyEur,
      features: this.features,
      active: this.props.active,
      formattedPrice: this.getFormattedPrice(),
      formattedContactLimit: this.getFormattedContactLimit(),
      formattedEmailLimit: this.getFormattedEmailLimit()
    };
  }

  // Static factory methods

  /**
   * Create PricingPlan entity from database row
   * Used by repositories when fetching from database
   */
  static fromDatabase(
    id: number,
    planName: string,
    maxContacts: number,
    maxMonthlyEmails: number | null,
    priceMonthlyEur: number,
    features: string[] | any, // Handle JSONB
    active: boolean,
    createdAt: Date,
    updatedAt: Date
  ): PricingPlan {
    // Parse features if it's a JSONB string
    let parsedFeatures: string[] = [];
    if (typeof features === 'string') {
      try {
        parsedFeatures = JSON.parse(features);
      } catch {
        parsedFeatures = [];
      }
    } else if (Array.isArray(features)) {
      parsedFeatures = features;
    }

    return new PricingPlan({
      id,
      planName,
      maxContacts,
      maxMonthlyEmails,
      priceMonthlyEur,
      features: parsedFeatures,
      active,
      createdAt,
      updatedAt
    });
  }

  /**
   * Validate plan tier string
   * Used by use cases before querying plans
   */
  static validateTier(tier: string): { valid: boolean; error?: string } {
    const validTiers: PlanTier[] = ['free', 'pro', 'business', 'unlimited'];

    if (!tier || typeof tier !== 'string') {
      return { valid: false, error: 'Plan tier is required' };
    }

    const normalizedTier = tier.toLowerCase();
    if (!validTiers.includes(normalizedTier as PlanTier)) {
      return {
        valid: false,
        error: `Invalid plan tier. Must be one of: ${validTiers.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Get plan tier from plan name (case-insensitive)
   */
  static getPlanTierFromName(planName: string): PlanTier | null {
    const normalized = planName.toLowerCase();
    const validTiers: PlanTier[] = ['free', 'pro', 'business', 'unlimited'];

    if (validTiers.includes(normalized as PlanTier)) {
      return normalized as PlanTier;
    }

    return null;
  }

  /**
   * Get capitalized plan name from tier
   */
  static getPlanNameFromTier(tier: PlanTier): string {
    const tierMap: Record<PlanTier, string> = {
      'free': 'Free',
      'pro': 'Pro',
      'business': 'Business',
      'unlimited': 'Unlimited'
    };

    return tierMap[tier];
  }
}
