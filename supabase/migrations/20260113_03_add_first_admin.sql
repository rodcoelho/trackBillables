-- Migration: Add first admin user
-- Adds rod.de.coelho@gmail.com as the first admin user

-- =============================================================================
-- Add first admin user: rod.de.coelho@gmail.com
-- =============================================================================

-- This migration is safe to run multiple times (ON CONFLICT DO NOTHING)
-- The user must already exist in auth.users before running this migration

INSERT INTO admins (user_id, created_by)
SELECT id, id  -- created_by is self (first admin)
FROM auth.users
WHERE email = 'rod.de.coelho@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- Verification Query (for manual testing)
-- =============================================================================
-- Run this after migration to verify the admin was added:
--
-- SELECT
--   a.id as admin_id,
--   u.email,
--   u.created_at as user_created_at,
--   a.created_at as admin_created_at
-- FROM admins a
-- JOIN auth.users u ON a.user_id = u.id
-- WHERE u.email = 'rod.de.coelho@gmail.com';
--
-- Expected result: One row with the admin details
-- If no rows returned: The user hasn't signed up yet
-- =============================================================================

-- =============================================================================
-- Instructions for adding additional admins in the future:
-- =============================================================================
-- To add another admin user, run:
--
-- INSERT INTO admins (user_id, created_by)
-- SELECT
--   (SELECT id FROM auth.users WHERE email = 'new-admin@example.com'),
--   (SELECT id FROM auth.users WHERE email = 'rod.de.coelho@gmail.com')
-- WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'new-admin@example.com')
-- ON CONFLICT (user_id) DO NOTHING;
--
-- This ensures:
-- 1. The new admin user exists before trying to add them
-- 2. The created_by field references the current admin
-- 3. No error if the user is already an admin
-- =============================================================================
