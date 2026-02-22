# Vercel Setup

## Overview

TrackBillables is hosted on [Vercel](https://vercel.com). Vercel handles:

- **Web hosting** — Builds and deploys the Next.js app
- **Domain management** — `trackbillables.com` is registered through Vercel
- **DNS** — MX/SPF records for ImprovMX email forwarding (see [email-setup.md](./email-setup.md))
- **Environment variables** — All secrets and API keys for production

## Deployment

Vercel is connected to the GitHub repo. Every push to `main` triggers an automatic production deployment.

- **Framework**: Next.js 14 (App Router)
- **Build command**: `next build`
- **Output directory**: `.next`
- **Node.js version**: Managed by Vercel

## Environment Variables

The following environment variables must be set in the Vercel project settings (Settings → Environment Variables):

### Supabase

| Variable | Exposure | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase service role key (admin access) |

### Stripe

| Variable | Exposure | Description |
|---|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Server only | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Server only | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY` | Public | Stripe price ID for monthly plan |
| `NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL` | Public | Stripe price ID for annual plan |

### Email

| Variable | Exposure | Description |
|---|---|---|
| `RESEND_API_KEY` | Server only | Resend API key for transactional email |

### App

| Variable | Exposure | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public | Production URL (`https://trackbillables.com`) |

## Domain & DNS

The domain `trackbillables.com` is registered and managed through Vercel.

### DNS records managed in Vercel

- **A / CNAME** — Points to Vercel's servers (configured automatically)
- **MX records** — Routes email to ImprovMX for forwarding (added via Vercel's ImprovMX DNS preset)
- **TXT (SPF)** — Authorizes ImprovMX to handle mail for the domain

#### Resend (outbound email via `notifications.trackbillables.com`)

| Type | Name | Content | Priority | TTL |
|------|------|---------|----------|-----|
| TXT | `resend._domainkey.notifications` | DKIM public key (see Resend dashboard) | — | Auto |
| MX | `send.notifications` | `feedback-smtp.us-east-1.amazonses.com` | 10 | 60 |
| TXT | `send.notifications` | `v=spf1 include:amazonses.com ~all` | — | Auto |
| TXT | `_dmarc.notifications` | `v=DMARC1; p=none;` | — | Auto |

To manage DNS: Vercel Dashboard → Domains → `trackbillables.com`

## Security Headers

Security headers are configured in `next.config.js` and applied to all routes:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 0`
- `Permissions-Policy` — Disables camera, microphone, geolocation
- `Content-Security-Policy` — Restricts script/style/connect sources to self, Stripe, and Supabase

## Middleware

`middleware.ts` runs on every request (except static assets) to refresh Supabase auth sessions via `updateSession()`. This keeps users logged in across page navigations.
