# Admin API Endpoints - Implementation Complete

This directory contains all the admin API endpoints for the TrackBillables application. These endpoints are protected and require admin authentication.

## 🎉 Phase 1 Complete

All Phase 1 (MVP) + Phase 2 (Support Tools) endpoints have been implemented.

---

## 📁 File Structure

```
app/api/admin/
├── README.md (this file)
├── analytics/
│   └── dashboard/
│       └── route.ts          # GET - Dashboard metrics
├── users/
│   ├── route.ts              # GET - List all users
│   └── [userId]/
│       ├── route.ts          # GET - User detail
│       ├── reset-usage/
│       │   └── route.ts      # POST - Reset usage counters
│       ├── change-tier/
│       │   └── route.ts      # POST - Change subscription tier
│       ├── change-status/
│       │   └── route.ts      # POST - Change subscription status
│       └── extend-trial/
│           └── route.ts      # POST - Extend trial period
└── audit-log/
    └── route.ts              # GET - View audit logs

lib/admin/
└── helpers.ts                # Admin auth & audit helpers

lib/supabase/
└── admin.ts                  # Admin Supabase client
```

---

## 🔐 Authentication

All admin endpoints use the `verifyAdmin()` helper function which:
1. Checks if the user is authenticated
2. Verifies the user is an admin (using the `is_admin()` database function)
3. Returns 401 (Unauthorized) or 403 (Forbidden) if checks fail

**Example usage:**
```typescript
const auth = await verifyAdmin();
if (!auth.authorized || !auth.user) {
  return auth.response; // Returns error response
}
// Continue with admin logic
```

---

## 📊 Endpoints Overview

### 1. Analytics Dashboard
**GET** `/api/admin/analytics/dashboard`

**Purpose:** Fetch comprehensive dashboard metrics

**Response:**
- Total users (all time, new 7d, new 30d, growth rate)
- Revenue metrics (MRR, ARR, monthly revenue)
- Subscription breakdown (free, pro, trial counts & percentages)
- Activity metrics (billables, avg per user, top users)
- User growth chart (last 6 months)
- Daily active users (last 30 days)

**Audit:** Logs `view_dashboard` action

---

### 2. Users List
**GET** `/api/admin/users`

**Purpose:** List all users with pagination, search, and filters

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 25, max: 100)
- `search` (email search)
- `tier` (all/free/pro/trial)
- `status` (all/active/canceled/trialing/etc)
- `sort` (email/created_at/last_sign_in_at)
- `order` (asc/desc)

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "2025-01-15T10:30:00Z",
      "last_sign_in_at": "2025-12-14T08:45:00Z",
      "subscription": {
        "tier": "pro",
        "status": "active",
        "entries_count_current_month": 23,
        "exports_count_current_month": 5,
        "billables_total": 450
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "totalUsers": 1250,
    "totalPages": 50
  }
}
```

---

### 3. User Detail
**GET** `/api/admin/users/[userId]`

**Purpose:** Get detailed information for a specific user

**Response:**
- User profile (email, created_at, last_sign_in_at, auth_provider)
- Complete subscription details
- Recent billables (last 10)
- Total billables count
- Audit log for this user (last 10 actions)

**Audit:** Logs `view_user` action

---

### 4. Reset Usage Counters
**POST** `/api/admin/users/[userId]/reset-usage`

**Purpose:** Reset monthly usage counters (entries & exports) to 0

**Request Body:**
```json
{
  "notes": "Billing error - goodwill gesture" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usage counters reset successfully",
  "subscription": {
    "entries_count_current_month": 0,
    "exports_count_current_month": 0,
    "usage_reset_date": "2025-12-14"
  }
}
```

**Audit:** Logs `reset_usage` action with old/new values

---

### 5. Change Tier
**POST** `/api/admin/users/[userId]/change-tier`

**Purpose:** Manually change user's subscription tier

**Request Body:**
```json
{
  "tier": "pro", // required: "free" or "pro"
  "notes": "Lifetime deal - Black Friday 2025" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tier changed to pro",
  "subscription": {
    "tier": "pro",
    "updated_at": "2025-12-14T16:00:00Z"
  }
}
```

**Warning:** This does NOT modify Stripe subscription. Admin must handle that separately.

**Audit:** Logs `change_tier` action with old/new tier

---

### 6. Change Status
**POST** `/api/admin/users/[userId]/change-status`

**Purpose:** Manually change subscription status

**Request Body:**
```json
{
  "status": "active", // required: valid subscription status
  "notes": "Manual sync after Stripe issue" // optional
}
```

**Valid Statuses:**
- `active`
- `trialing`
- `past_due`
- `canceled`
- `incomplete`
- `incomplete_expired`
- `unpaid`

**Response:**
```json
{
  "success": true,
  "message": "Status changed to active",
  "subscription": {
    "status": "active",
    "updated_at": "2025-12-14T16:00:00Z"
  }
}
```

**Audit:** Logs `change_status` action with old/new status

---

### 7. Extend Trial
**POST** `/api/admin/users/[userId]/extend-trial`

**Purpose:** Extend trial end date for a user

**Request Body:**
```json
{
  "trial_end": "2025-12-28T23:59:59Z", // required: ISO 8601 timestamp
  "notes": "User requested extension - evaluating for team" // optional
}
```

**Validation:**
- User status must be `trialing`
- `trial_end` must be in the future

**Response:**
```json
{
  "success": true,
  "message": "Trial extended to 2025-12-28",
  "subscription": {
    "trial_end": "2025-12-28T23:59:59Z",
    "updated_at": "2025-12-14T16:00:00Z"
  }
}
```

**Audit:** Logs `extend_trial` action with old/new trial_end

---

### 8. Audit Log
**GET** `/api/admin/audit-log`

**Purpose:** View all admin actions with filters and pagination

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50, max: 100)
- `admin_user_id` (filter by admin)
- `target_user_id` (filter by target user)
- `action` (filter by action type)

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "admin_email": "admin@example.com",
      "action": "reset_usage",
      "target_user_email": "user@example.com",
      "notes": "Billing error",
      "details": { "entries_reset": true, "exports_reset": true },
      "created_at": "2025-12-14T15:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalLogs": 342,
    "totalPages": 7
  }
}
```

---

## 🛠️ Helper Functions

### `verifyAdmin()`
Located in: `lib/admin/helpers.ts`

Verifies that the current user is authenticated and is an admin.

**Returns:**
```typescript
{
  authorized: boolean;
  user: { id: string; email: string } | null;
  response?: NextResponse; // Error response if not authorized
}
```

**Usage:**
```typescript
const auth = await verifyAdmin();
if (!auth.authorized || !auth.user) {
  return auth.response;
}
// auth.user.id and auth.user.email are now available
```

---

### `createAuditLog()`
Located in: `lib/admin/helpers.ts`

Creates an audit log entry for an admin action.

**Parameters:**
```typescript
{
  adminUserId: string;
  action: AuditAction;
  targetUserId?: string;
  details?: Record<string, any>;
  notes?: string;
  ipAddress?: string;
}
```

**Action Types:**
- `reset_usage`
- `change_tier`
- `change_status`
- `extend_trial`
- `view_user`
- `view_dashboard`
- `export_data`

**Usage:**
```typescript
await createAuditLog({
  adminUserId: auth.user.id,
  action: 'reset_usage',
  targetUserId: userId,
  details: { old_value: 50, new_value: 0 },
  notes: 'User requested reset',
  ipAddress: getIpAddress(request),
});
```

---

### `getIpAddress(request)`
Located in: `lib/admin/helpers.ts`

Extracts IP address from request headers (supports Vercel, Cloudflare, etc).

**Usage:**
```typescript
const ipAddress = getIpAddress(request);
```

---

### `createAdminClient()`
Located in: `lib/supabase/admin.ts`

Creates a Supabase client with service role key that bypasses RLS.

**⚠️ IMPORTANT:** Only use this after verifying admin status!

**Usage:**
```typescript
const adminClient = createAdminClient();
const { data, error } = await adminClient
  .from('users')
  .select('*');
```

---

## 🧪 Testing the API

### Test Admin Authentication
First, ensure you're logged in as an admin user (`rod.de.coelho@gmail.com`).

### Test Dashboard Endpoint
```bash
curl http://localhost:3000/api/admin/analytics/dashboard \
  -H "Cookie: your-session-cookie"
```

### Test Users List
```bash
# List all users
curl http://localhost:3000/api/admin/users

# Search by email
curl http://localhost:3000/api/admin/users?search=example

# Filter by tier
curl http://localhost:3000/api/admin/users?tier=pro

# Filter by status
curl http://localhost:3000/api/admin/users?status=active

# Pagination
curl http://localhost:3000/api/admin/users?page=2&limit=10
```

### Test User Detail
```bash
curl http://localhost:3000/api/admin/users/USER_UUID
```

### Test Reset Usage
```bash
curl -X POST http://localhost:3000/api/admin/users/USER_UUID/reset-usage \
  -H "Content-Type: application/json" \
  -d '{"notes": "Testing reset"}'
```

### Test Change Tier
```bash
curl -X POST http://localhost:3000/api/admin/users/USER_UUID/change-tier \
  -H "Content-Type: application/json" \
  -d '{"tier": "pro", "notes": "Upgrade test"}'
```

### Test Audit Log
```bash
# View all logs
curl http://localhost:3000/api/admin/audit-log

# Filter by action
curl http://localhost:3000/api/admin/audit-log?action=reset_usage

# Filter by target user
curl http://localhost:3000/api/admin/audit-log?target_user_id=USER_UUID
```

---

## ✅ What's Complete

- ✅ Admin authentication middleware
- ✅ Audit logging system
- ✅ Analytics dashboard endpoint
- ✅ Users list endpoint (search, filter, sort, pagination)
- ✅ User detail endpoint
- ✅ Reset usage counters
- ✅ Change tier
- ✅ Change status
- ✅ Extend trial
- ✅ Audit log viewer

---

## 🚧 What's Next (Phase 2: Frontend)

Now that all API endpoints are ready, the next step is to build the admin UI:

1. **Admin Layout Component** (`/app/admin/layout.tsx`)
   - Sidebar navigation
   - Admin banner
   - Auth check & redirect

2. **Dashboard Page** (`/app/admin/dashboard/page.tsx`)
   - Metric cards
   - Charts (Recharts)
   - Quick actions

3. **Users Page** (`/app/admin/users/page.tsx`)
   - User table component
   - Search & filters
   - Pagination controls

4. **User Detail Page** (`/app/admin/users/[userId]/page.tsx`)
   - User info display
   - Subscription details
   - Support action buttons
   - Billables table
   - Audit log table

5. **Audit Log Page** (`/app/admin/audit-log/page.tsx`)
   - Audit log table
   - Filters
   - Pagination

6. **Reusable Components**
   - MetricCard
   - SubscriptionBadge
   - ConfirmModal
   - AdminTable

---

## 📝 Notes

### Security
- All endpoints check admin status before processing
- All actions are logged to audit trail
- Service role key is only used after admin verification
- IP addresses are captured for audit logs

### Error Handling
- All endpoints have try/catch blocks
- Errors are logged to console
- User-friendly error messages returned
- HTTP status codes follow REST conventions

### Performance
- Dashboard uses parallel queries (Promise.all)
- Users list uses efficient batch queries
- Indexes are in place for all lookup fields

### Future Enhancements
- Rate limiting on admin endpoints
- Export admin reports to CSV
- Bulk operations (multi-user actions)
- Advanced analytics (cohort analysis, retention)
- Email notifications for certain admin actions

---

## 🐛 Troubleshooting

**Issue:** 403 Forbidden on all admin endpoints
- **Solution:** Verify your user is in the `admins` table
- **Check:** Run `SELECT * FROM admins WHERE user_id = 'YOUR_USER_ID';`

**Issue:** 500 Internal Server Error
- **Solution:** Check server logs for detailed error
- **Common causes:** Missing environment variables, database connection issues

**Issue:** Analytics dashboard returns zero for all metrics
- **Solution:** Ensure you have test data in the database
- **Check:** Run `SELECT COUNT(*) FROM auth.users;` and `SELECT COUNT(*) FROM billables;`

**Issue:** Audit logs not being created
- **Solution:** Check that the admin_audit_log table exists and has RLS policies
- **Verify:** Run `SELECT * FROM admin_audit_log LIMIT 1;`

---

## 📚 Related Documentation

- [Admin Page Specification](../../../ADMIN_PAGE_DOCUMENTATION.md)
- [Database Migrations](../../../supabase/migrations/README.md)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Status:** Phase 1 (API Implementation) - ✅ COMPLETE
**Next:** Phase 2 (Frontend Implementation)
**Date:** 2026-01-13
