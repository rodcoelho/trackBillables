-- Count total billable entries for rod.de.coelho@gmail.com
SELECT COUNT(*) as total_entries
FROM billables
WHERE user_id = '31e4d90f-04d6-4685-8832-dbe67ffad444';

-- Breakdown by client
SELECT client, COUNT(*) as count
FROM billables
WHERE user_id = '31e4d90f-04d6-4685-8832-dbe67ffad444'
GROUP BY client
ORDER BY client;

-- Breakdown by date range
SELECT
  MIN(date) as earliest_date,
  MAX(date) as latest_date,
  COUNT(*) as total_entries,
  COUNT(DISTINCT date) as distinct_days
FROM billables
WHERE user_id = '31e4d90f-04d6-4685-8832-dbe67ffad444';
