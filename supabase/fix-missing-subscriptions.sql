-- Fix Missing Subscriptions
-- Run these queries ONE AT A TIME in Supabase SQL Editor

-- Query 1: Check where the trigger is currently attached
SELECT
    trigger_schema,
    trigger_name,
    event_object_schema,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Query 2: Manually create subscriptions for existing users who don't have one
-- This is the MAIN FIX - run this to create missing subscriptions
INSERT INTO subscriptions (user_id, tier, status, entries_count_current_month, exports_count_current_month)
SELECT
  id,
  'free',
  'active',
  0,
  0
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- Query 3: Verify subscriptions were created for both users
SELECT
  u.id,
  u.email,
  s.tier,
  s.status,
  s.created_at as subscription_created
FROM auth.users u
LEFT JOIN subscriptions s ON u.id = s.user_id
ORDER BY u.created_at DESC;
