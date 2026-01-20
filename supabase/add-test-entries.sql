-- Add 40 test billable entries for rodrigo.d.coelho@gmail.com
-- This is useful for testing the usage limits

DO $$
DECLARE
  target_user_id uuid;
  entry_date date;
  i integer;
BEGIN
  -- Get the user_id from auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'rodrigo.d.coelho@gmail.com';

  -- Check if user exists
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email rodrigo.d.coelho@gmail.com not found';
  END IF;

  -- Insert 40 entries with varying data
  FOR i IN 1..40 LOOP
    -- Vary the dates over the current month
    entry_date := CURRENT_DATE - (i % 30);

    INSERT INTO billables (
      user_id,
      date,
      client,
      matter,
      time_amount,
      description,
      created_at,
      updated_at
    ) VALUES (
      target_user_id,
      entry_date,
      CASE (i % 5)
        WHEN 0 THEN 'Smith'
        WHEN 1 THEN 'Johnson'
        WHEN 2 THEN 'Williams'
        WHEN 3 THEN 'Brown'
        ELSE 'Davis'
      END,
      CASE (i % 4)
        WHEN 0 THEN 'Contract Review'
        WHEN 1 THEN 'Discovery Phase'
        WHEN 2 THEN 'Depositions'
        ELSE 'Trial Preparation'
      END,
      -- Random hours between 0.5 and 8.0
      (0.5 + (i % 15) * 0.5)::numeric,
      CASE (i % 3)
        WHEN 0 THEN 'Reviewed documents and prepared summary'
        WHEN 1 THEN 'Client consultation and case strategy discussion'
        ELSE 'Legal research and memo preparation'
      END,
      NOW(),
      NOW()
    );
  END LOOP;

  -- Update the subscription entries count
  UPDATE subscriptions
  SET entries_count_current_month = entries_count_current_month + 40
  WHERE user_id = target_user_id;

  RAISE NOTICE 'Successfully added 40 entries for user %', target_user_id;
END $$;
