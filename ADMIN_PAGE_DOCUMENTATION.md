# TrackBillables - Admin Page Documentation

## Table of Contents
1. [Application Overview](#application-overview)
2. [Tech Stack](#tech-stack)
3. [Database Schema](#database-schema)
4. [Subscription Model & Limits](#subscription-model--limits)
5. [API Endpoints](#api-endpoints)
6. [Stripe Integration](#stripe-integration)
7. [Authentication & Authorization](#authentication--authorization)
8. [Environment Variables](#environment-variables)
9. [Current Features](#current-features)
10. [Business Logic & Rules](#business-logic--rules)
11. [Admin Page Requirements](#admin-page-requirements)

---

## Application Overview

**TrackBillables** is a SaaS application for tracking billable hours with a freemium business model. Users can:
- Track billable entries (client, matter, date, hours, description)
- Export data to CSV/Excel
- View analytics on their billable hours
- Upgrade to Pro for unlimited features

### Business Model
- **Free Tier**: 50 entries/month, 1 export/month
- **Pro Tier**: Unlimited entries, unlimited exports (no trial — paid immediately)

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (Google OAuth + Email/Password)
- **Payments**: Stripe
- **API**: Next.js API Routes

### Infrastructure
- **Database & Auth**: Supabase Cloud
- **Hosting**: Vercel (frontend)
- **Storage**: N/A (no file storage currently)

---

## Database Schema

### Table: `auth.users` (Managed by Supabase)
Built-in Supabase authentication table.

**Key Fields**:
- `id` (UUID): Primary key
- `email` (TEXT): User email
- `created_at` (TIMESTAMP): Account creation time

### Table: `billables`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Owner of the billable |
| `date` | DATE | NOT NULL | Date of billable work |
| `client` | TEXT | NOT NULL | Client name |
| `matter` | TEXT | NOT NULL | Matter/project name |
| `time_amount` | DECIMAL(10,2) | NOT NULL, CHECK >= 0.1 | Hours worked |
| `description` | TEXT | NULLABLE | Optional notes |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Last update time |

**Indexes**:
- `billables_user_id_idx` on `user_id`
- `billables_date_idx` on `date DESC`
- `billables_user_date_idx` on `(user_id, date DESC)`

**RLS Policies**:
- Users can only SELECT/INSERT/UPDATE/DELETE their own billables

**Triggers**:
- `update_billables_updated_at`: Auto-updates `updated_at` on UPDATE

### Table: `subscriptions`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `user_id` | UUID | NOT NULL, UNIQUE, REFERENCES auth.users(id) ON DELETE CASCADE | One subscription per user |
| `tier` | TEXT | NOT NULL, DEFAULT 'free', CHECK IN ('free', 'pro') | Subscription tier |
| `status` | TEXT | NOT NULL, DEFAULT 'active', CHECK IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid') | Current status |
| `stripe_customer_id` | TEXT | NULLABLE | Stripe customer ID |
| `stripe_subscription_id` | TEXT | NULLABLE | Stripe subscription ID |
| `stripe_price_id` | TEXT | NULLABLE | Stripe price ID |
| `billing_interval` | TEXT | NULLABLE, CHECK IN ('month', 'year') | Billing frequency |
| `trial_start` | TIMESTAMP WITH TIME ZONE | NULLABLE | Trial start date |
| `trial_end` | TIMESTAMP WITH TIME ZONE | NULLABLE | Trial end date |
| `current_period_start` | TIMESTAMP WITH TIME ZONE | NULLABLE | Current billing period start |
| `current_period_end` | TIMESTAMP WITH TIME ZONE | NULLABLE | Current billing period end |
| `cancel_at_period_end` | BOOLEAN | DEFAULT false | If true, will cancel at end of period |
| `canceled_at` | TIMESTAMP WITH TIME ZONE | NULLABLE | When subscription was canceled |
| `entries_count_current_month` | INTEGER | DEFAULT 0 | Number of entries added this month |
| `exports_count_current_month` | INTEGER | DEFAULT 0 | Number of exports this month |
| `usage_reset_date` | DATE | DEFAULT CURRENT_DATE | Last date usage was reset |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Last update time |

**Indexes**:
- `subscriptions_user_id_idx` on `user_id`
- `subscriptions_stripe_customer_id_idx` on `stripe_customer_id`
- `subscriptions_stripe_subscription_id_idx` on `stripe_subscription_id`
- `subscriptions_tier_idx` on `tier`
- `subscriptions_status_idx` on `status`

**RLS Policies**:
- Users can SELECT and UPDATE their own subscription
- Only system (via triggers) can INSERT subscriptions

**Triggers**:
- `update_subscriptions_updated_at`: Auto-updates `updated_at` on UPDATE
- `on_auth_user_created`: Auto-creates free subscription when user signs up
- `on_billable_created`: Increments `entries_count_current_month` when billable is added

---

## Subscription Model & Limits

### Free Tier
- **Monthly Entry Limit**: 50 entries
- **Monthly Export Limit**: 1 export
- **Features**: Basic billable tracking, 1 CSV/Excel export per month
- **Price**: $0/month

### Pro Tier
- **Monthly Entry Limit**: Unlimited
- **Monthly Export Limit**: Unlimited
- **Features**: Unlimited billable tracking, unlimited exports
- **Price**: Set in Stripe (configured via Stripe Dashboard)

### Usage Reset Logic
- Usage counters (`entries_count_current_month`, `exports_count_current_month`) reset on the 1st of each month
- Reset happens automatically when:
  - A new entry is added (via trigger `increment_entry_count()`)
  - An export is requested (via API logic in `/api/export`)
- `usage_reset_date` tracks the last reset date

### Limit Enforcement
- **Entry Limits**: Enforced in frontend (`AddBillableForm`) and recommended for backend
- **Export Limits**: Enforced in backend (`/api/export`)
- Pro users bypass all limits when status is `active`

---

## API Endpoints

### Authentication Endpoints

All authentication is handled by Supabase Auth. No custom endpoints needed.

### User-Facing API Endpoints

#### 1. `GET /api/subscription`
**Purpose**: Fetch current user's subscription details

**Authentication**: Required (Supabase session)

**Response**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "tier": "free" | "pro",
  "status": "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "incomplete_expired" | "unpaid",
  "stripe_customer_id": "cus_xxx" | null,
  "stripe_subscription_id": "sub_xxx" | null,
  "entries_count_current_month": 12,
  "exports_count_current_month": 0,
  "usage_reset_date": "2025-12-01",
  "created_at": "2025-12-06T23:43:12.788109+00:00",
  "updated_at": "2025-12-14T11:42:42.112546+00:00"
}
```

**Errors**:
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Database error

---

#### 2. `POST /api/stripe/checkout`
**Purpose**: Create Stripe Checkout session for Pro subscription

**Authentication**: Required

**Request Body**:
```json
{
  "priceId": "price_xxx"
}
```

**Response**:
```json
{
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/..."
}
```

**Logic**:
1. Verifies user authentication
2. Fetches user's subscription
3. Creates Stripe customer if doesn't exist
4. Creates Checkout session
5. Redirects to dashboard on success/cancel

**Errors**:
- `400 Bad Request`: Missing priceId
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Stripe or database error

---

#### 3. `POST /api/stripe/portal`
**Purpose**: Create Stripe Customer Portal session for managing subscription

**Authentication**: Required

**Request Body**: None

**Response**:
```json
{
  "url": "https://billing.stripe.com/..."
}
```

**Logic**:
1. Verifies user has Stripe customer ID
2. Creates portal session
3. Returns portal URL

**Errors**:
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: No Stripe customer found
- `500 Internal Server Error`: Stripe error

---

#### 4. `POST /api/stripe/webhook`
**Purpose**: Handle Stripe webhook events

**Authentication**: Stripe signature verification

**Webhook Events Handled**:
- `checkout.session.completed`: Logs completion
- `customer.subscription.created`: Updates subscription record
- `customer.subscription.updated`: Updates subscription tier, status, billing info
- `customer.subscription.deleted`: Downgrades to free tier
- `invoice.payment_succeeded`: Logs
- `invoice.payment_failed`: Sends payment failed email via Resend

**Subscription Update Logic** (`handleSubscriptionUpdated`):
- Sets `tier` to 'pro' if status is 'active', else 'free'
- Updates `status`, `stripe_subscription_id`, `stripe_customer_id`, `stripe_price_id`
- Updates `billing_interval`, `current_period_start`, `current_period_end`
- Updates `cancel_at_period_end`

**Errors**:
- `400 Bad Request`: Invalid signature
- `500 Internal Server Error`: Webhook handler failed

---

#### 5. `POST /api/export`
**Purpose**: Export billables to CSV or Excel

**Authentication**: Required

**Request Body**:
```json
{
  "startDate": "2025-12-01",
  "endDate": "2025-12-31",
  "format": "csv" | "xlsx",
  "clientFilter": "JA McLaren" (optional),
  "matterFilter": "McLaren v. Jumanji" (optional),
  "customFilename": "custom_name.csv" (optional)
}
```

**Response**: File download (CSV or Excel)

**Headers**:
- `Content-Type`: `text/csv` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition`: `attachment; filename="..."`

**Logic**:
1. Validates date range (max 6 months)
2. Checks user's subscription and export limit (free: 1/month)
3. Resets usage counters if new month
4. Fetches billables in batches (max 100,000 rows)
5. Generates CSV or Excel file
6. Increments export count for free users

**Export Format**:
- **Columns**: Date, Client, Matter, Hours, Description
- **Date Format**: MM/DD/YYYY (American)
- **Filename Format**: `{client}_{matter}_{DDMMYYYY}_{DDMMYYYY}.{ext}`

**Errors**:
- `400 Bad Request`: Invalid parameters or date range > 6 months
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: Export limit reached (free tier)
- `404 Not Found`: Subscription not found
- `500 Internal Server Error`: Database error

**Upgrade Prompt** (403 response):
```json
{
  "error": "Export limit reached",
  "upgrade": true,
  "message": "You've used your 1 free export for this month. Upgrade to Pro for unlimited exports!"
}
```

---

#### 6. `GET /api/analytics/last-7-days`
**Purpose**: Get analytics data for the last 7 days

**Authentication**: Required

**Response**:
```json
{
  "dailyData": [
    {
      "date": "2025-12-08",
      "dayName": "Mon",
      "hours": 3.5,
      "entries": 2
    },
    // ... 7 days
  ],
  "stats": {
    "totalHours": 25.5,
    "dailyAverage": 3.64,
    "mostProductiveDay": {
      "dayName": "Tue",
      "date": "2025-12-09",
      "hours": 8.0
    },
    "totalEntries": 10,
    "topClient": {
      "client": "JA McLaren",
      "hours": 15.2
    }
  }
}
```

**Logic**:
1. Calculates last 7 days (including today)
2. Fetches all billables in that range
3. Aggregates by day
4. Calculates stats (total hours, daily average, most productive day, top client)

**Errors**:
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Database error

---

## Stripe Integration

### Configuration
- **API Version**: `2024-11-20.acacia`
- **Webhook Secret**: Set in `STRIPE_WEBHOOK_SECRET` env var
- **Service**: Stripe Node SDK

### Products & Prices
- Configured in Stripe Dashboard
- Price IDs passed to checkout via `priceId` parameter
- Billing intervals: Monthly or Yearly

### Customer Portal
- Managed via `stripe.billingPortal.sessions.create()`
- Allows users to:
  - Update payment method
  - View invoices
  - Cancel subscription
  - Download receipts

### Webhooks
- Must be configured in Stripe Dashboard
- Endpoint: `https://your-domain.com/api/stripe/webhook`
- Required events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

---

## Authentication & Authorization

### Authentication Provider
- **Supabase Auth**
- **Methods**: Google OAuth, Email/Password
- **Session Management**: JWT tokens, HTTP-only cookies

### OAuth Setup
- Google OAuth client configured in Supabase Dashboard
- Redirect URLs configured for localhost and production

### Authorization
- **Row-Level Security (RLS)**: Enabled on all tables
- **User Identification**: `auth.uid()` function in RLS policies
- **API Authentication**: All API routes check `supabase.auth.getUser()`

### Admin vs User
- **Currently**: No admin role exists
- **All users**: Regular users with access to their own data only
- **Admin page**: Would require adding admin role/flag to users table or metadata

---

## Environment Variables

### Required Environment Variables

#### Supabase
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # For webhook bypassing RLS
```

#### Stripe
```bash
STRIPE_SECRET_KEY=sk_test_xxx  # or sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

#### Application
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL
```

### Environment Files
- `.env.local`: Local development (gitignored)
- `.env.example`: Template for required variables
- Production: Set in Vercel dashboard

---

## Current Features

### Dashboard (`/dashboard`)
- View all billables in reverse chronological order
- Real-time updates (via Supabase Realtime)
- Inline editing of billables
- Delete billables with confirmation
- Usage indicators (free tier: X/50 entries, X/1 exports)

### Add Billable Form
- Fields: Date, Client, Matter, Hours, Description (optional)
- Validation: Date required, hours >= 0.1
- Auto-resets on success
- Shows upgrade prompt if limit reached (free tier)

### Export Feature
- Date range selection (max 6 months)
- Client and Matter filters (optional)
- Format selection (CSV or Excel)
- Custom filename preview
- Usage indicator (free tier: X/1 exports)
- Upgrade prompt on limit

### Analytics Feature
- Last 7 days bar chart
- Stats: Total hours, daily average, most productive day, top client
- Real-time updates

### Subscription Management (Partial)
- View current subscription details
- **Missing**: Upgrade/downgrade UI, cancel UI (currently only via Stripe portal)

### Sign Out
- Simple sign-out button

---

## Business Logic & Rules

### Entry Limit Enforcement
1. **Free Tier**: 50 entries/month
2. **Check**: Before allowing INSERT into `billables`
3. **Frontend**: `AddBillableForm` checks `canAddEntry()`
4. **Backend**: Auto-increment via trigger `on_billable_created`
5. **Reset**: Automatic on 1st of month

### Export Limit Enforcement
1. **Free Tier**: 1 export/month
2. **Check**: In `/api/export` before generating file
3. **Reset**: Automatic on 1st of month
4. **Increment**: After successful export

### Subscription Status Logic
- **Active**: Full access to tier features
- **Past Due**: Should limit access (not fully implemented)
- **Canceled**: Downgrades to free tier
- **Incomplete/Unpaid**: Should block Pro features

### Tier Downgrade
- When subscription is canceled or deleted in Stripe
- Sets `tier = 'free'`, `status = 'canceled'`
- Usage limits apply immediately

### Tier Upgrade
- When checkout completes and subscription becomes active
- Sets `tier = 'pro'`
- Removes all limits

---

## Admin Page Requirements

**Focus**: Customer support + Business monitoring
**Philosophy**: Simple, powerful, and secure

---

## Core Features

### 1. Analytics Dashboard (Landing Page)

**Purpose**: At-a-glance business health monitoring

**Key Metrics Cards**:
- **Total Users**
  - Count: All time
  - New users: Last 7 days, Last 30 days
  - Growth rate: % change month-over-month

- **Revenue Overview**
  - MRR (Monthly Recurring Revenue)
  - ARR (Annual Recurring Revenue)
  - Total revenue this month
  - Revenue trend chart (last 6 months)

- **Subscription Breakdown**
  - Free users: count + percentage
  - Pro users: count + percentage
  - Canceled: count this month

- **User Activity**
  - Total billables created: All time, Last 30 days
  - Average entries per active user
  - Export usage: Total, by tier
  - Most active users (top 5)

**Charts**:
- User growth over time (line chart, last 6 months)
- Revenue by billing interval (monthly vs yearly)
- Free vs Pro user ratio (pie or donut chart)
- Daily active users (last 30 days)

**Quick Actions**:
- Jump to user search
- View all subscriptions
- View recent support actions (audit log)

---

### 2. User Management

#### User List View
**Layout**: Searchable, filterable, paginated table

**Table Columns**:
- Email
- Created Date
- Subscription Tier (badge: Free/Pro)
- Status (badge: active/canceled/past_due/etc)
- Billables Count (current month / all time)
- Exports Used (current month)
- Last Active Date
- Actions (View Details button)

**Filters**:
- Tier: All, Free, Pro
- Status: All, Active, Canceled, Past Due
- Date Range: Custom range for created_at
- Search: By email (fuzzy search)

**Pagination**: 25 users per page

**Sort Options**: Email, Created Date, Last Active (ascending/descending)

#### User Detail View
**Opened via**: Click user in table or search

**Sections**:

1. **User Profile**
   - User ID (UUID, copyable)
   - Email
   - Account created date
   - Last sign-in date
   - Authentication method (Google OAuth / Email)

2. **Subscription Details**
   - Current Tier (badge)
   - Current Status (badge)
   - Stripe Customer ID (link to Stripe dashboard)
   - Stripe Subscription ID (link to Stripe dashboard)
   - Billing Interval (monthly/yearly)
   - Current Period: Start - End dates
   - Cancel at Period End: Yes/No
   - Last Updated: Timestamp

3. **Usage Stats (Current Month)**
   - Entries: X / 50 (or Unlimited for Pro)
   - Exports: X / 1 (or Unlimited for Pro)
   - Usage reset date
   - Total billables (all time)

4. **Recent Billables** (Last 10)
   - Date, Client, Matter, Hours
   - Created date
   - **"View All" Button**: Expands to show paginated table of all billables
     - Pagination: 25 billables per page
     - Sort by date (desc), client, matter
     - Shows total count

5. **Support Actions** (Admin Controls)
   - **Reset Usage Counters**: Button to reset entries_count and exports_count to 0
   - **Change Tier**: Dropdown (Free/Pro) + Confirm button
     - Warning: "This will override Stripe subscription. Use carefully."
   - **Change Status**: Dropdown (all valid statuses) + Confirm button
     - Warning: "This may affect user access immediately."
   - **View as User**: Button to open new tab with user's dashboard (read-only view)
     - Note: Per requirements, this is "just view user data" not full impersonation

6. **Admin Audit Log** (For This User)
   - Recent admin actions on this user (last 10)
   - Admin email, Action, Notes (if any), Timestamp
   - "View All" link to full audit log filtered by this user

**Confirmation Modals**: All support actions require confirmation dialog

---

### 3. Subscription Overrides

**Purpose**: Manual adjustments for support cases, billing issues, or special circumstances

**Access**: From User Detail View or dedicated Subscription Management page

**Available Actions**:

1. **Reset Usage Counters**
   - Resets entries_count_current_month and exports_count_current_month to 0
   - Updates usage_reset_date to current date
   - Use case: User reports billing error, accidental usage, or goodwill gesture

2. **Grant Temporary Pro Access**
   - Changes tier to 'pro' for specified duration
   - Sets an "override_until" date (requires new DB field)
   - Use case: Compensate for downtime, special arrangement for enterprise lead

3. **Force Tier Change**
   - Manually set tier to free or pro
   - Does NOT modify Stripe subscription (admin must handle separately)
   - Warning displayed: "This does not cancel/create Stripe subscription"
   - Use case: Sync issues, lifetime deals, special arrangements

5. **Force Status Change**
   - Manually set status to any valid value
   - Warning displayed about potential access impact
   - Use case: Fix sync issues, handle edge cases

**Audit Trail**: All actions logged to admin_audit_log table

---

### 4. Stripe Integration (Minimal)

**Purpose**: Show Stripe sync status and provide quick links

**Features**:

1. **Stripe Sync Status Banner** (Top of admin page)
   - Last webhook received: Timestamp
   - Webhook health: Green (recent) / Yellow (>1hr) / Red (>24hr)
   - Quick link: "View Stripe Dashboard"

2. **In User Detail View**:
   - Stripe Customer ID: Displayed as clickable link → Opens Stripe customer page
   - Stripe Subscription ID: Displayed as clickable link → Opens Stripe subscription page
   - Note: "Manage billing, invoices, and payment methods in Stripe Dashboard"

3. **Manual Sync Button** (Optional, Future)
   - Button to fetch latest subscription data from Stripe API
   - Updates subscription record in database
   - Use case: Troubleshooting sync issues

**No Built-In Features**:
- No invoice viewing (use Stripe dashboard)
- No payment history (use Stripe dashboard)
- No subscription creation/cancellation (use Stripe dashboard)
- No webhook replay (use Stripe dashboard or CLI)

---

## Technical Implementation

### Database Changes

#### 1. Admin Table
```sql
CREATE TABLE admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) -- Admin who granted access
);

CREATE INDEX admins_user_id_idx ON admins(user_id);

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admins WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. Audit Log Table
```sql
CREATE TABLE admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL, -- e.g., 'reset_usage', 'change_tier', 'change_status'
  target_user_id UUID REFERENCES auth.users(id),
  details JSONB, -- Store old/new values, changes made
  notes TEXT, -- Optional admin notes/reason
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX admin_audit_log_admin_user_id_idx ON admin_audit_log(admin_user_id);
CREATE INDEX admin_audit_log_target_user_id_idx ON admin_audit_log(target_user_id);
CREATE INDEX admin_audit_log_created_at_idx ON admin_audit_log(created_at DESC);
```

#### 3. Subscription Table Updates (Optional)
```sql
-- Add temporary override field (if implementing temporary Pro access)
ALTER TABLE subscriptions
ADD COLUMN override_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index
CREATE INDEX subscriptions_override_until_idx ON subscriptions(override_until);
```

#### 4. Add First Admin User

After creating the tables above, add the first admin user:

```sql
-- First, find the user_id for rod.de.coelho@gmail.com
-- (This assumes the user has already signed up via the app)
INSERT INTO admins (user_id, created_by)
SELECT id, id
FROM auth.users
WHERE email = 'rod.de.coelho@gmail.com';
```

**Note**: The user must have an account in the system before being added as an admin. If the account doesn't exist yet:
1. Sign up via the app first (using Google OAuth or email/password)
2. Then run the SQL above to grant admin access

To add additional admins in the future, use the same SQL with different email addresses.

#### 5. RLS Policies for Admin Access

**Admins Table**:
```sql
-- Admins can view all admins
CREATE POLICY "Admins can view admins table"
  ON admins FOR SELECT
  USING (is_admin(auth.uid()));
```

**Subscriptions Table** (Update existing):
```sql
-- Admins can view all subscriptions (add to existing policy)
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid() OR is_admin(auth.uid())
  );

-- Admins can update any subscription
CREATE POLICY "Admins can update any subscription"
  ON subscriptions FOR UPDATE
  USING (is_admin(auth.uid()));
```

**Billables Table** (Update existing):
```sql
-- Admins can view all billables
CREATE POLICY "Admins can view all billables"
  ON billables FOR SELECT
  USING (
    user_id = auth.uid() OR is_admin(auth.uid())
  );
```

**Audit Log Table**:
```sql
-- Admins can insert and view audit logs
CREATE POLICY "Admins can insert audit logs"
  ON admin_audit_log FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can view audit logs"
  ON admin_audit_log FOR SELECT
  USING (is_admin(auth.uid()));
```

---

### API Endpoints

All admin endpoints under `/api/admin/*`

#### Authentication Middleware
All admin routes must:
1. Check user is authenticated (`supabase.auth.getUser()`)
2. Check user is admin (`is_admin()` helper or query admins table)
3. Return 403 if not admin

#### 1. `GET /api/admin/analytics/dashboard`
**Purpose**: Fetch all dashboard metrics

**Response**:
```json
{
  "totalUsers": 1250,
  "newUsers": {
    "last7Days": 45,
    "last30Days": 180,
    "growthRate": 16.5
  },
  "revenue": {
    "mrr": 2450.00,
    "arr": 29400.00,
    "thisMonth": 2600.00,
    "trend": [
      { "month": "2025-07", "revenue": 1200 },
      { "month": "2025-08", "revenue": 1500 },
      // ... 6 months
    ]
  },
  "subscriptions": {
    "free": { "count": 950, "percentage": 76 },
    "pro": { "count": 280, "percentage": 22 },
    "canceledThisMonth": 15
  },
  "activity": {
    "totalBillables": 45230,
    "billablesLast30Days": 3450,
    "avgEntriesPerActiveUser": 12.4,
    "exportsTotal": 1520,
    "exportsByTier": {
      "free": 890,
      "pro": 630
    },
    "topUsers": [
      { "email": "user@example.com", "billables": 450, "tier": "pro" },
      // ... top 5
    ]
  },
  "userGrowth": [
    { "date": "2025-08-01", "totalUsers": 1050 },
    // ... last 6 months
  ],
  "dailyActiveUsers": [
    { "date": "2025-12-14", "count": 320 },
    // ... last 30 days
  ]
}
```

---

#### 2. `GET /api/admin/users`
**Purpose**: List all users with pagination and filters

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 25, max: 100)
- `search` (email search)
- `tier` (free/pro/all)
- `status` (active/canceled/past_due/all)
- `sort` (email/created_at/last_active)
- `order` (asc/desc)

**Response**:
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
    },
    // ... more users
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

#### 3. `GET /api/admin/users/[userId]`
**Purpose**: Get detailed info for specific user

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2025-01-15T10:30:00Z",
    "last_sign_in_at": "2025-12-14T08:45:00Z",
    "auth_provider": "google"
  },
  "subscription": {
    "id": "uuid",
    "tier": "pro",
    "status": "active",
    "stripe_customer_id": "cus_xxx",
    "stripe_subscription_id": "sub_xxx",
    "billing_interval": "month",
    "current_period_start": "2025-12-01T00:00:00Z",
    "current_period_end": "2026-01-01T00:00:00Z",
    "trial_start": null,
    "trial_end": null,
    "cancel_at_period_end": false,
    "entries_count_current_month": 23,
    "exports_count_current_month": 5,
    "usage_reset_date": "2025-12-01",
    "updated_at": "2025-12-14T11:42:00Z"
  },
  "recentBillables": [
    {
      "id": "uuid",
      "date": "2025-12-14",
      "client": "JA McLaren",
      "matter": "McLaren v. Jumanji",
      "time_amount": 3.5,
      "created_at": "2025-12-14T10:30:00Z"
    },
    // ... last 10
  ],
  "billablesTotalCount": 450,
  "auditLog": [
    {
      "id": "uuid",
      "admin_email": "admin@example.com",
      "action": "reset_usage",
      "notes": "Billing error compensation",
      "details": { "entries_reset": true, "exports_reset": true },
      "created_at": "2025-12-10T15:20:00Z"
    },
    // ... last 10 actions
  ]
}
```

---

#### 4. `POST /api/admin/users/[userId]/reset-usage`
**Purpose**: Reset usage counters for user

**Request Body** (optional):
```json
{
  "notes": "Billing error - goodwill gesture" // optional
}
```

**Response**:
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

**Side Effects**:
- Updates subscription record
- Creates audit log entry (includes optional notes if provided)

---

#### 5. `POST /api/admin/users/[userId]/change-tier`
**Purpose**: Manually change user's tier

**Request Body**:
```json
{
  "tier": "pro", // required: "free" or "pro"
  "notes": "Lifetime deal - Black Friday 2025" // optional
}
```

**Response**:
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

**Side Effects**:
- Updates subscription.tier
- Creates audit log entry (includes optional notes if provided)
- Does NOT modify Stripe (admin must handle separately)

---

#### 6. `POST /api/admin/users/[userId]/change-status`
**Purpose**: Manually change subscription status

**Request Body**:
```json
{
  "status": "active", // required: valid subscription status
  "notes": "Manual sync after Stripe issue" // optional
}
```

**Response**:
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

**Side Effects**:
- Updates subscription.status
- Creates audit log entry (includes optional notes if provided)

---

#### 7. `GET /api/admin/audit-log`
**Purpose**: View recent admin actions

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 50)
- `admin_user_id` (filter by admin)
- `target_user_id` (filter by target user)
- `action` (filter by action type)

**Response**:
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
    },
    // ... more logs
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

### Frontend Structure

**Route**: `/admin` (protected route, requires admin check)

**Layout**:
```
/admin
  ├── /dashboard (Analytics landing page)
  ├── /users (User list)
  ├── /users/[userId] (User detail)
  └── /audit-log (Admin action history)
```

**Components**:
- `AdminLayout`: Sidebar nav, admin banner, signout
- `MetricCard`: Reusable card for dashboard metrics
- `UserTable`: Sortable, filterable, paginated table
- `UserDetailView`: Detailed user info + support actions
- `SubscriptionBadge`: Colored badge for tier/status
- `ConfirmModal`: Confirmation dialog for destructive actions
- `AuditLogTable`: Table for admin actions

**Tech Stack**:
- **Framework**: Next.js (app router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts (already in dependencies)
- **Tables**: Headless UI or custom (avoid heavy dependencies)
- **State**: React hooks + fetch

---

## Security Checklist

### Authentication & Authorization
- ✅ Admin check on all `/api/admin/*` routes
- ✅ Admin check on all `/admin/*` pages (redirect to login if not admin)
- ✅ Use `is_admin()` helper function for consistent checks
- ✅ RLS policies updated to allow admin access

### Audit Logging
- ✅ Log ALL admin actions (reset usage, tier changes, status changes, etc.)
- ✅ Include admin user ID, target user ID, action type, details, timestamp
- ✅ IP address logging (optional but recommended)

### Input Validation
- ✅ Validate all admin action inputs (tier values, status values, dates)
- ✅ Sanitize user search inputs
- ✅ Verify user exists before applying changes

### Rate Limiting
- ✅ Consider rate limiting admin endpoints (100 requests/minute per admin)
- ✅ Prevent abuse of manual actions

### Data Protection
- ✅ Do not expose user passwords or auth tokens
- ✅ Do not expose Stripe secret keys or webhook secrets
- ✅ Minimize PII exposure (only show what's needed)

### Session Management
- ✅ Admin sessions use same Supabase auth
- ✅ Consider shorter session timeout for admin users (optional)

---

## Implementation Phases

### Phase 1: MVP (Must-Have)
1. Database setup (admins table, audit log, RLS policies)
2. Admin authentication check middleware
3. Analytics dashboard API + UI
4. User list API + UI (with search/filter)
5. User detail view API + UI
6. Reset usage counters action

**Timeline**: Core functionality for support and monitoring

### Phase 2: Full Support Tools
1. Change tier/status actions
2. Audit log viewer
4. Stripe sync status banner
5. Improved filtering and pagination

**Timeline**: Complete support toolkit

### Phase 3: Enhancements (Nice-to-Have)
1. Temporary Pro access with expiration
2. Advanced analytics (cohort analysis, retention, LTV)
3. Email notification triggers (manual)
4. Bulk operations (multi-user actions)
5. Export admin reports to CSV

**Timeline**: Future improvements

---

## Implementation Decisions (Finalized)

1. **Admin User Creation**: Manual SQL insert into admins table
   - First admin: rod.de.coelho@gmail.com
   - Additional admins can be added via SQL or future admin UI

2. **Admin Access Levels**: Single "admin" role (all permissions)
   - All admins have full access to all features
   - Future: Can expand to multiple roles if needed

3. **Reason Field**: Optional (not required for now)
   - Actions can be performed quickly without mandatory reason
   - Admins can optionally add notes in the UI
   - Audit log still tracks who/what/when

4. **User Billables View**: Recent 10 + expandable view
   - Show last 10 billables in user detail view by default
   - "View All" expandable section with pagination for full history
   - Prevents performance issues for power users with thousands of entries

5. **IP Restrictions**: None (rely on authentication only)
   - Admin access controlled via Supabase auth + admin table check
   - Future: Can add IP allowlist if needed

---

## Summary

This finalized specification provides a complete blueprint for building a secure, efficient admin page for TrackBillables with the following characteristics:

**Scope**:
- ✅ Customer support focus (user troubleshooting, manual adjustments)
- ✅ Business monitoring (analytics dashboard, revenue metrics)
- ✅ Minimal Stripe integration (view-only, manage in Stripe dashboard)
- ✅ Single admin role with full access
- ✅ Optional notes for admin actions (not required)
- ✅ No IP restrictions (auth-only)

**Core Components**:
1. **Analytics Dashboard** - Complete business metrics at a glance
2. **User Management** - Search, filter, view detailed user info
3. **Support Actions** - Reset usage, change tier/status
4. **Audit Logging** - Full transparency of all admin actions

**Database Requirements**:
- Admins table with helper function
- Audit log table with notes field
- Updated RLS policies for admin access
- First admin: rod.de.coelho@gmail.com

**API Structure**:
- 8 admin endpoints under `/api/admin/*`
- Authentication middleware on all routes
- Optional notes parameter on action endpoints
- Comprehensive error handling

**Frontend Structure**:
- 4 main routes (dashboard, users, user detail, audit log)
- Reusable components (cards, tables, badges, modals)
- Tailwind CSS styling with Recharts for analytics

**Security**:
- Admin check on all routes
- Full audit logging
- Input validation
- No PII exposure beyond necessary
- Confirmation modals for destructive actions

**Implementation Path**:
- Phase 1 (MVP): Database setup, analytics, user management, basic actions
- Phase 2: Complete support tools, audit viewer, filtering
- Phase 3: Enhancements (temporary access, advanced analytics, bulk ops)

This specification is now ready for implementation. All design decisions have been made, and the technical details are fully defined.

---

## Additional Notes

### TODOs Identified in Code
1. **Email Notifications** (`app/api/stripe/webhook/route.ts:158, 168`)
   - Send welcome email for new users
   - Send payment failed notice

2. **Subscription Management UI** (Not yet implemented)
   - Allow users to upgrade from free to pro
   - Allow users to downgrade or cancel
   - Show pricing comparison

### Known Limitations
- **No admin interface**: All admin tasks require direct database access
- **No email system**: No transactional emails
- **No user analytics**: Users can't see their own usage trends beyond 7 days
- **No multi-tenancy**: Each user is independent (no team/organization support)
- **No data retention policy**: Old data never expires

### Potential Future Features
- Team/organization support (multi-user accounts)
- Invoice generation from billables
- Integration with accounting software (QuickBooks, Xero)
- Mobile app
- API for third-party integrations
- Custom fields for billables
- Time tracking (start/stop timer)
- Recurring billable templates

---

## Conclusion

This document provides a comprehensive overview of the TrackBillables application, including all database schemas, API endpoints, subscription logic, and Stripe integration. Use this information to design an admin page that allows you to:

1. Manage users and subscriptions
2. View platform analytics
3. Handle support requests
4. Configure system settings
5. Monitor Stripe integration
6. Perform database operations

The admin page should be secure, well-organized, and provide all necessary tools to effectively manage the SaaS business.
