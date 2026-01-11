-- Seed 6 months of billable entries (80 entries per day = ~14,400 total)
-- Each entry is 0.1 hours (6 minutes), totaling 8 hours per day
-- Run this in Supabase SQL Editor

-- Create helper function for random strings
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

-- Insert entries
DO $$
DECLARE
  v_user_id UUID := '31e4d90f-04d6-4685-8832-dbe67ffad444';
  v_date DATE;
  v_client TEXT;
  v_matter TEXT;
  v_description TEXT;
  v_clients TEXT[] := ARRAY['Alpha', 'Beta', 'Delta'];
  v_matters TEXT[] := ARRAY['Alpha Matter', 'Beta Matter', 'Delta Matter'];
  day_offset INTEGER;
  entry_num INTEGER;
  total_entries INTEGER := 0;
BEGIN
  -- Loop through last 180 days (approximately 6 months)
  FOR day_offset IN 0..179 LOOP
    v_date := CURRENT_DATE - day_offset;

    -- Create 80 entries per day (0.1 hours each = 8 hours total)
    FOR entry_num IN 0..79 LOOP
      -- Rotate clients: Alpha, Beta, Delta
      v_client := v_clients[(entry_num % 3) + 1];

      -- Rotate matters: Alpha Matter, Beta Matter, Delta Matter
      v_matter := v_matters[(entry_num % 3) + 1];

      -- Generate random description
      v_description := random_string(50);

      -- Insert entry
      INSERT INTO billables (user_id, date, client, matter, time_amount, description)
      VALUES (v_user_id, v_date, v_client, v_matter, 0.1, v_description);

      total_entries := total_entries + 1;
    END LOOP;

    -- Show progress every 30 days
    IF (day_offset + 1) % 30 = 0 THEN
      RAISE NOTICE 'Processed % days (% entries so far)...', day_offset + 1, total_entries;
    END IF;
  END LOOP;

  RAISE NOTICE 'Successfully inserted % entries for 180 days!', total_entries;
  RAISE NOTICE 'Date range: % to %', CURRENT_DATE - 179, CURRENT_DATE;
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS random_string(INTEGER);
