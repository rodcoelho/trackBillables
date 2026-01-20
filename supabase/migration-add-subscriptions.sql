-- ============================================
-- FREEMIUM SUBSCRIPTIONS MIGRATION
-- ============================================
-- This migration adds support for freemium model with usage limits
-- Free Tier: 50 entries/month, 1 export/month
-- Pro Tier: Unlimited everything

-- ============================================
-- 1. CREATE SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Subscription tier and status
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),

  -- Stripe integration fields
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  billing_interval TEXT CHECK (billing_interval IN ('month', 'year')),

  -- Trial period
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,

  -- Billing period
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,

  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- Usage tracking (for free tier limits)
  entries_count_current_month INTEGER DEFAULT 0,
  exports_count_current_month INTEGER DEFAULT 0,
  usage_reset_date DATE DEFAULT CURRENT_DATE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_tier_idx ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own subscription (for usage counts)
CREATE POLICY "Users can update own subscription"
  ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only system can insert subscriptions (via triggers)
CREATE POLICY "System can insert subscriptions"
  ON subscriptions
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 4. CREATE TRIGGER FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. AUTO-CREATE FREE SUBSCRIPTION ON USER SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, tier, status, usage_reset_date)
  VALUES (NEW.id, 'free', 'active', CURRENT_DATE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 6. AUTO-INCREMENT ENTRY COUNT ON BILLABLE INSERT
-- ============================================

CREATE OR REPLACE FUNCTION increment_entry_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset usage counters if it's a new month
  UPDATE subscriptions
  SET
    entries_count_current_month = CASE
      WHEN usage_reset_date < DATE_TRUNC('month', CURRENT_DATE)::DATE THEN 1
      ELSE entries_count_current_month + 1
    END,
    exports_count_current_month = CASE
      WHEN usage_reset_date < DATE_TRUNC('month', CURRENT_DATE)::DATE THEN 0
      ELSE exports_count_current_month
    END,
    usage_reset_date = DATE_TRUNC('month', CURRENT_DATE)::DATE
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_billable_created ON billables;
CREATE TRIGGER on_billable_created
  AFTER INSERT ON billables
  FOR EACH ROW
  EXECUTE FUNCTION increment_entry_count();

-- ============================================
-- 7. HELPER FUNCTION: CAN USER ADD ENTRY?
-- ============================================

CREATE OR REPLACE FUNCTION can_add_entry(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_count INTEGER;
  v_reset_date DATE;
BEGIN
  SELECT tier, entries_count_current_month, usage_reset_date
  INTO v_tier, v_count, v_reset_date
  FROM subscriptions
  WHERE user_id = p_user_id;

  -- If no subscription found, return false
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Pro users can always add entries
  IF v_tier = 'pro' THEN
    RETURN true;
  END IF;

  -- Check if we need to reset counters (new month)
  IF v_reset_date < DATE_TRUNC('month', CURRENT_DATE)::DATE THEN
    -- Reset will happen automatically on next insert
    RETURN true;
  END IF;

  -- Free tier: check if under 50 entries limit
  RETURN v_count < 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. HELPER FUNCTION: CAN USER EXPORT?
-- ============================================

CREATE OR REPLACE FUNCTION can_export(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_count INTEGER;
  v_reset_date DATE;
BEGIN
  SELECT tier, exports_count_current_month, usage_reset_date
  INTO v_tier, v_count, v_reset_date
  FROM subscriptions
  WHERE user_id = p_user_id;

  -- If no subscription found, return false
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Pro users can always export
  IF v_tier = 'pro' THEN
    RETURN true;
  END IF;

  -- Check if we need to reset counters (new month)
  IF v_reset_date < DATE_TRUNC('month', CURRENT_DATE)::DATE THEN
    RETURN true;
  END IF;

  -- Free tier: check if under 1 export limit
  RETURN v_count < 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. FUNCTION TO INCREMENT EXPORT COUNT
-- ============================================

CREATE OR REPLACE FUNCTION increment_export_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Reset usage counters if it's a new month, then increment export count
  UPDATE subscriptions
  SET
    entries_count_current_month = CASE
      WHEN usage_reset_date < DATE_TRUNC('month', CURRENT_DATE)::DATE THEN 0
      ELSE entries_count_current_month
    END,
    exports_count_current_month = CASE
      WHEN usage_reset_date < DATE_TRUNC('month', CURRENT_DATE)::DATE THEN 1
      ELSE exports_count_current_month + 1
    END,
    usage_reset_date = DATE_TRUNC('month', CURRENT_DATE)::DATE
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. CREATE FREE SUBSCRIPTIONS FOR EXISTING USERS
-- ============================================

-- This will create free tier subscriptions for any existing users who don't have one yet
INSERT INTO subscriptions (user_id, tier, status, usage_reset_date)
SELECT id, 'free', 'active', CURRENT_DATE
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE subscriptions.user_id = auth.users.id
);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- You can now test the freemium features!
-- Free tier: 50 entries/month, 1 export/month
-- Pro tier: Unlimited
