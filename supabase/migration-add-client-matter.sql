-- Migration: Split client_project into client and matter fields

-- Add new columns
ALTER TABLE billables ADD COLUMN IF NOT EXISTS client TEXT;
ALTER TABLE billables ADD COLUMN IF NOT EXISTS matter TEXT;

-- Migrate existing data (optional - copy client_project to matter for now)
UPDATE billables SET matter = client_project WHERE matter IS NULL;

-- Make the new columns NOT NULL after data migration
ALTER TABLE billables ALTER COLUMN client SET NOT NULL;
ALTER TABLE billables ALTER COLUMN matter SET NOT NULL;

-- Optional: Remove the old client_project column (commented out for safety)
-- First verify all data is migrated correctly before running this
-- ALTER TABLE billables DROP COLUMN client_project;
