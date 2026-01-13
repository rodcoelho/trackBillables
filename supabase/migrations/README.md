# Supabase Migrations

This directory contains SQL migration files for the TrackBillables application.

## Admin Panel Migrations (2026-01-13)

These migrations set up the database infrastructure for the admin panel.

### Migration Files

1. **`20260113_01_create_admin_tables.sql`**
   - Creates `admins` table to store admin users
   - Creates `admin_audit_log` table to track all admin actions
   - Creates `is_admin()` helper function for checking admin status

2. **`20260113_02_create_admin_rls_policies.sql`**
   - Enables Row Level Security on admin tables
   - Creates RLS policies for admin access to all data
   - Maintains existing user policies (admins get additional access)

3. **`20260113_03_add_first_admin.sql`**
   - Adds `rod.de.coelho@gmail.com` as the first admin user
   - Safe to run even if user doesn't exist yet (will skip)
   - Includes instructions for adding future admins

4. **`20260113_04_add_subscription_override.sql`** (OPTIONAL)
   - Adds `override_until` field for temporary Pro access grants
   - Creates `has_pro_access()` helper function
   - Phase 3 feature - can be applied later if needed

## How to Apply Migrations

### Option 1: Using Supabase CLI (Recommended)

```bash
# Make sure you're logged in to Supabase CLI
supabase login

# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Apply all pending migrations
supabase db push
```

### Option 2: Using Supabase Dashboard (SQL Editor)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of each migration file **in order**:
   - First: `20260113_01_create_admin_tables.sql`
   - Second: `20260113_02_create_admin_rls_policies.sql`
   - Third: `20260113_03_add_first_admin.sql`
   - Fourth (optional): `20260113_04_add_subscription_override.sql`
4. Run each migration by clicking **Run** or pressing `Ctrl+Enter`

### Option 3: Manual Upload via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Migrations**
3. Click **New Migration**
4. Upload each migration file or paste its contents
5. Apply migrations in order

## Prerequisites

Before running migration #3 (`add_first_admin.sql`):
- The user `rod.de.coelho@gmail.com` must have signed up in the application
- If the user hasn't signed up yet, the migration will run but won't add the admin
- After signup, you can manually run the INSERT statement from the migration

## Verification

After applying migrations, verify the setup:

```sql
-- Check if admins table was created
SELECT * FROM admins;

-- Check if admin user was added
SELECT
  a.id as admin_id,
  u.email,
  u.created_at as user_created_at,
  a.created_at as admin_created_at
FROM admins a
JOIN auth.users u ON a.user_id = u.id;

-- Check if is_admin function works
SELECT is_admin((SELECT id FROM auth.users WHERE email = 'rod.de.coelho@gmail.com'));
-- Expected: true

-- Check if audit log table was created
SELECT * FROM admin_audit_log;

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('admins', 'admin_audit_log', 'subscriptions', 'billables');
```

## Rollback (if needed)

If you need to rollback these migrations:

```sql
-- Drop policies
DROP POLICY IF EXISTS "Admins can view admins table" ON admins;
DROP POLICY IF EXISTS "Admins can create new admins" ON admins;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON admin_audit_log;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON admin_audit_log;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update any subscription" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all billables" ON billables;
DROP POLICY IF EXISTS "Admins can aggregate billables" ON billables;

-- Drop functions
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS has_pro_access(UUID);

-- Drop tables
DROP TABLE IF EXISTS admin_audit_log;
DROP TABLE IF EXISTS admins;

-- Remove subscription override field (if added)
ALTER TABLE subscriptions DROP COLUMN IF EXISTS override_until;
```

## Adding Additional Admins

After the initial migration, you can add more admins using:

```sql
INSERT INTO admins (user_id, created_by)
SELECT
  (SELECT id FROM auth.users WHERE email = 'new-admin@example.com'),
  (SELECT id FROM auth.users WHERE email = 'rod.de.coelho@gmail.com')
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'new-admin@example.com')
ON CONFLICT (user_id) DO NOTHING;
```

## Next Steps

After applying these migrations:

1. ✅ Database setup complete
2. ⏳ Build admin API endpoints (`/api/admin/*`)
3. ⏳ Build admin UI pages (`/admin/*`)
4. ⏳ Test admin authentication and RLS policies
5. ⏳ Implement admin actions (reset usage, change tier, etc.)

Refer to `ADMIN_PAGE_DOCUMENTATION.md` for full implementation details.

## Troubleshooting

**Issue**: Migration #3 doesn't add the admin user
- **Solution**: Make sure `rod.de.coelho@gmail.com` has signed up first
- **Check**: Run `SELECT * FROM auth.users WHERE email = 'rod.de.coelho@gmail.com';`
- **If no result**: Sign up via the app, then manually run the INSERT from migration #3

**Issue**: RLS policies block admin access
- **Solution**: Verify the `is_admin()` function returns `true` for your admin user
- **Check**: Run `SELECT is_admin((SELECT id FROM auth.users WHERE email = 'rod.de.coelho@gmail.com'));`
- **If false**: Check if the admin record exists in the `admins` table

**Issue**: "permission denied" errors in admin API
- **Solution**: Make sure your API is using the service role key for admin operations
- **Check**: Verify `SUPABASE_SERVICE_ROLE_KEY` is set in environment variables
- **Note**: Regular anon key won't bypass RLS for admin operations

## Migration History

| Date | Migration | Description |
|------|-----------|-------------|
| 2026-01-10 | `20260110_fix_missing_subscriptions.sql` | Fix missing subscriptions for existing users |
| 2026-01-13 | `20260113_01_create_admin_tables.sql` | Create admin tables and helper function |
| 2026-01-13 | `20260113_02_create_admin_rls_policies.sql` | Create RLS policies for admin access |
| 2026-01-13 | `20260113_03_add_first_admin.sql` | Add first admin user |
| 2026-01-13 | `20260113_04_add_subscription_override.sql` | Add subscription override field (optional) |
