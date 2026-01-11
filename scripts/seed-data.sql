-- Seed 300 billable entries for user
-- Run this in Supabase SQL Editor

-- First, let's create a function to generate random strings
CREATE OR REPLACE FUNCTION random_string(length INTEGER)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insert 300 entries for the user
DO $$
DECLARE
  v_user_id UUID := '31e4d90f-04d6-4685-8832-dbe67ffad444';
  v_date DATE;
  v_hours DECIMAL(10,2);
  v_client_project TEXT;
  v_description TEXT;
  i INTEGER;
BEGIN
  FOR i IN 0..299 LOOP
    v_date := CURRENT_DATE - i;
    v_hours := (random() * 7 + 1)::DECIMAL(10,2); -- Random between 1 and 8
    v_client_project := 'Dept of Commerce v. Bob ' ||
                        to_char(v_date, 'MM/DD/YYYY');
    v_description := random_string(50);

    INSERT INTO billables (user_id, date, time_amount, client_project, description)
    VALUES (v_user_id, v_date, v_hours, v_client_project, v_description);

    -- Show progress every 50 entries
    IF (i + 1) % 50 = 0 THEN
      RAISE NOTICE 'Inserted % entries...', i + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Successfully inserted 300 entries!';
END $$;

-- Clean up the helper function
DROP FUNCTION IF EXISTS random_string(INTEGER);
