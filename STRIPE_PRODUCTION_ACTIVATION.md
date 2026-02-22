# Stripe Production Activation Guide

This guide walks you through the process of activating your Stripe account for production mode, allowing you to accept real payments for TrackBillables Pro subscriptions.

## Overview

Currently, TrackBillables is running in Stripe **test mode**. To accept real payments, you must:
1. Complete your Stripe account verification
2. Submit your business information
3. Activate your Stripe account
4. Create production products and prices
5. Update environment variables with live keys
6. Configure production webhooks

---

## Prerequisites Checklist

Before submitting to Stripe, ensure you have:

- [x] **Website live in production**: https://trackbillables.com ✅
- [x] **Customer service contact page**: https://trackbillables.com/contact ✅
- [x] **Cancellation policy**: https://trackbillables.com/cancellation-policy ✅ (no refunds — access continues until end of billing period)
- [x] **Business entity** (LLC, Corporation, or Sole Proprietorship)
- [ ] **Bank account** for receiving payments
- [ ] **Business tax ID** (EIN for US businesses)
- [ ] **Business address**
- [ ] **Business details** (description, website, etc.)

---

## Step 1: Complete Stripe Account Verification

### 1.1 Access Stripe Dashboard

1. Go to https://dashboard.stripe.com
2. Log in with your Stripe account
3. You should see a banner or notice about activating your account

### 1.2 Provide Business Information

Navigate to **Settings** → **Business settings** → **Business details**

Provide the following information:

**Business Type**:
- [ ] Individual / Sole Proprietor
- [ ] Company (LLC, Corporation, Partnership)

**Business Details**:
- Legal business name
- Doing Business As (DBA) name: "TrackBillables"
- Business address
- Business phone number
- Tax ID / EIN (for US businesses)
- Industry: "Software" or "SaaS"
- Business description: "Legal time tracking and billable hours management software"
- Website: https://trackbillables.com

**Personal Information** (for business owner/representative):
- Full legal name
- Date of birth
- Home address
- Social Security Number (SSN) or equivalent
- Phone number

### 1.3 Add Bank Account

Navigate to **Settings** → **Bank accounts and scheduling**

1. Click "Add bank account"
2. Provide your bank account details:
   - Account holder name
   - Routing number
   - Account number
   - Account type (Checking/Savings)
3. Verify the bank account (Stripe will make two small deposits, confirm the amounts)

**Important**: You must verify your bank account before you can receive payouts.

---

## Step 2: Activate Your Stripe Account

### 2.1 Submit for Activation

Once all required information is provided:

1. Go to **Settings** → **Account**
2. Look for the "Activate account" section
3. Review all information for accuracy
4. Click "Submit for activation"

### 2.2 Verification Process

- **Timeline**: Stripe typically reviews accounts within 1-2 business days
- **Additional verification**: Stripe may request additional documents:
  - Government-issued ID
  - Business formation documents (Articles of Incorporation, etc.)
  - Bank statements
  - Proof of address

- **Email notifications**: Stripe will email you with:
  - Confirmation of submission
  - Requests for additional information (if needed)
  - Approval notification

### 2.3 Approval

Once approved:
- You'll receive an email confirming activation
- Your Stripe dashboard will show "Account activated"
- You can now process live payments

---

## Step 3: Create Production Products

### 3.1 Navigate to Products

1. In Stripe dashboard, go to **Products** (or **More** → **Product catalog**)
2. Make sure you're viewing the **live** environment (toggle in top right should say "Live")

### 3.2 Create Pro Monthly Product

1. Click "Add product"
2. Fill in the details:
   - **Name**: TrackBillables Pro - Monthly
   - **Description**: Unlimited billable entries, unlimited exports, advanced analytics, priority support
   - **Pricing model**: Standard pricing
   - **Price**: $10.00
   - **Billing period**: Monthly
   - **Currency**: USD
3. Click "Add product"
4. **Copy the Price ID** (starts with `price_...`) - you'll need this for environment variables

### 3.3 Create Pro Annual Product

1. Click "Add product" again
2. Fill in the details:
   - **Name**: TrackBillables Pro - Annual
   - **Description**: Unlimited billable entries, unlimited exports, advanced analytics, priority support (Save 20% vs monthly)
   - **Pricing model**: Standard pricing
   - **Price**: $100.00
   - **Billing period**: Yearly
   - **Currency**: USD
3. Click "Add product"
4. **Copy the Price ID** (starts with `price_...`) - you'll need this for environment variables

### 3.4 Save Your Price IDs

Make note of both price IDs:
```
Live Monthly Price ID: price_xxxxxxxxxxxxx
Live Annual Price ID: price_xxxxxxxxxxxxx
```

---

## Step 4: Get Live API Keys

### 4.1 Access API Keys

1. In Stripe dashboard, go to **Developers** → **API keys**
2. Make sure you're viewing the **live** environment (toggle in top right)

### 4.2 Retrieve Keys

You'll see two keys:

1. **Publishable key** (starts with `pk_live_...`)
   - This is safe to expose in client-side code
   - Copy this value

2. **Secret key** (starts with `sk_live_...`)
   - Click "Reveal live key token"
   - Copy this value
   - **IMPORTANT**: Never expose this key in client-side code or commit to git

### 4.3 Save Your Keys

Make note of both keys:
```
Live Publishable Key: pk_live_xxxxxxxxxxxxx
Live Secret Key: sk_live_xxxxxxxxxxxxx (KEEP SECRET!)
```

---

## Step 5: Configure Production Webhook

### 5.1 Create Webhook Endpoint

1. In Stripe dashboard, go to **Developers** → **Webhooks**
2. Make sure you're in the **live** environment
3. Click "Add endpoint"
4. Configure the endpoint:
   - **Endpoint URL**: `https://trackbillables.com/api/stripe/webhook`
   - **Description**: TrackBillables Production Webhook
   - **Events to send**: Select these events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Click "Add endpoint"

### 5.2 Get Webhook Signing Secret

1. After creating the webhook, click on it to view details
2. Under "Signing secret", click "Reveal"
3. Copy the webhook signing secret (starts with `whsec_...`)

### 5.3 Save Webhook Secret

Make note of the webhook secret:
```
Live Webhook Secret: whsec_xxxxxxxxxxxxx (KEEP SECRET!)
```

---

## Step 6: Update Environment Variables in Vercel

### 6.1 Access Vercel Dashboard

1. Go to https://vercel.com
2. Navigate to your project: `track-billables-rfy5`
3. Go to **Settings** → **Environment Variables**

### 6.2 Update Stripe Variables

Update the following environment variables with your live values:

| Variable Name | Current Value (Test) | New Value (Live) |
|--------------|---------------------|------------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` |
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (test) | `whsec_...` (live) |
| `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY` | `price_...` (test) | `price_...` (live monthly) |
| `NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL` | `price_...` (test) | `price_...` (live annual) |

### 6.3 Update Each Variable

For each variable:
1. Find the variable in the list
2. Click the three dots menu → Edit
3. Update the value with the live key/price ID
4. Make sure it's set for **Production** environment
5. Click "Save"

### 6.4 Trigger New Deployment

After updating all variables:
1. Go to **Deployments** tab in Vercel
2. Click on the latest deployment
3. Click the three dots menu → "Redeploy"
4. Select "Use existing Build Cache" → Click "Redeploy"

Or simply push a new commit to trigger automatic deployment.

---

## Step 7: Test Production Payments

### 7.1 Create a Test Account

1. Open an incognito/private browser window
2. Go to https://trackbillables.com
3. Sign up with a **different email address** than your admin account
4. Sign in

### 7.2 Test Subscription Flow

1. Navigate to the Pricing page
2. Click "Upgrade to Pro"
3. Use a **real credit card** (you'll be charged $10 or $100)
4. Complete the checkout process

**Recommended**: Use your own card and immediately cancel to test the full flow without ongoing charges.

### 7.3 Verify Subscription

After successful payment:
1. Check that you're redirected to `/billing?success=true`
2. Verify that your subscription shows as "Pro" and "Active"
3. Check usage counters show "Unlimited"
4. Try creating billable entries (should not be limited)
5. Try exporting data (should not be limited)

### 7.4 Test Cancellation

1. On the billing page, click "Manage Subscription"
2. In Stripe Customer Portal, cancel the subscription
3. Verify you can still access Pro features until the end of the billing period
4. Verify subscription shows "Cancels On: [date]"

### 7.5 Verify in Stripe Dashboard

1. Go to Stripe dashboard → **Payments**
2. Verify the test payment appears
3. Go to **Customers**
4. Verify the customer record exists with correct subscription
5. Go to **Subscriptions**
6. Verify the subscription is active (or canceled if you canceled it)

---

## Step 8: Monitor and Verify Webhooks

### 8.1 Check Webhook Logs

1. In Stripe dashboard, go to **Developers** → **Webhooks**
2. Click on your production webhook endpoint
3. View the **Events** tab
4. You should see successful deliveries for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - Any other subscription events

### 8.2 Verify Webhook Processing

For each webhook event:
- Status should be "Succeeded" (green checkmark)
- Response code should be 200
- If you see failures, click on the event to see error details

### 8.3 Common Webhook Issues

**401 Unauthorized**:
- Webhook secret in Vercel doesn't match Stripe
- Update `STRIPE_WEBHOOK_SECRET` in Vercel

**500 Internal Server Error**:
- Check Vercel function logs for detailed error
- May indicate database connection or logic error

**Timeout (504)**:
- Webhook processing took too long (>10 seconds)
- Optimize webhook handler or use background processing

---

## Step 9: Update Application Configuration (Optional)

### 9.1 Update Pricing Display

If you want to make pricing more prominent, consider:
- Adding pricing information to the homepage
- Adding a "Pricing" link in navigation
- Updating marketing copy to emphasize Pro benefits

### 9.2 Enable Email Notifications

Consider adding email notifications for:
- Successful subscription creation
- Payment failures
- Subscription cancellations
- Upcoming renewals

These can be implemented using the SMTP configuration already in place.

---

## Step 10: Post-Activation Checklist

After activating Stripe production mode, verify:

- [ ] Live Stripe keys updated in Vercel
- [ ] Production webhook configured and working
- [ ] Live products and prices created
- [ ] Test subscription flow works end-to-end
- [ ] Subscription data syncs correctly to Supabase
- [ ] Usage limits work correctly for Free tier
- [ ] Customer Portal allows subscription management
- [ ] Cancellation flow works correctly
- [ ] Stripe payments appear in dashboard
- [ ] Bank account configured for payouts
- [ ] Payout schedule configured (default is weekly)

---

## Rollback Plan

If you encounter issues after activating production mode:

### Quick Rollback to Test Mode

1. Go to Vercel → Settings → Environment Variables
2. Revert all Stripe variables to test mode values:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_test_...`
   - `STRIPE_SECRET_KEY` → `sk_test_...`
   - `STRIPE_WEBHOOK_SECRET` → `whsec_...` (test webhook)
   - `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY` → `price_...` (test monthly)
   - `NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL` → `price_...` (test annual)
3. Redeploy the application
4. Test mode will be active again within 1-2 minutes

### Pause New Subscriptions

If you need to pause new subscriptions while troubleshooting:
1. In Stripe dashboard, go to Products
2. Archive the Pro products (three dots menu → Archive)
3. New customers won't be able to subscribe
4. Existing subscriptions continue normally

---

## Important Notes

### Security

- **Never commit live Stripe keys to git**
- Keep webhook secrets secure
- Regularly rotate API keys (Stripe allows creating new keys)
- Monitor Stripe dashboard for suspicious activity

### Compliance

- Ensure your business complies with local tax laws
- Collect tax information from customers if required
- File appropriate tax forms for online sales
- Keep records of all transactions

### Stripe Fees

Standard Stripe fees for card payments:
- **US cards**: 2.9% + $0.30 per transaction
- **International cards**: 3.9% + $0.30 per transaction
- **Currency conversion**: Additional 1% fee

For a $10/month subscription:
- Stripe fee: $0.59 per payment
- Net revenue: $9.41 per payment

For a $100/year subscription:
- Stripe fee: $3.20 per payment
- Net revenue: $96.80 per payment

### Payouts

Default payout schedule:
- **Frequency**: Weekly (every 7 days)
- **Delay**: 2 business days after charge
- Can be changed in Stripe dashboard → Settings → Bank accounts and scheduling

---

## Support and Troubleshooting

### Stripe Support

If you encounter issues during activation:
- **Email**: support@stripe.com
- **Phone**: Available in Stripe dashboard (Settings → Support)
- **Documentation**: https://stripe.com/docs
- **Status page**: https://status.stripe.com

### Common Issues

**Account activation delayed**:
- Check email for requests for additional information
- Respond promptly to any verification requests
- Contact Stripe support if no response after 5 business days

**Webhook failures**:
- Verify webhook URL is correct and accessible
- Check Vercel function logs for errors
- Ensure webhook secret matches
- Test webhook endpoint manually

**Payment failures**:
- Check Stripe dashboard for specific error codes
- Verify bank account is verified
- Ensure business information is complete
- Contact Stripe support for account-specific issues

**Subscription not syncing to Supabase**:
- Check webhook logs in Stripe dashboard
- Check Vercel function logs
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Test webhook endpoint manually with Stripe CLI

---

## Next Steps

After activating Stripe production mode:

1. **Monitor for first few days**:
   - Check webhook logs daily
   - Monitor Stripe dashboard for payments
   - Verify subscriptions sync correctly
   - Watch for any errors in Vercel logs

2. **Marketing and Growth**:
   - Announce Pro tier availability
   - Add pricing information to marketing materials
   - Consider promotional pricing for early adopters
   - Set up conversion tracking and analytics

3. **Customer Support**:
   - Monitor customer service emails
   - Respond to billing questions promptly
   - Handle billing questions (no refunds per cancellation policy)
   - Document common issues and solutions

4. **Iterate and Improve**:
   - Gather user feedback on pricing and features
   - Monitor conversion rates (Free → Pro)
   - Consider additional pricing tiers or features
   - Optimize subscription flow based on data

---

## Reference

### Environment Variables Quick Reference

```bash
# Production Stripe Keys (Live Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL=price_...
```

### Useful Stripe URLs

- **Dashboard**: https://dashboard.stripe.com
- **API Keys**: https://dashboard.stripe.com/apikeys
- **Webhooks**: https://dashboard.stripe.com/webhooks
- **Products**: https://dashboard.stripe.com/products
- **Customers**: https://dashboard.stripe.com/customers
- **Subscriptions**: https://dashboard.stripe.com/subscriptions
- **Payments**: https://dashboard.stripe.com/payments
- **Documentation**: https://stripe.com/docs

### TrackBillables Production URLs

- **Homepage**: https://trackbillables.com
- **Login**: https://trackbillables.com/login
- **Pricing**: https://trackbillables.com/pricing
- **Billing**: https://trackbillables.com/billing
- **Contact**: https://trackbillables.com/contact
- **Cancellation Policy**: https://trackbillables.com/cancellation-policy
- **Webhook**: https://trackbillables.com/api/stripe/webhook

---

**Last Updated**: January 19, 2026
**Version**: 1.0.0
**Status**: Ready for Production Activation
