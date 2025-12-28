-- =====================================================
-- SUBSCRIPTION SYSTEM MIGRATION
-- Implements pricing plans with unlimited gates for all tiers
-- Date: 2025-12-29
-- =====================================================

-- =====================================================
-- 1. PRICING PLANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS pricing_plans (
  id SERIAL PRIMARY KEY,
  plan_name VARCHAR(50) UNIQUE NOT NULL,

  -- Pricing Metrics
  max_contacts INTEGER NOT NULL,
  max_monthly_emails INTEGER, -- NULL = unlimited
  price_monthly_eur DECIMAL(10, 2) NOT NULL,

  -- Features (JSONB for flexibility)
  features JSONB DEFAULT '[]'::jsonb,

  -- Status
  active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT check_plan_name CHECK (plan_name IN ('Free', 'Pro', 'Business', 'Unlimited')),
  CONSTRAINT check_positive_price CHECK (price_monthly_eur >= 0),
  CONSTRAINT check_positive_contacts CHECK (max_contacts > 0)
);

-- Indexes for pricing_plans
CREATE INDEX IF NOT EXISTS idx_pricing_plans_active ON pricing_plans(active);

COMMENT ON TABLE pricing_plans IS 'Subscription pricing tiers (Free, Pro, Business, Unlimited)';
COMMENT ON COLUMN pricing_plans.max_contacts IS 'Maximum number of contacts in database (main pricing metric)';
COMMENT ON COLUMN pricing_plans.max_monthly_emails IS 'Maximum emails per month (NULL = unlimited)';
COMMENT ON COLUMN pricing_plans.features IS 'JSON array of plan features for UI display';

-- =====================================================
-- 2. SUBSCRIPTION HISTORY TABLE (GDPR Audit Trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Change Details
  change_type VARCHAR(50) NOT NULL, -- 'plan_upgrade' | 'plan_downgrade' | 'quota_increase' | 'quota_decrease' | 'cancellation' | 'reactivation'

  -- Plan Changes
  old_plan VARCHAR(50),
  new_plan VARCHAR(50),

  -- Quota Changes (for custom adjustments)
  old_quota JSONB, -- { "max_contacts": 1000, "max_monthly_emails": 5000 }
  new_quota JSONB,

  -- Audit Trail (GDPR requirement)
  changed_by_user_id INTEGER REFERENCES users(id), -- NULL if system-initiated
  change_reason TEXT,
  ip_address VARCHAR(45), -- IPv6 support
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT check_change_type CHECK (change_type IN (
    'plan_upgrade',
    'plan_downgrade',
    'quota_increase',
    'quota_decrease',
    'cancellation',
    'reactivation',
    'trial_started',
    'trial_expired'
  ))
);

-- Indexes for subscription_history
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON subscription_history(created_at);
CREATE INDEX IF NOT EXISTS idx_subscription_history_change_type ON subscription_history(change_type);

COMMENT ON TABLE subscription_history IS 'GDPR-compliant audit trail for all subscription and quota changes';
COMMENT ON COLUMN subscription_history.changed_by_user_id IS 'Admin user who made the change (NULL if self-service or system)';
COMMENT ON COLUMN subscription_history.ip_address IS 'IP address of user when change was made (GDPR Article 30)';

-- =====================================================
-- 3. EXTEND USERS TABLE (Subscription Fields)
-- =====================================================

-- Add new subscription fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_contacts INTEGER DEFAULT 100;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_monthly_emails INTEGER DEFAULT 500;

-- Update subscription_plan constraint to include new tiers
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_subscription_plan;
ALTER TABLE users ADD CONSTRAINT check_subscription_plan
  CHECK (subscription_plan IN ('free', 'pro', 'business', 'unlimited'));

-- Indexes for subscription fields
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_users_subscription_expires_at ON users(subscription_expires_at);

COMMENT ON COLUMN users.subscription_started_at IS 'When current subscription started (billing cycle start)';
COMMENT ON COLUMN users.subscription_expires_at IS 'When subscription expires (NULL = active, no expiry)';
COMMENT ON COLUMN users.max_contacts IS 'Maximum contacts allowed (main pricing metric)';
COMMENT ON COLUMN users.max_monthly_emails IS 'Maximum emails per month (cost-critical metric)';

-- =====================================================
-- 4. SEED PRICING PLANS
-- =====================================================

INSERT INTO pricing_plans (plan_name, max_contacts, max_monthly_emails, price_monthly_eur, features)
VALUES
  (
    'Free',
    100,
    500,
    0.00,
    '[
      "100 contacts",
      "500 emails/month",
      "Unlimited download gates",
      "Email tracking",
      "Basic analytics"
    ]'::jsonb
  ),
  (
    'Pro',
    1000,
    5000,
    9.99,
    '[
      "1,000 contacts",
      "5,000 emails/month",
      "Unlimited download gates",
      "Advanced email tracking",
      "Campaign analytics",
      "Email templates",
      "Priority support"
    ]'::jsonb
  ),
  (
    'Business',
    5000,
    25000,
    29.99,
    '[
      "5,000 contacts",
      "25,000 emails/month",
      "Unlimited download gates",
      "Advanced email tracking",
      "Campaign analytics",
      "Email templates",
      "Custom branding",
      "API access",
      "Priority support"
    ]'::jsonb
  ),
  (
    'Unlimited',
    10000,
    NULL, -- Unlimited emails
    49.99,
    '[
      "10,000+ contacts",
      "Unlimited emails/month",
      "Unlimited download gates",
      "Advanced email tracking",
      "Campaign analytics",
      "Email templates",
      "Custom branding",
      "API access",
      "White-label options",
      "Dedicated account manager",
      "24/7 priority support"
    ]'::jsonb
  )
ON CONFLICT (plan_name) DO UPDATE SET
  max_contacts = EXCLUDED.max_contacts,
  max_monthly_emails = EXCLUDED.max_monthly_emails,
  price_monthly_eur = EXCLUDED.price_monthly_eur,
  features = EXCLUDED.features,
  updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- 5. UPDATE EXISTING USERS WITH SUBSCRIPTION DEFAULTS
-- =====================================================

-- Update Free tier users
UPDATE users
SET
  max_contacts = 100,
  max_monthly_emails = 500
WHERE subscription_plan = 'free';

-- Update Pro tier users
UPDATE users
SET
  max_contacts = 1000,
  max_monthly_emails = 5000
WHERE subscription_plan = 'pro';

-- Update Unlimited tier users (admins)
UPDATE users
SET
  max_contacts = 10000,
  max_monthly_emails = NULL -- Unlimited
WHERE subscription_plan = 'unlimited';

-- =====================================================
-- 6. TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Apply to pricing_plans table
DROP TRIGGER IF EXISTS update_pricing_plans_updated_at ON pricing_plans;
CREATE TRIGGER update_pricing_plans_updated_at
  BEFORE UPDATE ON pricing_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. HELPER VIEWS FOR SUBSCRIPTION MANAGEMENT
-- =====================================================

-- View: User subscription overview
CREATE OR REPLACE VIEW user_subscription_overview AS
SELECT
  u.id,
  u.email,
  u.name,
  u.subscription_plan,
  u.max_contacts,
  u.max_monthly_emails,
  u.emails_sent_this_month,
  u.subscription_started_at,
  u.subscription_expires_at,
  pp.price_monthly_eur,
  pp.features,
  (SELECT COUNT(*) FROM contacts WHERE user_id = u.id AND subscribed = true) as current_contacts,
  CASE
    WHEN u.max_monthly_emails IS NULL THEN 0 -- Unlimited
    WHEN u.emails_sent_this_month >= u.max_monthly_emails THEN 100
    ELSE ROUND((u.emails_sent_this_month::DECIMAL / u.max_monthly_emails::DECIMAL) * 100)
  END as email_quota_usage_percent,
  CASE
    WHEN (SELECT COUNT(*) FROM contacts WHERE user_id = u.id AND subscribed = true) >= u.max_contacts
    THEN true
    ELSE false
  END as at_contact_limit
FROM users u
LEFT JOIN pricing_plans pp ON LOWER(u.subscription_plan) = LOWER(pp.plan_name)
WHERE u.role = 'artist'
ORDER BY u.created_at DESC;

COMMENT ON VIEW user_subscription_overview IS 'User subscription status with quota usage and limits';

-- View: Subscription change history per user
CREATE OR REPLACE VIEW user_subscription_changes AS
SELECT
  sh.id,
  sh.user_id,
  u.email,
  u.name,
  sh.change_type,
  sh.old_plan,
  sh.new_plan,
  sh.old_quota,
  sh.new_quota,
  sh.change_reason,
  sh.created_at,
  changed_by.email as changed_by_email
FROM subscription_history sh
JOIN users u ON sh.user_id = u.id
LEFT JOIN users changed_by ON sh.changed_by_user_id = changed_by.id
ORDER BY sh.created_at DESC;

COMMENT ON VIEW user_subscription_changes IS 'Complete audit trail of subscription changes with user details';

-- =====================================================
-- 8. VERIFICATION QUERIES (Run after migration)
-- =====================================================

-- Verify pricing_plans seeded
-- SELECT * FROM pricing_plans;

-- Verify users have subscription fields
-- SELECT id, email, subscription_plan, max_contacts, max_monthly_emails FROM users LIMIT 5;

-- Verify subscription_history table created
-- SELECT COUNT(*) FROM subscription_history;

-- Check user subscription overview
-- SELECT * FROM user_subscription_overview LIMIT 5;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Next steps:
-- 1. Run this migration: psql $POSTGRES_URL -f sql/migration-subscription-system.sql
-- 2. Verify tables: \d pricing_plans, \d subscription_history
-- 3. Check seeded plans: SELECT * FROM pricing_plans;
-- 4. Verify user fields: SELECT id, email, subscription_plan, max_contacts, max_monthly_emails FROM users;
-- 5. Test subscription changes and verify audit trail
