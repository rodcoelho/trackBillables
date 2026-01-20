# Testing Guide - Pre-Production Checklist

This guide walks you through comprehensive testing of TrackBillables before production deployment.

## Prerequisites

- Application running locally or in test environment
- Stripe in **Test Mode** (toggle in upper right of Stripe Dashboard)
- Access to Supabase Dashboard
- Test credit card: `4242 4242 4242 4242` (any future expiry, any CVC)

---

## Test 1: Complete Signup → Upgrade → Billing Flow

### Objective
Verify the entire user journey from signup to Pro subscription.

### Steps

#### 1.1 New User Signup
1. **Clear browser data** or use incognito window
2. Navigate to your app (e.g., `http://localhost:3000`)
3. Click "Sign Up" or access signup page
4. Create account with test email: `test+flow1@yourdomain.com`
5. Complete authentication flow

**✅ Expected Results:**
- Account created successfully
- Redirected to dashboard
- Free tier badge visible (or no Pro badge)
- Usage counter shows: "X of 50 entries remaining this month"

#### 1.2 Test Free Tier Limits
1. **Add a billable entry**:
   - Client: "Test Client"
   - Matter: "Test Matter"
   - Hours: 1.5
   - Date: Today
   - Description: "Test entry"
2. Click "Add Billable Entry"

**✅ Expected Results:**
- Entry added successfully
- Entry appears in dashboard table
- Usage counter decrements: "X-1 of 50 entries remaining"

#### 1.3 Test Export Limit (Free Tier)
1. Click "Export" button
2. Leave default date range (last 30 days)
3. Click "Export CSV"
4. After export completes, try exporting again immediately

**✅ Expected Results:**
- First export succeeds
- CSV file downloads
- Second export shows error: "You've reached your free plan limit"
- Upgrade prompt appears

#### 1.4 Upgrade to Pro (Monthly)
1. Click "Upgrade to Pro" or navigate to `/billing`
2. Click "Upgrade to Pro" → "Choose Monthly" ($10/month)
3. Fill out Stripe checkout:
   - Email: (should be pre-filled)
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/30)
   - CVC: Any 3 digits (e.g., 123)
   - Name: Test User
   - Country: United States (or your country)
4. Click "Subscribe"

**✅ Expected Results:**
- Redirected back to billing page with `?success=true&session_id=...`
- Pro badge appears in header/dashboard
- Billing page shows "Pro Plan - Active"
- Usage counter shows "Unlimited entries"
- Stripe Customer Portal link works

#### 1.5 Verify Webhook Processing
1. Open Stripe Dashboard → Webhooks → [your webhook endpoint]
2. Check recent webhook deliveries
3. Look for `checkout.session.completed` event (should be recent)

**✅ Expected Results:**
- Webhook delivered successfully (200 response)
- Event shows in Stripe webhook logs
- Response time < 5 seconds

#### 1.6 Verify Database Sync
1. Open Supabase Dashboard → Table Editor → subscriptions
2. Find subscription for test user (`test+flow1@yourdomain.com`)

**✅ Expected Results:**
- Subscription row exists
- `tier`: "pro"
- `status`: "active"
- `stripe_subscription_id`: Populated
- `stripe_customer_id`: Populated
- `stripe_price_id`: Populated (matches monthly price ID)

#### 1.7 Test Unlimited Usage
1. Return to dashboard
2. Add 5-10 billable entries rapidly
3. Try exporting multiple times

**✅ Expected Results:**
- All entries added without limit warnings
- Exports work without limit restrictions
- No upgrade prompts appear

---

## Test 2: Subscription Cancellation

### Objective
Verify subscription cancellation and downgrade flow.

### Steps

#### 2.1 Access Customer Portal
1. Navigate to `/billing`
2. Click "Manage Subscription" button
3. Should redirect to Stripe Customer Portal

**✅ Expected Results:**
- Redirected to `https://billing.stripe.com/...`
- Sees active Pro subscription
- Can view payment method and billing history

#### 2.2 Cancel Subscription
1. In Customer Portal, click "Cancel plan"
2. Confirm cancellation
3. Return to your app

**✅ Expected Results:**
- Cancellation confirmed
- Message: "Your subscription will remain active until [end date]"
- Return to app shows Pro still active (until period end)

#### 2.3 Verify Immediate Cancellation (Alternate Test)
To test immediate cancellation (for testing purposes):

1. In Stripe Dashboard → Customers
2. Find test customer
3. Click on subscription → "Cancel subscription"
4. Choose "Cancel immediately"

**✅ Expected Results:**
- In your app, navigate to dashboard
- Pro badge should disappear (may need refresh)
- Usage counter shows: "X of 50 entries remaining"
- Billing page shows "Free Plan"

#### 2.4 Test Free Tier Limits After Downgrade
1. Try adding entries until you hit the limit (if not already at 50)
2. Try exporting (should fail if already exported once this month)

**✅ Expected Results:**
- Entry limit enforced at 50/month
- Export limit enforced at 1/month
- Upgrade prompts appear when limits reached

---

## Test 3: Usage Limit Enforcement

### Objective
Thoroughly test free tier limits and Pro tier unlimited usage.

### Test 3.1: Free Tier Entry Limit

#### Setup
1. Create new test account: `test+limits@yourdomain.com`
2. Ensure they're on free tier

#### Use SQL to add 48 entries:
```sql
-- Use supabase/add-test-entries.sql but modify to add 48 entries
-- Then use your app to manually add 2 more to reach 50
```

#### Steps
1. Add 2 billable entries manually to reach exactly 50
2. Try adding a 51st entry

**✅ Expected Results:**
- Entries 1-50 add successfully
- Entry 51 shows error: "You've reached your free plan limit"
- Upgrade modal appears

### Test 3.2: Free Tier Export Limit

#### Steps
1. Export once successfully
2. Try exporting again immediately

**✅ Expected Results:**
- First export succeeds
- Second export fails with upgrade prompt
- Error message about export limit

### Test 3.3: Pro Tier Unlimited Entries

#### Setup
1. Upgrade test account to Pro
2. Use SQL to add 100+ entries or add manually

#### Steps
1. Add 60+ entries (well over free limit of 50)
2. Add entries throughout the test

**✅ Expected Results:**
- All entries add without errors
- No upgrade prompts
- No limit warnings

### Test 3.4: Pro Tier Unlimited Exports

#### Steps
1. Export 5 times in a row
2. Try different date ranges

**✅ Expected Results:**
- All exports succeed
- No limit errors
- Downloads work correctly

---

## Test 4: Monthly Usage Reset Logic

### Objective
Verify that usage counters reset properly at the start of each month.

### Test 4.1: Simulate Month Change (Manual Database Update)

#### Setup
1. Create test account: `test+reset@yourdomain.com`
2. Add some entries (e.g., 10 entries)
3. Export once

#### Verify Current State in Supabase:
```sql
SELECT
  email,
  entries_count_current_month,
  exports_count_current_month,
  usage_reset_date
FROM auth.users u
JOIN subscriptions s ON s.user_id = u.id
WHERE email = 'test+reset@yourdomain.com';
```

**Should see:**
- `entries_count_current_month`: 10
- `exports_count_current_month`: 1
- `usage_reset_date`: First of current month

#### Simulate Previous Month:
```sql
-- Set reset date to last month to trigger reset logic
UPDATE subscriptions
SET
  usage_reset_date = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'),
  entries_count_current_month = 45,
  exports_count_current_month = 1
FROM auth.users u
WHERE subscriptions.user_id = u.id
  AND u.email = 'test+reset@yourdomain.com';
```

#### Test Auto-Reset:
1. In your app, add a new billable entry
2. The API should detect the new month and reset counters

#### Verify Reset in Database:
```sql
SELECT
  email,
  entries_count_current_month,
  exports_count_current_month,
  usage_reset_date
FROM auth.users u
JOIN subscriptions s ON s.user_id = u.id
WHERE email = 'test+reset@yourdomain.com';
```

**✅ Expected Results:**
- `entries_count_current_month`: 1 (just the new entry)
- `exports_count_current_month`: 0 (reset)
- `usage_reset_date`: First of current month
- New entry added successfully

---

## Test 5: Email Collection in Stripe Checkout

### Objective
Verify that Stripe collects email addresses during checkout.

### Steps

#### 5.1 Test Checkout with Existing User
1. Navigate to upgrade page while logged in
2. Click "Upgrade to Pro"
3. Observe Stripe checkout form

**✅ Expected Results:**
- Email field is pre-filled with user's email
- Email field may be read-only or editable
- Email is included in Stripe customer record

#### 5.2 Verify in Stripe Dashboard
1. Open Stripe Dashboard → Customers
2. Find the customer created during test
3. Check customer details

**✅ Expected Results:**
- Email address is present
- Matches the user's email in your app
- Customer record is properly created

#### 5.3 Check Checkout Session Configuration
Review your checkout session creation code:

```typescript
// Should have email collection enabled
const session = await stripe.checkout.sessions.create({
  customer_email: user.email, // Pre-fill email
  // ... other options
});
```

**✅ Expected Results:**
- `customer_email` is set in checkout session
- Email appears in Stripe customer record
- Email appears in subscription metadata

---

## Test 6: Edge Cases & Error Scenarios

### Test 6.1: Duplicate Subscription Attempt
1. User with active Pro subscription
2. Try to upgrade again

**✅ Expected Results:**
- Should either:
  - Show "Already subscribed" message, OR
  - Redirect to customer portal, OR
  - Allow switching plans

### Test 6.2: Payment Failure
1. Use Stripe test card for declined payment: `4000 0000 0000 0002`
2. Try to upgrade

**✅ Expected Results:**
- Payment declined message shown
- User remains on free tier
- No subscription created

### Test 6.3: Webhook Failure Recovery
1. Temporarily disable webhook endpoint (stop server or misconfigure)
2. Complete checkout
3. Re-enable webhook endpoint
4. Use manual sync endpoint: `/billing` page should auto-sync

**✅ Expected Results:**
- Even if webhook fails, manual sync catches the subscription
- User sees Pro badge after sync

### Test 6.4: Concurrent Entry Creation
1. Open app in two browser tabs
2. Add entries simultaneously in both tabs

**✅ Expected Results:**
- Both entries save successfully
- Counter updates correctly
- No race conditions or duplicate entries

---

## Test 7: Analytics & Reporting

### Objective
Verify analytics dashboard shows correct data.

### Steps

#### 7.1 Test "Last 7 Days" Analytics
1. Add entries with dates in last 7 days
2. Add entries with dates older than 7 days
3. Navigate to dashboard → Analyze

**✅ Expected Results:**
- Only entries from last 7 days appear
- Total hours calculated correctly
- Client breakdown accurate
- Matter breakdown accurate

#### 7.2 Test Export Date Ranges
1. Add entries across multiple months
2. Export with custom date range (e.g., last month)
3. Verify CSV contents

**✅ Expected Results:**
- Only entries within date range exported
- All columns present (Date, Client, Matter, Hours, Description)
- Dates formatted correctly

---

## Test 8: Mobile Responsiveness (Quick Check)

### Objective
Ensure app works on mobile devices.

### Steps
1. Open app on mobile device or use browser dev tools responsive mode
2. Test key flows:
   - Login
   - Add entry
   - View dashboard
   - Export
   - Upgrade

**✅ Expected Results:**
- Layout adapts to mobile screen
- Buttons are tappable
- Forms are usable
- No horizontal scrolling

---

## Test Completion Checklist

After completing all tests, verify:

- [ ] Signup flow works
- [ ] Free tier limits enforced (50 entries, 1 export)
- [ ] Pro upgrade works (monthly and annual)
- [ ] Pro badge appears after upgrade
- [ ] Unlimited usage works for Pro
- [ ] Subscription cancellation works
- [ ] Downgrade to free tier works
- [ ] Usage reset logic works
- [ ] Webhooks deliver successfully
- [ ] Database syncs correctly
- [ ] Email collected in Stripe
- [ ] Analytics shows correct data
- [ ] Exports work correctly
- [ ] Mobile layout acceptable
- [ ] No console errors
- [ ] All Stripe test transactions appear in dashboard

---

## Post-Testing Cleanup

### Clean Up Test Data

```sql
-- Remove test users and their data
DELETE FROM billables WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test+%@%'
);

DELETE FROM subscriptions WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test+%@%'
);

DELETE FROM auth.users WHERE email LIKE 'test+%@%';
```

### Clean Up Stripe Test Data
1. Stripe Dashboard → Customers
2. Delete test customers (or leave them - test data auto-clears periodically)

---

## Known Issues & Workarounds

Document any issues found during testing:

| Issue | Severity | Workaround | Status |
|-------|----------|------------|--------|
| Example: Webhook delay | Low | Manual sync via /billing | Open |

---

Last Updated: January 19, 2026
