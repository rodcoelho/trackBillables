-- Migration: Create RLS policies for admin access
-- Enables RLS and creates policies for admin users to access all data

-- =============================================================================
-- 1. Enable RLS on new admin tables
-- =============================================================================
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 2. RLS Policies for admins table
-- =============================================================================

-- Admins can view all admins
CREATE POLICY "Admins can view admins table"
  ON admins
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can insert new admins (for future admin management UI)
CREATE POLICY "Admins can create new admins"
  ON admins
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- =============================================================================
-- 3. RLS Policies for admin_audit_log table
-- =============================================================================

-- Admins can insert audit log entries
CREATE POLICY "Admins can insert audit logs"
  ON admin_audit_log
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()) AND admin_user_id = auth.uid());

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON admin_audit_log
  FOR SELECT
  USING (is_admin(auth.uid()));

-- =============================================================================
-- 4. RLS Policies for subscriptions table (admin access)
-- =============================================================================

-- Admins can view all subscriptions
-- NOTE: This works alongside the existing user policy
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can update any subscription
CREATE POLICY "Admins can update any subscription"
  ON subscriptions
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- =============================================================================
-- 5. RLS Policies for billables table (admin access)
-- =============================================================================

-- Admins can view all billables
-- NOTE: This works alongside the existing user policy
CREATE POLICY "Admins can view all billables"
  ON billables
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can view counts and aggregates (helpful for analytics)
-- This is redundant with the SELECT policy above but explicit for clarity
CREATE POLICY "Admins can aggregate billables"
  ON billables
  FOR SELECT
  USING (is_admin(auth.uid()));

-- =============================================================================
-- Notes:
-- =============================================================================
-- 1. These policies work alongside existing user policies
--    Users can still only see their own data via existing policies
--    Admins get additional access via these new policies
--
-- 2. Admins cannot INSERT or DELETE billables (read-only for billables)
--    This prevents accidental data corruption from admin panel
--
-- 3. Admins CAN update subscriptions (for support actions)
--    But changes are logged via the audit log table
--
-- 4. The is_admin() function is SECURITY DEFINER, so it can read the admins
--    table even when called from RLS policy context
-- =============================================================================
