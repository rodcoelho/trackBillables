# Stripe Integration Testing Guide

This guide walks through testing the complete Stripe subscription flow for TrackBillables.

## Prerequisites

1. **Environment Variables**: Ensure all Stripe environment variables are set in `.env.local`:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY`
   - `NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL`

2. **Stripe Test Mode**: All keys should be test keys (start with `pk_test_` and `sk_test_`)

3. **Development Server**: Start the dev server with `npm run dev`

4. **Stripe CLI** (for webhook testing): Install from https://stripe.com/docs/stripe-cli

## Test Scenarios

### 1. Pricing Page Display

**Test Steps:**
1. Navigate to `http://localhost:3000/pricing`
2. Verify the page displays two plans: Free and Pro
3. Toggle between Monthly and Annual billing
4. Verify pricing updates correctly:
   - Monthly: $10/month
   - Annual: $100/year ($8.33/month)

**Expected Results:**
- Pricing page loads without errors
- Billing toggle works smoothly
- Both plans display their features correctly
- "Upgrade to Pro" button is visible and enabled

---

### 2. Stripe Checkout Flow

**Test Steps:**
1. On the pricing page, click "Upgrade to Pro" button
2. You should be redirected to Stripe Checkout
3. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC (e.g., 123)
   - Any billing ZIP code (e.g., 12345)
4. Complete the checkout form and submit

**Expected Results:**
- Redirected to Stripe-hosted checkout page
- Checkout form displays the correct subscription amount
- Test card is accepted
- After successful payment, redirected to `/billing?success=true`

---

### 3. Webhook Processing

**Setup Webhook Testing:**
```bash
# Terminal 1: Keep your dev server running
npm run dev

# Terminal 2: Forward Stripe webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Test Steps:**
1. Complete a test checkout (as in Test #2)
2. Monitor the Stripe CLI terminal for webhook events
3. Check that the following events are received and processed:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `invoice.payment_succeeded`

**Expected Results:**
- Webhook events appear in Stripe CLI
- Each webhook returns `200 OK` status
- No error messages in the terminal
- Console logs show "Received Stripe webhook event: [event_type]"

---

### 4. Post-Subscription Verification

**Test Steps:**
1. After successful checkout, verify you're on `/billing` page
2. Check for success message: "Welcome to Pro! Your subscription is now active."
3. Verify subscription details:
   - Current Plan shows "Pro" with "ACTIVE" badge
   - Billing Interval displays correctly (Monthly or Annual)
   - Next Billing Date is shown
4. Navigate to `/dashboard`
5. Verify Pro badge appears next to "TrackBillables" title
6. Verify UpgradeBanner is NOT displayed (only shown to free users)

**Expected Results:**
- Billing page shows Pro status
- All subscription details are accurate
- Pro badge displays on dashboard
- Upgrade banner is hidden for Pro users

---

### 5. Database Verification

**Test Steps:**
1. Open Supabase dashboard
2. Navigate to Table Editor > `subscriptions` table
3. Find the subscription record for your test user

**Expected Results:**
- Record exists with correct `user_id`
- `tier` is set to `'pro'`
- `status` is `'active'`
- `stripe_customer_id` is populated
- `stripe_subscription_id` is populated
- `billing_interval` matches selected plan
- `current_period_end` is set to correct future date
- `entries_count_current_month` and `exports_count_current_month` are initialized

---

### 6. Billing Page Features

**Test Steps:**
1. On `/billing` page, click "Manage Subscription" button
2. Verify redirect to Stripe Customer Portal
3. In the portal, test various actions:
   - View subscription details
   - Update payment method
   - View invoices
   - Cancel subscription (if testing cancellation flow)

**Expected Results:**
- "Manage Subscription" button opens Stripe Customer Portal
- Portal displays current subscription
- All actions work correctly
- Returning to app redirects to `/billing` page

---

### 7. Subscription Cancellation Flow

**Test Steps:**
1. In Stripe Customer Portal, cancel the subscription
2. Choose to cancel at period end
3. Return to the app
4. Refresh the `/billing` page
5. Check for cancellation notice

**Expected Results:**
- Subscription status still shows "ACTIVE"
- Yellow warning banner appears with message: "Your subscription will be canceled at the end of the current billing period"
- Label changes from "Next Billing Date" to "Cancels On"
- Subscription remains active until period end date

---

### 8. Free User Experience

**Test Steps:**
1. Log in with a non-Pro account (or create a new test account)
2. Visit `/dashboard`
3. Check for UpgradeBanner below the header
4. Visit `/billing`
5. Verify usage limits are displayed:
   - "50 entries per month"
   - "1 export per month"

**Expected Results:**
- UpgradeBanner is visible on dashboard
- "Upgrade to Pro" button is displayed on billing page
- Usage limits show current count with max limit
- Pro badge is NOT visible

---

### 9. API Endpoint Testing

**Manual API Tests:**

```bash
# Test subscription status endpoint
curl http://localhost:3000/api/subscription \
  -H "Cookie: [your-session-cookie]"

# Test checkout session creation
curl -X POST http://localhost:3000/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-session-cookie]" \
  -d '{"priceId":"price_1SefDaCnzNMpemDjuleE3Rjy","billingInterval":"month"}'

# Test customer portal session creation
curl -X POST http://localhost:3000/api/stripe/portal \
  -H "Cookie: [your-session-cookie]"
```

**Expected Results:**
- `/api/subscription` returns subscription data or empty object
- `/api/stripe/checkout` returns checkout session URL
- `/api/stripe/portal` returns portal session URL
- All endpoints require authentication

---

## Troubleshooting

### Webhook Not Received
- Verify Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Check webhook secret matches in `.env.local`
- Ensure dev server is running on port 3000

### Checkout Redirect Fails
- Check `NEXT_PUBLIC_APP_URL` in `.env.local`
- Verify price IDs match your Stripe dashboard products
- Check browser console for errors

### Subscription Not Syncing
- Check webhook endpoint returns 200 status
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check server console for error logs
- Verify subscriptions table exists in Supabase

### Pro Badge Not Showing
- Check subscription tier in database is exactly `'pro'` (lowercase)
- Verify `/api/subscription` endpoint returns correct data
- Clear browser cache and refresh

---

## Test Card Numbers

Stripe provides various test cards for different scenarios:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **3D Secure**: `4000 0025 0000 3155`

More test cards: https://stripe.com/docs/testing

---

## Cleanup After Testing

1. Cancel test subscriptions in Stripe Dashboard
2. Delete test subscription records from Supabase
3. Reset user accounts to free tier if needed

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Replace all test Stripe keys with live keys
- [ ] Update webhook secret with production webhook secret
- [ ] Configure webhook endpoint in Stripe Dashboard (https://yourdomain.com/api/stripe/webhook)
- [ ] Test webhook delivery in production
- [ ] Verify SSL certificate is valid
- [ ] Test complete flow in production with real payment
- [ ] Set up Stripe webhook monitoring/alerts
- [ ] Configure proper error logging and monitoring
