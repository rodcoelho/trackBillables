# Email Setup

## Overview

TrackBillables uses two separate services for email:

- **Outbound email** (sending): Resend, sending from `notifications.trackbillables.com` subdomain
- **Inbound email** (receiving): ImprovMX free forwarding, configured via DNS in Vercel

## Inbound Email — ImprovMX

[ImprovMX](https://improvmx.com) provides free email forwarding for `support@trackbillables.com`. Any email sent to that address is forwarded to the personal Gmail inbox configured in the ImprovMX dashboard.

### How it works

1. Someone sends an email to `support@trackbillables.com`
2. The MX records on `trackbillables.com` point to ImprovMX's mail servers
3. ImprovMX receives the email and forwards it to the configured personal Gmail address
4. No mailbox is hosted — it's purely forwarding

### DNS records (managed in Vercel)

The domain `trackbillables.com` is registered and managed through Vercel. The ImprovMX DNS records were added using Vercel's built-in **"Add DNS Preset" → "ImprovMX [MX]"** option, which automatically creates:

- **MX records** — Route incoming mail to ImprovMX servers
- **SPF record** — Authorizes ImprovMX to handle mail for the domain

These records live in Vercel's DNS settings under the `trackbillables.com` domain.

### ImprovMX free tier limits

- 25 aliases
- 500 emails/day
- 10 MB attachment size
- No SMTP sending (forwarding only)

## Outbound Email — Resend

Transactional emails (welcome, payment failed) are sent via [Resend](https://resend.com) from `noreply@notifications.trackbillables.com`. Uses the `notifications.trackbillables.com` subdomain to keep sending separate from the root domain's ImprovMX forwarding.

### Configuration

- **API key**: `RESEND_API_KEY` env var (set in Vercel)
- **FROM address**: `TrackBillables <noreply@notifications.trackbillables.com>` (in `lib/email/client.ts`)
- **DNS**: DKIM/CNAME records for `notifications.trackbillables.com` added in Vercel DNS

### Emails sent

- Welcome email — on signup
- Payment failed — on invoice failure (via Stripe `invoice.payment_failed` webhook)

## Where `support@trackbillables.com` is used

- Chrome Web Store developer contact email
- Contact page (`/contact`)
- Cancellation policy page (`/cancellation-policy`)
- Extension privacy policy page (`/extension-privacy`)
