# Stripe Setup

## Environment Variables

| Variable | Description | Visibility |
|---|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public key for client-side Stripe.js | Browser-safe |
| `STRIPE_SECRET_KEY` | Secret key for server-side API calls | Server only |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for webhook verification | Server only |
| `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY` | Price ID for Pro Monthly plan | Browser-safe |
| `NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL` | Price ID for Pro Annual plan | Browser-safe |

These must be set in both `.env.local` (local dev) and Vercel Environment Variables (production).

## Webhook Setup

**Endpoint URL:** `https://trackbillables.vercel.app/api/stripe/webhook`

### Required Events

| Event | Purpose |
|---|---|
| `checkout.session.completed` | Syncs subscription after successful checkout |
| `customer.subscription.created` | Syncs new subscription to Supabase |
| `customer.subscription.updated` | Syncs plan changes, renewals |
| `customer.subscription.deleted` | Handles cancellation, downgrades to free |
| `customer.subscription.trial_will_end` | Sends trial ending email notification |
| `invoice.payment_succeeded` | Confirms payment, syncs subscription |
| `invoice.payment_failed` | Sends payment failed email notification |

### How It Works

1. Stripe sends a POST to `/api/stripe/webhook` with the event payload
2. The webhook handler verifies the signature using `STRIPE_WEBHOOK_SECRET`
3. Based on event type, it syncs subscription data to the `subscriptions` table in Supabase
4. Email notifications are sent via Resend for trial endings and payment failures

## Pricing

All pricing is centralized in `lib/pricing.ts`. Update prices there to change them across the entire app (upgrade modals, homepage, pricing page).

## Test vs Live Mode

- **Test keys** start with `pk_test_` / `sk_test_`
- **Live keys** start with `pk_live_` / `sk_live_`
- Test and live modes have separate products, prices, and webhook endpoints
- Always create new Price IDs when switching from test to live
