-- Migration: Add subscription override field (OPTIONAL)
-- Adds override_until field to subscriptions table for temporary Pro access grants

-- =============================================================================
-- Add override_until field to subscriptions table
-- =============================================================================

-- This field allows admins to grant temporary Pro access to users
-- Use cases:
-- - Compensate for downtime or service issues
-- - Extended trial for enterprise leads
-- - Goodwill gestures for customer support
-- - Testing/beta access

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS override_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS subscriptions_override_until_idx
  ON subscriptions(override_until)
  WHERE override_until IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.override_until IS 'If set, grants Pro access until this date regardless of actual tier. Used for temporary access grants.';

-- =============================================================================
-- Helper function to check if user has Pro access (including overrides)
-- =============================================================================

-- This function checks both the actual tier AND the override_until field
-- Use this instead of just checking tier in your application logic
CREATE OR REPLACE FUNCTION has_pro_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  sub_record RECORD;
BEGIN
  SELECT tier, status, override_until
  INTO sub_record
  FROM subscriptions
  WHERE user_id = user_uuid;

  -- If no subscription found, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if override is active and not expired
  IF sub_record.override_until IS NOT NULL AND sub_record.override_until > NOW() THEN
    RETURN TRUE;
  END IF;

  -- Check if actual tier is pro and status is active or trialing
  IF sub_record.tier = 'pro' AND sub_record.status IN ('active', 'trialing') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION has_pro_access(UUID) IS 'Checks if a user has Pro access, including temporary overrides. Returns TRUE if user has Pro tier OR has an active override.';

-- =============================================================================
-- Usage Examples:
-- =============================================================================

-- Example 1: Grant temporary Pro access for 7 days
-- UPDATE subscriptions
-- SET override_until = NOW() + INTERVAL '7 days'
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');

-- Example 2: Remove temporary Pro access
-- UPDATE subscriptions
-- SET override_until = NULL
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');

-- Example 3: Check if user has Pro access (in application code)
-- SELECT has_pro_access((SELECT id FROM auth.users WHERE email = 'user@example.com'));

-- Example 4: Find all users with active overrides
-- SELECT
--   u.email,
--   s.tier,
--   s.override_until,
--   s.override_until - NOW() as time_remaining
-- FROM subscriptions s
-- JOIN auth.users u ON s.user_id = u.id
-- WHERE s.override_until IS NOT NULL AND s.override_until > NOW()
-- ORDER BY s.override_until ASC;

-- =============================================================================
-- Note: This migration is OPTIONAL
-- =============================================================================
-- The temporary Pro access feature is marked as Phase 3 (Enhancements) in the
-- admin page specification. You can skip this migration for now and add it
-- later when implementing Phase 3 features.
--
-- However, having the database field ready won't hurt and makes future
-- implementation easier.
-- =============================================================================
