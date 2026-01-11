-- Complete migration: Add client and matter columns, remove client_project

-- Step 1: Add new columns if they don't exist
ALTER TABLE billables ADD COLUMN IF NOT EXISTS client TEXT;
ALTER TABLE billables ADD COLUMN IF NOT EXISTS matter TEXT;

-- Step 2: Migrate existing data
UPDATE billables SET matter = client_project WHERE matter IS NULL;
UPDATE billables SET client = 'Legacy Client' WHERE client IS NULL;

-- Step 3: Make new columns NOT NULL
ALTER TABLE billables ALTER COLUMN client SET NOT NULL;
ALTER TABLE billables ALTER COLUMN matter SET NOT NULL;

-- Step 4: Drop the old client_project column
ALTER TABLE billables DROP COLUMN IF EXISTS client_project;
