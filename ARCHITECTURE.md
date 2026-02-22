# TrackBillables Architecture Documentation

## Overview

TrackBillables is a full-stack SaaS application for legal professionals to track billable time and manage client work. The application integrates multiple cloud services to provide authentication, database management, payment processing, and hosting.

## Technology Stack

- **Frontend**: Next.js 14.2.35 (React, App Router, TypeScript, Tailwind CSS)
- **Hosting**: Vercel
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **OAuth Provider**: Google Cloud Platform
- **Payment Processing**: Stripe
- **Email**: Google Workspace SMTP (for transactional emails)

---

## Service Integration Architecture

### 1. Vercel (Hosting & Deployment)

**Role**: Serverless hosting platform for the Next.js application

**Configuration**:
- **Project Name**: `track-billables-rfy5`
- **Production URL**: https://trackbillables.com
- **Deployment**: Automatic deployment on git push to main branch
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

**Environment Variables** (configured in Vercel dashboard):
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abhplcdqblijxfvcbfgj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key]
SUPABASE_SERVICE_ROLE_KEY=[service role key]

# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[test publishable key]
STRIPE_SECRET_KEY=[test secret key]
STRIPE_WEBHOOK_SECRET=[webhook secret]
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=[monthly price ID]
NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL=[annual price ID]

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=[gmail address]
SMTP_PASSWORD=[app-specific password]
SMTP_FROM=[from email address]

# Application
NEXT_PUBLIC_APP_URL=https://trackbillables.com
```

**Key Features**:
- Automatic SSL/TLS certificates
- Edge network CDN
- Serverless functions for API routes
- Preview deployments for branches
- Domain management (trackbillables.com purchased through Vercel)

---

### 2. Supabase (Database & Authentication)

**Role**: Backend-as-a-Service providing PostgreSQL database and authentication

**Configuration**:
- **Project**: `abhplcdqblijxfvcbfgj`
- **API URL**: https://abhplcdqblijxfvcbfgj.supabase.co
- **Region**: US East (default)

**Database Schema**:

```sql
-- Users inherit from Supabase auth.users table

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free', -- 'free' or 'pro'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  billing_interval TEXT, -- 'month' or 'year'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  entries_count_current_month INTEGER DEFAULT 0,
  exports_count_current_month INTEGER DEFAULT 0,
  usage_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billables table
CREATE TABLE billables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  matter_number TEXT NOT NULL,
  activity_date DATE NOT NULL,
  activity_description TEXT NOT NULL,
  hours DECIMAL(10,2) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) GENERATED ALWAYS AS (hours * rate) STORED,
  billable_type TEXT NOT NULL, -- 'billable' or 'non-billable'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users table
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin audit log
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  details JSONB,
  notes TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Row Level Security (RLS)**:
- Users can only read/write their own billables
- Users can only read their own subscription data
- Admin users can read all data via service role key
- Subscription updates restricted to authenticated API routes

**Authentication**:
- **Provider**: Google OAuth (via Google Cloud Platform)
- **OAuth Redirect URLs** (configured in Supabase):
  - `http://localhost:3000/auth/callback` (development)
  - `https://trackbillables.com/auth/callback` (production)
  - `https://www.trackbillables.com/auth/callback` (production - www variant)
- **Site URL**: `https://trackbillables.com`

**Database Functions**:
```sql
-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**API Access**:
- **Client-side**: Anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY) - respects RLS
- **Server-side**: Service role key (SUPABASE_SERVICE_ROLE_KEY) - bypasses RLS for admin operations

---

### 3. Google Cloud Platform (OAuth Provider)

**Role**: Provides OAuth 2.0 credentials for Google Sign-In

**Configuration**:
- **Project**: (configured in GCP Console)
- **OAuth Client ID**: Web application
- **Authorized JavaScript origins**:
  - `http://localhost:3000` (development)
  - `https://trackbillables.com` (production)
  - `https://www.trackbillables.com` (production - www variant)
- **Authorized redirect URIs**: Managed by Supabase (points to Supabase OAuth callback)

**Integration Flow**:
1. User clicks "Sign in with Google" button
2. Next.js calls Supabase client with `signInWithOAuth({ provider: 'google' })`
3. Supabase redirects to Google OAuth consent screen (using GCP credentials)
4. User authenticates with Google
5. Google redirects to Supabase callback URL
6. Supabase exchanges code for session
7. Supabase redirects to `/auth/callback` in our Next.js app
8. Next.js exchanges code for session and redirects to `/dashboard`

---

### 4. Stripe (Payment Processing)

**Role**: Subscription billing and payment processing

**Configuration**:
- **Mode**: Test mode (production mode pending approval)
- **Products**:
  - Pro Monthly: $10/month
  - Pro Annual: $100/year (20% savings)
- **Webhook URL**: `https://trackbillables.com/api/stripe/webhook`

**Stripe Integration Architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                     User Actions                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Next.js Frontend (Client Components)                       │
│  - /pricing page: Display plans, select billing interval    │
│  - /billing page: View subscription, manage subscription    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Next.js API Routes (Server)                                │
│                                                              │
│  /api/stripe/checkout (POST)                                │
│  ├── Get/create Stripe customer                             │
│  ├── Create Checkout Session                                │
│  └── Return session URL                                     │
│                                                              │
│  /api/stripe/portal (POST)                                  │
│  ├── Get Stripe customer ID from subscription               │
│  ├── Create Customer Portal Session                         │
│  └── Return portal URL                                      │
│                                                              │
│  /api/stripe/webhook (POST)                                 │
│  ├── Verify webhook signature                               │
│  ├── Handle events:                                         │
│  │   - checkout.session.completed                           │
│  │   - customer.subscription.created                        │
│  │   - customer.subscription.updated                        │
│  │   - customer.subscription.deleted                        │
│  └── Sync to Supabase                                       │
│                                                              │
│  /api/subscription (GET)                                    │
│  └── Fetch current user's subscription from Supabase        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Stripe Service (External)                                  │
│  - Customer management                                      │
│  - Subscription lifecycle                                   │
│  - Payment processing                                       │
│  - Webhook events                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase (Database)                                        │
│  - subscriptions table stores:                              │
│    - tier ('free' or 'pro')                                 │
│    - status ('active', 'canceled', 'past_due')              │
│    - stripe_customer_id                                     │
│    - stripe_subscription_id                                 │
│    - billing_interval ('month' or 'year')                   │
│    - period dates, cancellation info                        │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:
- `lib/stripe/config.ts`: Stripe initialization and configuration
- `lib/stripe/helpers.ts`: Reusable functions for customer creation, subscription sync
- `app/api/stripe/checkout/route.ts`: Create Checkout Session
- `app/api/stripe/portal/route.ts`: Create Customer Portal Session
- `app/api/stripe/webhook/route.ts`: Handle Stripe webhooks
- `app/pricing/page.tsx`: Pricing page UI
- `app/billing/page.tsx`: Billing management UI

**Subscription Flow**:

1. **User Upgrades to Pro**:
   - User clicks "Upgrade to Pro" on `/pricing`
   - Frontend calls `/api/stripe/checkout` with selected price ID
   - Backend creates/retrieves Stripe customer (linked to Supabase user_id via metadata)
   - Backend creates Checkout Session with success/cancel URLs
   - User redirected to Stripe Checkout
   - User completes payment
   - Stripe redirects to `/billing?success=true&session_id=xxx`

2. **Webhook Sync** (happens in parallel):
   - Stripe sends `checkout.session.completed` webhook
   - Webhook handler verifies signature
   - Webhook retrieves subscription from Stripe
   - Webhook calls `syncSubscriptionToSupabase()` which upserts:
     ```javascript
     {
       user_id: userId,
       tier: 'pro',
       status: 'active',
       stripe_customer_id: customerId,
       stripe_subscription_id: subscriptionId,
       billing_interval: 'month' or 'year',
       current_period_start: startDate,
       current_period_end: endDate,
       // ... other fields
     }
     ```

3. **User Views Billing Page**:
   - Frontend calls `/api/subscription`
   - Backend queries Supabase `subscriptions` table
   - Returns current tier, status, usage counts, period dates

4. **User Manages Subscription**:
   - User clicks "Manage Subscription" on `/billing`
   - Frontend calls `/api/stripe/portal`
   - Backend creates Customer Portal Session
   - User redirected to Stripe Customer Portal
   - User can change plan, update payment method, cancel subscription
   - Stripe sends webhooks for any changes
   - Webhooks sync changes back to Supabase

**Webhook Events Handled**:
- `checkout.session.completed`: Initial subscription creation
- `customer.subscription.created`: New subscription (redundant with checkout but safer)
- `customer.subscription.updated`: Plan changes, renewals, cancellations scheduled
- `customer.subscription.deleted`: Immediate cancellation or end of cancel_at_period_end

**Usage Limits** (enforced in API routes):
- Free tier: 50 billable entries/month, 1 export/month
- Pro tier: Unlimited entries and exports
- Counters tracked in `subscriptions.entries_count_current_month` and `exports_count_current_month`
- Reset monthly via scheduled job or on-demand via admin panel

---

## Authentication Flow

```
┌──────────────┐
│   User       │
└──────┬───────┘
       │ 1. Clicks "Sign in with Google"
       ▼
┌──────────────────────────────────────┐
│  Next.js Frontend                    │
│  (createClient from @/lib/supabase)  │
└──────┬───────────────────────────────┘
       │ 2. supabase.auth.signInWithOAuth({ provider: 'google' })
       ▼
┌──────────────────────────────────────┐
│  Supabase Auth Service               │
└──────┬───────────────────────────────┘
       │ 3. Redirects to Google OAuth
       ▼
┌──────────────────────────────────────┐
│  Google OAuth (GCP)                  │
└──────┬───────────────────────────────┘
       │ 4. User authenticates
       │ 5. Google redirects to Supabase callback
       ▼
┌──────────────────────────────────────┐
│  Supabase Auth Service               │
│  - Creates/updates auth.users record │
│  - Generates session                 │
└──────┬───────────────────────────────┘
       │ 6. Redirects to /auth/callback?code=xxx
       ▼
┌──────────────────────────────────────┐
│  Next.js /auth/callback route        │
│  - Exchanges code for session        │
│  - Sets session cookie               │
│  - Checks if admin user              │
│  - Creates subscription record       │
└──────┬───────────────────────────────┘
       │ 7. Redirects to /dashboard
       ▼
┌──────────────────────────────────────┐
│  Dashboard Page                      │
│  - User authenticated                │
│  - Session persisted in cookie       │
└──────────────────────────────────────┘
```

**Session Management**:
- Sessions stored in HTTP-only cookies
- Server components use `createClient()` from `@/lib/supabase/server`
- Client components use `createClient()` from `@/lib/supabase/client`
- Admin operations use `createAdminClient()` from `@/lib/supabase/admin` (service role key)

---

## Admin Panel Architecture

**Access Control**:
- Admin status determined by presence in `admin_users` table
- `is_admin(user_uuid)` database function checks admin status
- `verifyAdmin()` helper in `lib/admin/helpers.ts` enforces access control in API routes

**Admin Features** (`/admin` pages):
- **Dashboard**: Overview of all users, subscriptions, revenue metrics
- **User Management**: View all users, search, filter by tier/status
- **Subscription Management**:
  - Reset usage counters
  - Change subscription tier (free ↔ pro)
  - Change subscription status
- **Audit Logging**: All admin actions logged to `admin_audit_log` table

**Admin API Routes**:
- `/api/admin/users` - List all users with subscriptions
- `/api/admin/users/[userId]` - Get single user details
- `/api/admin/users/[userId]/reset-usage` - Reset monthly usage counters
- `/api/admin/users/[userId]/change-tier` - Manually change subscription tier
- `/api/admin/users/[userId]/change-status` - Manually change subscription status
- `/api/analytics/revenue` - Revenue metrics
- `/api/analytics/users` - User growth metrics

All admin routes:
1. Call `verifyAdmin()` to check authentication and admin status
2. Perform requested operation using admin client (bypasses RLS)
3. Log action to `admin_audit_log` via `createAuditLog()`
4. Return response

---

## Environment Variables Reference

### Client-Side (NEXT_PUBLIC_*)
These are embedded in the client bundle and visible in browser:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://abhplcdqblijxfvcbfgj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key - safe to expose]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[pk_test_... or pk_live_...]
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=[price_... monthly]
NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL=[price_... annual]
NEXT_PUBLIC_APP_URL=https://trackbillables.com
```

### Server-Side (Secret)
These are only available in API routes and server components:

```bash
# Supabase
SUPABASE_SERVICE_ROLE_KEY=[service_role key - admin access, NEVER expose]

# Stripe
STRIPE_SECRET_KEY=[sk_test_... or sk_live_...]
STRIPE_WEBHOOK_SECRET=[whsec_... from Stripe webhook settings]

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=[your-email@gmail.com]
SMTP_PASSWORD=[app-specific password from Google]
SMTP_FROM=[noreply@trackbillables.com or your-email@gmail.com]
```

---

## Data Flow Examples

### Creating a Billable Entry

```
User → Dashboard → Create Billable Form
  ↓
POST /api/billables
  ↓
1. Verify user authentication (Supabase session)
2. Fetch user subscription from Supabase
3. Check if user has exceeded monthly limit (free tier only)
4. Insert billable into Supabase (RLS ensures user_id matches)
5. Increment entries_count_current_month in subscriptions table
  ↓
Return success → Update UI
```

### Exporting Billables

```
User → Dashboard → Export to CSV/XLSX
  ↓
POST /api/export
  ↓
1. Verify user authentication
2. Fetch user subscription from Supabase
3. Check if user has exceeded export limit (free tier only)
4. Query all billables for user (RLS filters automatically)
5. Generate CSV/XLSX file
6. Increment exports_count_current_month
  ↓
Return file → Browser downloads
```

### Monthly Usage Reset

```
Scheduled Job (external cron or Vercel Cron) OR Admin Panel Action
  ↓
POST /api/admin/reset-usage (for all users or specific user)
  ↓
1. Verify admin authentication
2. Update subscriptions table:
   - entries_count_current_month = 0
   - exports_count_current_month = 0
   - usage_reset_date = today
  ↓
Log audit entry → Return success
```

---

## Deployment Checklist

### Initial Deployment
- [x] Create Vercel account and connect GitHub repository
- [x] Configure all environment variables in Vercel
- [x] Deploy application (automatic on git push)
- [x] Verify deployment at Vercel URL
- [x] Configure custom domain (trackbillables.com)
- [x] Add OAuth redirect URLs to Supabase (including www variant)
- [x] Test authentication flow
- [x] Configure Stripe webhook URL

### Stripe Production Activation
- [ ] Add customer service contact page
- [x] Add cancellation policy page (no refunds — access continues until end of billing period)
- [ ] Submit website to Stripe for production approval
- [ ] Create production Stripe products (Pro Monthly $10, Pro Annual $100)
- [ ] Update environment variables with live Stripe keys
- [ ] Update webhook URL with live webhook secret
- [ ] Test subscription flow in production

### Post-Deployment
- [ ] Set up monitoring (error tracking, uptime monitoring)
- [ ] Configure scheduled job for monthly usage resets
- [ ] Set up database backups (Supabase automatic backups enabled)
- [ ] Document admin procedures
- [ ] Create user documentation

---

## Monitoring & Maintenance

### Vercel Monitoring
- **Deployment Status**: Vercel dashboard shows deployment history and status
- **Build Logs**: Available in Vercel dashboard for each deployment
- **Function Logs**: Serverless function logs available in Vercel dashboard
- **Analytics**: Vercel Analytics can be enabled for traffic metrics

### Supabase Monitoring
- **Database Metrics**: CPU, memory, connections visible in Supabase dashboard
- **Auth Logs**: Authentication events logged automatically
- **API Logs**: Database queries and API calls logged
- **Table Size**: Monitor table growth in Supabase dashboard

### Stripe Monitoring
- **Webhook Logs**: Stripe dashboard shows all webhook deliveries and failures
- **Payment Events**: Track successful/failed payments
- **Subscription Metrics**: MRR, churn, growth available in Stripe dashboard

### Application Health Checks
- **Authentication**: Test Google OAuth flow regularly
- **Subscription Creation**: Test upgrading to Pro in test mode
- **Webhook Processing**: Monitor webhook success rate in Stripe
- **Database Connectivity**: Monitor API response times
- **Email Delivery**: Monitor SMTP delivery success

### Backup & Recovery
- **Database**: Supabase provides automatic daily backups (retained for 7 days on free plan)
- **Code**: All code in GitHub repository
- **Environment Variables**: Documented in this file and stored in Vercel
- **Rollback**: Vercel allows instant rollback to previous deployments

---

## Security Considerations

1. **Authentication**:
   - All sensitive routes check authentication via Supabase session
   - Admin routes verify admin status before allowing access
   - Sessions stored in HTTP-only cookies (not localStorage)

2. **Database**:
   - Row Level Security (RLS) enabled on all tables
   - Users can only access their own data via anon key
   - Service role key only used in API routes (never exposed to client)

3. **API Keys**:
   - Client-side keys (NEXT_PUBLIC_*) are safe to expose
   - Server-side keys never sent to client
   - Stripe webhook secret used to verify webhook authenticity

4. **Payment Processing**:
   - No credit card data touches our servers (Stripe handles all payment info)
   - Stripe Checkout and Customer Portal are Stripe-hosted (PCI compliant)
   - Webhook signature verification prevents unauthorized updates

5. **Admin Access**:
   - Admin actions logged to audit table
   - IP addresses captured for audit trail
   - Admin status requires database record (can't be faked)

---

## Troubleshooting

### Common Issues

**SSO redirects to homepage instead of dashboard**:
- Check Supabase redirect URLs include both www and non-www variants
- Verify `/auth/callback` route is working correctly
- Check browser console for errors during OAuth flow

**Stripe webhook failing**:
- Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
- Check webhook URL is correct: `https://trackbillables.com/api/stripe/webhook`
- View webhook logs in Stripe dashboard for error details
- Ensure webhook signature verification is not timing out

**Build failing on Vercel**:
- Check build logs for specific error
- Verify all environment variables are set
- Ensure dependencies in package.json are compatible
- Check ESLint and TypeScript errors

**Database connection issues**:
- Verify NEXT_PUBLIC_SUPABASE_URL and keys are correct
- Check Supabase project status (not paused)
- Verify RLS policies are not blocking legitimate queries
- Check connection pooling limits in Supabase

**Usage limits not enforcing**:
- Verify subscription record exists for user
- Check entries_count_current_month and exports_count_current_month values
- Ensure API routes are incrementing counters correctly
- Verify usage_reset_date is being updated

---

## Future Enhancements

**Planned Features**:
- Scheduled monthly usage reset (Vercel Cron or external cron job)
- Email notifications for subscription events (renewal, cancellation, failed payment)
- Advanced analytics dashboard (revenue charts, user cohorts)
- Team/organization accounts (multi-user subscriptions)
- API access for integrations
- Mobile app (React Native)
- Two-factor authentication (Supabase supports)
- Custom branding for exported reports

**Infrastructure Improvements**:
- Redis caching for frequently accessed data
- CDN for static assets
- Background job processing (queues for exports, emails)
- Advanced monitoring and alerting (Sentry, DataDog, etc.)
- Load testing and performance optimization
- Database query optimization and indexing

---

## Contact & Support

**Technical Support**: [to be added - customer service page]
**Email**: [to be added]
**Documentation**: See ROADMAP.md, PRODUCTION_SETUP.md, TESTING_GUIDE.md, VERCEL_DEPLOYMENT_GUIDE.md

---

**Last Updated**: January 19, 2026
**Application Version**: 1.0.0
**Production URL**: https://trackbillables.com
