-- Migration: Create admin tables and helper functions
-- Creates the admins table, admin_audit_log table, and is_admin helper function

-- =============================================================================
-- 1. Create admins table
-- =============================================================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) -- Admin who granted access
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS admins_user_id_idx ON admins(user_id);

-- Add comment for documentation
COMMENT ON TABLE admins IS 'Stores admin users who have access to the admin panel';
COMMENT ON COLUMN admins.user_id IS 'Reference to the user in auth.users who has admin privileges';
COMMENT ON COLUMN admins.created_by IS 'Reference to the admin who granted this admin access';

-- =============================================================================
-- 2. Create admin audit log table
-- =============================================================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL, -- e.g., 'reset_usage', 'change_tier', 'extend_trial', 'change_status'
  target_user_id UUID REFERENCES auth.users(id),
  details JSONB, -- Store old/new values, changes made (structured data)
  notes TEXT, -- Optional admin notes/reason (free text)
  ip_address TEXT, -- IP address of the admin (optional, for security)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS admin_audit_log_admin_user_id_idx ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_user_id_idx ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_action_idx ON admin_audit_log(action);

-- Add comments for documentation
COMMENT ON TABLE admin_audit_log IS 'Audit trail of all admin actions performed in the admin panel';
COMMENT ON COLUMN admin_audit_log.action IS 'Type of action performed (e.g., reset_usage, change_tier)';
COMMENT ON COLUMN admin_audit_log.details IS 'JSONB object containing structured data about the changes (old/new values)';
COMMENT ON COLUMN admin_audit_log.notes IS 'Optional free-text notes or reason provided by the admin';

-- =============================================================================
-- 3. Create is_admin helper function
-- =============================================================================
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admins WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION is_admin(UUID) IS 'Helper function to check if a user is an admin. Used in RLS policies and API middleware.';
