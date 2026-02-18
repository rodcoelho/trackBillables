-- Add optional case_number column to billables table
ALTER TABLE billables ADD COLUMN IF NOT EXISTS case_number TEXT DEFAULT NULL;
