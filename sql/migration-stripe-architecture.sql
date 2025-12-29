-- ============================================================
-- STRIPE-FIRST ARCHITECTURE MIGRATION
-- Date: 2025-12-29
-- Description: Complete redesign to match Stripe data model
-- WARNING: DESTRUCTIVE MIGRATION - drops existing tables
-- ============================================================

-- ============================================================
-- STEP 1: DROP OLD TABLES (if they exist)
-- ============================================================

-- WARNING: This will delete all existing subscription data
-- Safe to run since no one is using the payment system yet

DROP TABLE IF EXISTS subscription_history CASCADE;
DROP TABLE IF EXISTS pricing_plans CASCADE;

-- ============================================================
-- STEP 2: CREATE PRODUCTS TABLE (Stripe equivalent)
-- ============================================================

CREATE TABLE products (
  -- Stripe-compatible fields
  id VARCHAR(255) PRIMARY KEY,  -- Format: prod_Pro, prod_Business (Stripe-like ID)
  object VARCHAR(50) DEFAULT 'product' NOT NULL,

  -- Product details
  name VARCHAR(255) NOT NULL,  -- "Pro", "Business", "Unlimited"
  description TEXT,
  active BOOLEAN DEFAULT true NOT NULL,

  -- Marketing features (Stripe marketing_features)
  marketing_features JSONB DEFAULT '[]'::jsonb,

  -- Custom metadata (Stripe metadata)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps (Unix epoch in Stripe, but we use PostgreSQL TIMESTAMP)
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- Internal
  livemode BOOLEAN DEFAULT false NOT NULL
);

CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_name ON products(name);

COMMENT ON TABLE products IS 'Products (Stripe-equivalent): represent subscription plans (Free, Pro, Business, Unlimited)';
COMMENT ON COLUMN products.id IS 'Stripe-compatible ID (e.g., prod_Pro) - will be actual Stripe Product ID when migrating';
COMMENT ON COLUMN products.marketing_features IS 'Array of {name: string} objects for display in pricing UI';
COMMENT ON COLUMN products.metadata IS 'Custom key-value pairs: max_contacts, max_monthly_emails, plan_tier';

-- ============================================================
-- STEP 3: CREATE PRICES TABLE (Stripe equivalent)
-- ============================================================

CREATE TABLE prices (
  -- Stripe-compatible fields
  id VARCHAR(255) PRIMARY KEY,  -- Format: price_ProMonthly, price_ProYearly
  object VARCHAR(50) DEFAULT 'price' NOT NULL,

  -- Product relationship
  product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Pricing
  active BOOLEAN DEFAULT true NOT NULL,
  currency VARCHAR(3) DEFAULT 'eur' NOT NULL,  -- ISO currency code
  unit_amount INTEGER NOT NULL,  -- Price in CENTS (999 = €9.99)
  unit_amount_decimal VARCHAR(50),  -- For precision (optional)

  -- Billing configuration
  type VARCHAR(20) DEFAULT 'recurring' NOT NULL,  -- 'one_time' | 'recurring'
  billing_scheme VARCHAR(20) DEFAULT 'per_unit',  -- 'per_unit' | 'tiered'

  -- Recurring config (Stripe recurring object)
  recurring_interval VARCHAR(10),  -- 'day' | 'week' | 'month' | 'year'
  recurring_interval_count INTEGER DEFAULT 1,  -- Every N intervals
  recurring_usage_type VARCHAR(20) DEFAULT 'licensed',  -- 'licensed' | 'metered'

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- Internal
  livemode BOOLEAN DEFAULT false NOT NULL,

  -- Constraints
  CONSTRAINT check_price_positive CHECK (unit_amount >= 0),
  CONSTRAINT check_recurring_interval CHECK (
    recurring_interval IN ('day', 'week', 'month', 'year') OR recurring_interval IS NULL
  ),
  CONSTRAINT check_type CHECK (type IN ('one_time', 'recurring'))
);

CREATE INDEX idx_prices_product ON prices(product_id);
CREATE INDEX idx_prices_active ON prices(active);
CREATE INDEX idx_prices_recurring_interval ON prices(recurring_interval);

COMMENT ON TABLE prices IS 'Prices (Stripe-equivalent): multiple prices per product (monthly, yearly, etc.)';
COMMENT ON COLUMN prices.unit_amount IS 'Price in CENTS (Stripe format): €9.99 = 999 cents';
COMMENT ON COLUMN prices.recurring_interval IS 'Billing frequency: month (monthly) or year (yearly)';
COMMENT ON COLUMN prices.metadata IS 'Custom data: billing_period, discount_percentage, monthly_equivalent';

-- ============================================================
-- STEP 4: CREATE SUBSCRIPTIONS TABLE (Stripe equivalent)
-- ============================================================

CREATE TABLE subscriptions (
  -- Stripe-compatible fields
  id VARCHAR(255) PRIMARY KEY,  -- Format: sub_xxxxx (will be Stripe ID later)
  object VARCHAR(50) DEFAULT 'subscription' NOT NULL,

  -- Customer relationship (user_id in our case)
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Status (Stripe enum values)
  status VARCHAR(50) NOT NULL DEFAULT 'active',

  -- Billing cycle
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  billing_cycle_anchor TIMESTAMP NOT NULL,

  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancel_at TIMESTAMP,
  canceled_at TIMESTAMP,
  ended_at TIMESTAMP,

  -- Trial
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,

  -- Timestamps
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  start_date TIMESTAMP NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Payment
  collection_method VARCHAR(20) DEFAULT 'charge_automatically',  -- 'charge_automatically' | 'send_invoice'

  -- Internal
  livemode BOOLEAN DEFAULT false NOT NULL,

  -- Constraints
  CONSTRAINT check_subscription_status CHECK (status IN (
    'incomplete', 'incomplete_expired', 'trialing',
    'active', 'past_due', 'canceled', 'unpaid', 'paused'
  ))
);

CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);

COMMENT ON TABLE subscriptions IS 'Subscriptions (Stripe-equivalent): user subscription state and billing cycles';
COMMENT ON COLUMN subscriptions.customer_id IS 'Reference to users.id (will map to Stripe Customer ID later)';
COMMENT ON COLUMN subscriptions.status IS 'Stripe status enum: active, canceled, past_due, etc.';
COMMENT ON COLUMN subscriptions.billing_cycle_anchor IS 'Fixed timestamp that aligns billing cycle dates';

-- ============================================================
-- STEP 5: CREATE SUBSCRIPTION_ITEMS TABLE (Stripe equivalent)
-- ============================================================

CREATE TABLE subscription_items (
  -- Stripe-compatible fields
  id VARCHAR(255) PRIMARY KEY,  -- Format: si_xxxxx
  object VARCHAR(50) DEFAULT 'subscription_item' NOT NULL,

  -- Relationships
  subscription_id VARCHAR(255) NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  price_id VARCHAR(255) NOT NULL REFERENCES prices(id) ON DELETE RESTRICT,

  -- Quantity
  quantity INTEGER DEFAULT 1 NOT NULL,

  -- Timestamps
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT check_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_subscription_items_subscription ON subscription_items(subscription_id);
CREATE INDEX idx_subscription_items_price ON subscription_items(price_id);

COMMENT ON TABLE subscription_items IS 'Subscription Items (Stripe-equivalent): links subscriptions to prices';
COMMENT ON COLUMN subscription_items.quantity IS 'Number of units (usually 1 for SaaS subscriptions)';

-- ============================================================
-- STEP 6: CREATE INVOICES TABLE (replaces subscription_history)
-- ============================================================

CREATE TABLE invoices (
  -- Stripe-compatible fields
  id VARCHAR(255) PRIMARY KEY,  -- Format: in_xxxxx
  object VARCHAR(50) DEFAULT 'invoice' NOT NULL,

  -- Relationships
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id VARCHAR(255) REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Amounts (in CENTS)
  amount_due INTEGER NOT NULL,
  amount_paid INTEGER DEFAULT 0,
  amount_remaining INTEGER DEFAULT 0,
  subtotal INTEGER NOT NULL,
  total INTEGER NOT NULL,
  tax INTEGER DEFAULT 0,

  -- Currency
  currency VARCHAR(3) DEFAULT 'eur' NOT NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'draft',  -- 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'

  -- Billing
  billing_reason VARCHAR(50),  -- 'subscription_create' | 'subscription_cycle' | 'subscription_update' | 'manual'

  -- Dates
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  due_date TIMESTAMP,

  -- Payment
  paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP,
  payment_intent_id VARCHAR(255),  -- For future Stripe integration

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  description TEXT,

  -- PDF
  invoice_pdf VARCHAR(500),  -- URL to generated PDF invoice
  hosted_invoice_url VARCHAR(500),  -- URL for customer to view invoice

  -- Internal
  livemode BOOLEAN DEFAULT false NOT NULL,

  -- Constraints
  CONSTRAINT check_invoice_status CHECK (status IN (
    'draft', 'open', 'paid', 'void', 'uncollectible'
  ))
);

CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created ON invoices(created);

COMMENT ON TABLE invoices IS 'Invoices (Stripe-equivalent): billing records and payment tracking';
COMMENT ON COLUMN invoices.billing_reason IS 'Why invoice was created: subscription_create, subscription_cycle, manual, etc.';
COMMENT ON COLUMN invoices.amount_due IS 'Total amount in CENTS (€9.99 = 999)';

-- ============================================================
-- STEP 7: CREATE EVENTS TABLE (Audit trail / Webhook events)
-- ============================================================

CREATE TABLE events (
  -- Stripe-compatible fields
  id VARCHAR(255) PRIMARY KEY,  -- Format: evt_xxxxx
  object VARCHAR(50) DEFAULT 'event' NOT NULL,

  -- Event details
  type VARCHAR(100) NOT NULL,  -- e.g., 'customer.subscription.created'

  -- Related object
  data_object_id VARCHAR(255),  -- ID of the object (subscription, invoice, etc.)
  data_object_type VARCHAR(50),  -- Type: 'subscription', 'invoice', etc.
  data JSONB NOT NULL,  -- Full JSON of the event data

  -- Timestamps
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- Internal
  livemode BOOLEAN DEFAULT false NOT NULL,

  -- API version (for future Stripe webhook compatibility)
  api_version VARCHAR(20) DEFAULT '2025-01-01',

  -- Processing
  pending_webhooks INTEGER DEFAULT 0,
  request_id VARCHAR(255)
);

CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_created ON events(created);
CREATE INDEX idx_events_data_object_id ON events(data_object_id);

COMMENT ON TABLE events IS 'Events (Stripe-equivalent): audit trail of all subscription/payment events';
COMMENT ON COLUMN events.type IS 'Event type: customer.subscription.created, invoice.paid, etc.';
COMMENT ON COLUMN events.data IS 'Full JSON snapshot of the changed object';

-- ============================================================
-- STEP 8: UPDATE USERS TABLE (Add Stripe fields)
-- ============================================================

-- Add Stripe Customer fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Add denormalized subscription fields (for performance)
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe Customer ID (cus_xxxxx) - null for manual subscriptions, populated when migrating to Stripe';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe Subscription ID (sub_xxxxx) - null for manual subscriptions';
COMMENT ON COLUMN users.subscription_status IS 'Denormalized subscription status for quick queries (synced from subscriptions table)';
COMMENT ON COLUMN users.current_period_end IS 'Denormalized subscription end date (synced from subscriptions table)';

-- ============================================================
-- STEP 9: SEED PRODUCTS (Stripe format)
-- ============================================================

INSERT INTO products (id, name, description, active, marketing_features, metadata, livemode)
VALUES
  (
    'prod_Free',
    'Free',
    'Free tier for testing and small projects',
    true,
    '[
      {"name": "100 contacts"},
      {"name": "500 emails/month"},
      {"name": "Unlimited download gates"},
      {"name": "Email tracking"},
      {"name": "Basic analytics"}
    ]'::jsonb,
    '{
      "max_contacts": "100",
      "max_monthly_emails": "500",
      "max_active_gates": "999999",
      "plan_tier": "0"
    }'::jsonb,
    false
  ),
  (
    'prod_Pro',
    'Pro',
    'Professional plan for growing artists',
    true,
    '[
      {"name": "5,000 contacts"},
      {"name": "10,000 emails/month"},
      {"name": "Unlimited download gates"},
      {"name": "Advanced email tracking"},
      {"name": "Campaign analytics"},
      {"name": "Email templates"},
      {"name": "Priority support"}
    ]'::jsonb,
    '{
      "max_contacts": "5000",
      "max_monthly_emails": "10000",
      "max_active_gates": "999999",
      "plan_tier": "1"
    }'::jsonb,
    false
  ),
  (
    'prod_Business',
    'Business',
    'Business plan for established artists and labels',
    true,
    '[
      {"name": "25,000 contacts"},
      {"name": "50,000 emails/month"},
      {"name": "Unlimited download gates"},
      {"name": "Advanced email tracking"},
      {"name": "Campaign analytics"},
      {"name": "Email templates"},
      {"name": "Custom branding"},
      {"name": "API access"},
      {"name": "Priority support"}
    ]'::jsonb,
    '{
      "max_contacts": "25000",
      "max_monthly_emails": "50000",
      "max_active_gates": "999999",
      "plan_tier": "2"
    }'::jsonb,
    false
  ),
  (
    'prod_Unlimited',
    'Unlimited',
    'Unlimited plan for large-scale operations',
    true,
    '[
      {"name": "100,000+ contacts"},
      {"name": "Unlimited emails/month"},
      {"name": "Unlimited download gates"},
      {"name": "Advanced email tracking"},
      {"name": "Campaign analytics"},
      {"name": "Email templates"},
      {"name": "Custom branding"},
      {"name": "API access"},
      {"name": "White-label options"},
      {"name": "Dedicated account manager"},
      {"name": "24/7 priority support"}
    ]'::jsonb,
    '{
      "max_contacts": "100000",
      "max_monthly_emails": "999999999",
      "max_active_gates": "999999",
      "plan_tier": "3"
    }'::jsonb,
    false
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 10: SEED PRICES (Monthly + Yearly for each product)
-- ============================================================

-- Free Plan Prices (monthly only, €0)
INSERT INTO prices (id, product_id, active, currency, unit_amount, type, recurring_interval, recurring_interval_count, metadata, livemode)
VALUES
  (
    'price_FreeMonthly',
    'prod_Free',
    true,
    'eur',
    0,  -- €0.00
    'recurring',
    'month',
    1,
    '{"billing_period": "monthly"}'::jsonb,
    false
  )
ON CONFLICT (id) DO NOTHING;

-- Pro Plan Prices
INSERT INTO prices (id, product_id, active, currency, unit_amount, type, recurring_interval, recurring_interval_count, metadata, livemode)
VALUES
  (
    'price_ProMonthly',
    'prod_Pro',
    true,
    'eur',
    999,  -- €9.99
    'recurring',
    'month',
    1,
    '{"billing_period": "monthly"}'::jsonb,
    false
  ),
  (
    'price_ProYearly',
    'prod_Pro',
    true,
    'eur',
    9590,  -- €95.90 (€9.99 * 12 * 0.8)
    'recurring',
    'year',
    1,
    '{
      "billing_period": "yearly",
      "discount_percentage": "20",
      "monthly_equivalent": "799",
      "savings_eur": "2398"
    }'::jsonb,
    false
  )
ON CONFLICT (id) DO NOTHING;

-- Business Plan Prices
INSERT INTO prices (id, product_id, active, currency, unit_amount, type, recurring_interval, recurring_interval_count, metadata, livemode)
VALUES
  (
    'price_BusinessMonthly',
    'prod_Business',
    true,
    'eur',
    2999,  -- €29.99
    'recurring',
    'month',
    1,
    '{"billing_period": "monthly"}'::jsonb,
    false
  ),
  (
    'price_BusinessYearly',
    'prod_Business',
    true,
    'eur',
    28790,  -- €287.90 (€29.99 * 12 * 0.8)
    'recurring',
    'year',
    1,
    '{
      "billing_period": "yearly",
      "discount_percentage": "20",
      "monthly_equivalent": "2399",
      "savings_eur": "7190"
    }'::jsonb,
    false
  )
ON CONFLICT (id) DO NOTHING;

-- Unlimited Plan Prices
INSERT INTO prices (id, product_id, active, currency, unit_amount, type, recurring_interval, recurring_interval_count, metadata, livemode)
VALUES
  (
    'price_UnlimitedMonthly',
    'prod_Unlimited',
    true,
    'eur',
    4999,  -- €49.99
    'recurring',
    'month',
    1,
    '{"billing_period": "monthly"}'::jsonb,
    false
  ),
  (
    'price_UnlimitedYearly',
    'prod_Unlimited',
    true,
    'eur',
    47990,  -- €479.90 (€49.99 * 12 * 0.8)
    'recurring',
    'year',
    1,
    '{
      "billing_period": "yearly",
      "discount_percentage": "20",
      "monthly_equivalent": "3999",
      "savings_eur": "11990"
    }'::jsonb,
    false
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 11: TRIGGERS FOR UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prices_updated_at ON prices;
CREATE TRIGGER update_prices_updated_at
  BEFORE UPDATE ON prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 12: HELPER VIEWS (Stripe-compatible)
-- ============================================================

-- View: Product pricing overview (with both monthly and yearly)
CREATE OR REPLACE VIEW product_pricing_overview AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.active AS product_active,
  p.metadata->>'max_contacts' AS max_contacts,
  p.metadata->>'max_monthly_emails' AS max_monthly_emails,

  -- Monthly price
  pm.id AS price_monthly_id,
  pm.unit_amount AS price_monthly_cents,
  ROUND(pm.unit_amount / 100.0, 2) AS price_monthly_eur,

  -- Yearly price
  py.id AS price_yearly_id,
  py.unit_amount AS price_yearly_cents,
  ROUND(py.unit_amount / 100.0, 2) AS price_yearly_eur,

  -- Discount calculation
  CASE
    WHEN pm.unit_amount > 0 THEN
      ROUND((1 - (py.unit_amount::DECIMAL / (pm.unit_amount * 12))) * 100, 0)
    ELSE 0
  END AS yearly_discount_percent,

  -- Savings
  CASE
    WHEN pm.unit_amount > 0 THEN
      ROUND((pm.unit_amount * 12 - py.unit_amount) / 100.0, 2)
    ELSE 0
  END AS yearly_savings_eur

FROM products p
LEFT JOIN prices pm ON p.id = pm.product_id AND pm.recurring_interval = 'month'
LEFT JOIN prices py ON p.id = py.product_id AND py.recurring_interval = 'year'
WHERE p.active = true
ORDER BY (p.metadata->>'plan_tier')::INTEGER;

COMMENT ON VIEW product_pricing_overview IS 'Product pricing with monthly/yearly comparison and discount calculations';

-- View: Active subscriptions with user details
CREATE OR REPLACE VIEW active_subscriptions_overview AS
SELECT
  s.id AS subscription_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,

  -- User details
  u.id AS user_id,
  u.email,
  u.name,

  -- Subscription item (price)
  si.price_id,
  pr.recurring_interval,
  ROUND(pr.unit_amount / 100.0, 2) AS price_eur,

  -- Product details
  prod.name AS product_name,
  prod.metadata->>'max_contacts' AS max_contacts,
  prod.metadata->>'max_monthly_emails' AS max_monthly_emails,

  -- Days until renewal
  EXTRACT(DAY FROM (s.current_period_end - CURRENT_TIMESTAMP)) AS days_until_renewal

FROM subscriptions s
JOIN users u ON s.customer_id = u.id
LEFT JOIN subscription_items si ON s.id = si.subscription_id
LEFT JOIN prices pr ON si.price_id = pr.id
LEFT JOIN products prod ON pr.product_id = prod.id
WHERE s.status IN ('active', 'trialing')
ORDER BY s.current_period_end ASC;

COMMENT ON VIEW active_subscriptions_overview IS 'All active subscriptions with renewal dates and product details';

-- ============================================================
-- STEP 13: VERIFICATION QUERIES
-- ============================================================

-- Verify products
SELECT * FROM products ORDER BY (metadata->>'plan_tier')::INTEGER;

-- Verify prices (monthly vs yearly)
SELECT
  product_id,
  id AS price_id,
  recurring_interval,
  ROUND(unit_amount / 100.0, 2) AS price_eur
FROM prices
ORDER BY product_id, recurring_interval;

-- Verify product pricing overview
SELECT * FROM product_pricing_overview;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
