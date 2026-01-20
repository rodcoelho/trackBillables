-- ============================================
-- VERIFY SUBSCRIPTIONS SETUP
-- ============================================
-- Run these queries one by one to verify your setup

-- 1. Check if subscriptions table exists and view its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 2. Check existing subscriptions
SELECT
  id,
  user_id,
  tier,
  status,
  entries_count_current_month,
  exports_count_current_month,
  usage_reset_date,
  stripe_customer_id,
  created_at
FROM subscriptions;

-- 3. Check if triggers exist
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('subscriptions', 'billables', 'users')
  OR trigger_name LIKE '%subscription%'
  OR trigger_name LIKE '%billable%';

-- 4. Check if helper functions exist
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_new_user',
    'increment_entry_count',
    'can_add_entry',
    'can_export',
    'increment_export_count'
  );

-- 5. Check RLS policies on subscriptions table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'subscriptions';

-- 6. Test the can_add_entry function (replace with your user_id)
-- First, get your user_id:
SELECT id, email FROM auth.users LIMIT 5;

-- Then test (replace 'your-user-id-here' with actual UUID from above):
-- SELECT can_add_entry('your-user-id-here');

-- 7. Test the can_export function (replace with your user_id)
-- SELECT can_export('your-user-id-here');
