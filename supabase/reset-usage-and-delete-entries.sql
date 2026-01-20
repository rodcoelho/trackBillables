-- Reset usage counts to 0 AND delete all billable entries for rodrigo.d.coelho@gmail.com
-- This is useful for completely resetting to a clean state for testing
-- WARNING: This will DELETE all your billable entries!

DO $$
DECLARE
  target_user_id uuid;
  first_of_month date;
  deleted_count integer;
BEGIN
  -- Get the user_id from auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'rodrigo.d.coelho@gmail.com';

  -- Check if user exists
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email rodrigo.d.coelho@gmail.com not found';
  END IF;

  -- Calculate first day of current month
  first_of_month := DATE_TRUNC('month', CURRENT_DATE)::date;

  -- Delete all billable entries for this user
  DELETE FROM billables
  WHERE user_id = target_user_id;

  -- Get the count of deleted entries
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Reset the subscription usage counts
  UPDATE subscriptions
  SET
    entries_count_current_month = 0,
    exports_count_current_month = 0,
    usage_reset_date = first_of_month,
    updated_at = NOW()
  WHERE user_id = target_user_id;

  RAISE NOTICE 'Successfully reset usage counts for user %', target_user_id;
  RAISE NOTICE 'Deleted % billable entries', deleted_count;
  RAISE NOTICE 'Entries count: 0';
  RAISE NOTICE 'Exports count: 0';
  RAISE NOTICE 'Reset date: %', first_of_month;
END $$;
