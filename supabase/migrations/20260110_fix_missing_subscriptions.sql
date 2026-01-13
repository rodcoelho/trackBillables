-- Migration: Fix missing subscriptions for existing users
-- This creates subscriptions for users who were created before the trigger was added

-- Manually create subscriptions for existing users who don't have one
INSERT INTO subscriptions (user_id, tier, status, entries_count_current_month, exports_count_current_month)
SELECT
  id,
  'free'::text,
  'active'::text,
  0,
  0
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM subscriptions)
ON CONFLICT (user_id) DO NOTHING;
