-- Check current usage statistics for rodrigo.d.coelho@gmail.com
-- This shows subscription tier, usage counts, and actual entry counts

SELECT
  u.email,
  s.tier,
  s.status,
  s.entries_count_current_month as tracked_entries_count,
  s.exports_count_current_month as tracked_exports_count,
  s.usage_reset_date,
  (SELECT COUNT(*) FROM billables b WHERE b.user_id = u.id) as actual_total_entries,
  (SELECT COUNT(*) FROM billables b WHERE b.user_id = u.id AND DATE_TRUNC('month', b.date::date) = DATE_TRUNC('month', CURRENT_DATE)) as actual_entries_this_month,
  CASE
    WHEN s.tier = 'free' THEN 50 - s.entries_count_current_month
    ELSE NULL
  END as entries_remaining,
  CASE
    WHEN s.tier = 'free' THEN 1 - s.exports_count_current_month
    ELSE NULL
  END as exports_remaining
FROM auth.users u
JOIN subscriptions s ON s.user_id = u.id
WHERE u.email = 'rodrigo.d.coelho@gmail.com';
