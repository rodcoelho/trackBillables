# Production Setup Guide

This document provides step-by-step instructions for setting up TrackBillables in production.

## Environment Variables

### Required Production Environment Variables

Create a `.env.production` or configure these in your hosting platform (Vercel, Netlify, etc.):

#### Supabase Configuration

```bash
# Supabase Project URL
# Location: Supabase Dashboard → Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anonymous Key (Public)
# Location: Supabase Dashboard → Settings → API → Project API keys → anon public
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (Secret - Server-side only)
# Location: Supabase Dashboard → Settings → API → Project API keys → service_role
# ⚠️ NEVER expose this key client-side
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Stripe Configuration (Production Keys)

```bash
# Stripe Publishable Key (Public)
# Location: Stripe Dashboard → Developers → API keys → Publishable key
# Toggle to "Live mode" to get production keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Stripe Secret Key (Secret - Server-side only)
# Location: Stripe Dashboard → Developers → API keys → Secret key
# ⚠️ NEVER expose this key client-side
STRIPE_SECRET_KEY=sk_live_...

# Stripe Webhook Secret (Secret - Server-side only)
# Location: Stripe Dashboard → Developers → Webhooks → [your webhook] → Signing secret
# Create webhook AFTER deploying (see Phase A/C in ROADMAP.md)
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (Production)
# Location: Stripe Dashboard → Products → [Your Product] → Pricing → Price ID
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_live_... # Pro Monthly ($10/month)
NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL=price_live_...  # Pro Annual ($100/year)
```

#### Application Configuration

```bash
# Next.js Environment
NODE_ENV=production

# Application URL
# Your production domain (used for redirects, webhooks, etc.)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] **Security Review Complete** (See ROADMAP.md Phase C)
- [ ] **Environment Variables Documented** (above)
- [ ] **Secrets Rotated** - Ensure no development keys are used in production
- [ ] **Code Review** - All features tested and reviewed
- [ ] **Database Migrations** - All migrations applied to production Supabase
- [ ] **Dependencies Updated** - Run `npm audit fix` and update dependencies

### Stripe Production Setup

- [ ] **Switch to Live Mode** in Stripe Dashboard (toggle in upper right)
- [ ] **Create Production Products**:
  - [ ] Pro Monthly: $10/month
  - [ ] Pro Annual: $100/year
- [ ] **Copy Price IDs** and save to environment variables
- [ ] **Copy Live API Keys**:
  - [ ] Publishable key (pk_live_...)
  - [ ] Secret key (sk_live_...)
- [ ] **Webhook Setup** (do AFTER deployment):
  - Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
  - Events to listen for:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_succeeded`
    - `invoice.payment_failed`

### Deployment Steps

1. **Choose Hosting Platform**
   - Recommended: Vercel (optimized for Next.js)
   - Alternatives: Netlify, AWS Amplify, Railway

2. **Connect Repository**
   - Link GitHub repository to hosting platform
   - Set build command: `npm run build`
   - Set output directory: `.next`

3. **Configure Environment Variables**
   - Add all variables from "Environment Variables" section above
   - ⚠️ Double-check all keys are production keys (pk_live_, sk_live_, etc.)

4. **Initial Deployment**
   - Deploy from main branch
   - Monitor build logs for errors
   - Verify successful deployment

5. **Post-Deployment Verification**
   - [ ] Visit production URL
   - [ ] Verify SSL certificate (HTTPS)
   - [ ] Test authentication (login/signup)
   - [ ] Test dashboard loads
   - [ ] Test adding a billable entry
   - [ ] Check browser console for errors
   - [ ] Test responsive design on mobile

6. **Configure Stripe Webhook**
   - [ ] In Stripe Dashboard → Developers → Webhooks → Add endpoint
   - [ ] Enter webhook URL: `https://yourdomain.com/api/stripe/webhook`
   - [ ] Select events (listed above)
   - [ ] Copy webhook signing secret
   - [ ] Add `STRIPE_WEBHOOK_SECRET` to environment variables
   - [ ] Redeploy application

7. **End-to-End Payment Testing**
   - [ ] Create new test account on production
   - [ ] Upgrade to Pro using test card (4242 4242 4242 4242)
   - [ ] Verify Pro badge appears
   - [ ] Test adding unlimited entries
   - [ ] Test unlimited exports
   - [ ] Access Stripe Customer Portal
   - [ ] Cancel subscription and verify downgrade

8. **DNS & Domain Configuration** (if using custom domain)
   - [ ] Add CNAME or A record pointing to hosting provider
   - [ ] Wait for DNS propagation (can take up to 48 hours)
   - [ ] Verify domain is accessible
   - [ ] Test HTTPS on custom domain

---

## Rollback Procedures

### Quick Rollback (Revert Deployment)

**When to use:** Critical bugs, security issues, or site is down

**Steps:**
1. Navigate to hosting platform dashboard
2. Go to Deployments → Previous Deployments
3. Find last known working deployment
4. Click "Redeploy" or "Rollback"
5. Monitor deployment logs
6. Verify site is functional

**Estimated time:** 2-5 minutes

### Database Rollback

**When to use:** Database migration caused issues

**⚠️ WARNING:** Database rollbacks are complex and can cause data loss

**Steps:**
1. Access Supabase Dashboard → SQL Editor
2. Review recent migrations in `/supabase/migrations/` folder
3. Create reverse migration SQL (manually undo changes)
4. Test reverse migration on development database first
5. Execute on production database
6. Verify application still functions

**Estimated time:** 15-30 minutes

### Stripe Configuration Rollback

**When to use:** Wrong price IDs, webhook misconfiguration

**Steps:**
1. Update environment variables with correct values:
   - Stripe price IDs
   - Webhook secret
2. Redeploy application
3. Test checkout flow

**Estimated time:** 5-10 minutes

---

## Monitoring Plan

### Critical Metrics to Monitor

#### Application Health
- **Uptime**: Monitor with UptimeRobot, Pingdom, or hosting platform
- **Response Time**: Target < 2 seconds for page loads
- **Error Rate**: Track 4xx and 5xx errors
- **Build Success Rate**: Monitor deployment success

#### Stripe Metrics
- **Webhook Delivery**: Monitor in Stripe Dashboard → Webhooks → [your webhook]
  - Watch for failed deliveries
  - Check response codes
- **Payment Success Rate**: Track successful vs failed payments
- **Subscription Churn**: Monitor cancellations
- **Revenue**: Daily/weekly/monthly revenue tracking

#### User Metrics
- **New Signups**: Daily signup rate
- **Active Users**: Daily/weekly/monthly active users
- **Conversion Rate**: Free to Pro conversion percentage
- **Usage Patterns**: Average entries per user, export frequency

### Monitoring Tools

#### Recommended Tools
1. **Application Monitoring**
   - Vercel Analytics (if using Vercel)
   - Sentry (error tracking)
   - LogRocket (session replay)

2. **Uptime Monitoring**
   - UptimeRobot (free tier available)
   - Pingdom
   - Better Uptime

3. **Stripe Monitoring**
   - Built-in Stripe Dashboard
   - Stripe Radar (fraud detection)
   - Webhook monitoring in Stripe Dashboard

4. **Database Monitoring**
   - Supabase Dashboard (built-in metrics)
   - Monitor query performance
   - Track connection pool usage

### Alert Configuration

Set up alerts for:
- **Critical:**
  - Site down (5+ minutes)
  - Webhook failures (3+ consecutive)
  - Payment processing errors
  - Authentication failures spike

- **Warning:**
  - Response time > 5 seconds
  - Error rate > 1%
  - Disk space > 80%
  - Database connections > 80% of pool

### Daily Checks
- [ ] Review error logs in hosting dashboard
- [ ] Check Stripe webhook deliveries
- [ ] Monitor new signups
- [ ] Review any customer support tickets

### Weekly Checks
- [ ] Review uptime reports
- [ ] Analyze conversion rates
- [ ] Check for dependency updates
- [ ] Review database performance metrics

### Monthly Checks
- [ ] Revenue analysis
- [ ] User growth trends
- [ ] Feature usage patterns
- [ ] Security audit (npm audit)
- [ ] Backup verification

---

## Security Best Practices

### Environment Variables
- ✅ Use environment variables for all secrets
- ✅ Never commit `.env` files to git (already in .gitignore)
- ✅ Rotate secrets regularly (quarterly minimum)
- ✅ Use different keys for development and production

### SSL/HTTPS
- ✅ Enforce HTTPS (hosting platforms do this automatically)
- ✅ Use HSTS headers
- ✅ Keep SSL certificates up to date

### Authentication
- ✅ Use Supabase Auth (secure by default)
- ✅ Implement session timeout (consider adding)
- ✅ Monitor failed login attempts

### API Security
- ✅ Rate limiting on all endpoints (implement before production)
- ✅ Validate all user input
- ✅ Use prepared statements (Supabase ORM handles this)

### Regular Maintenance
- Weekly: `npm audit` to check for vulnerabilities
- Monthly: Update dependencies
- Quarterly: Security review and penetration testing

---

## Support & Troubleshooting

### Common Issues

**Issue: Webhooks not being received**
- Verify webhook URL is correct in Stripe Dashboard
- Check webhook secret is correctly configured
- Review webhook delivery logs in Stripe Dashboard
- Ensure hosting platform allows POST requests to `/api/stripe/webhook`

**Issue: Pro badge not showing after upgrade**
- Check webhook was received (Stripe Dashboard → Webhooks)
- Verify subscription synced to database (Supabase → Subscriptions table)
- Check browser console for errors
- Try manual sync: visit `/billing` page to trigger sync

**Issue: Authentication not working**
- Verify Supabase URL and keys are correct
- Check Supabase authentication settings
- Ensure email confirmation is disabled (or properly configured)
- Review Supabase logs for auth errors

**Issue: Exports failing**
- Check export limit for free users (1/month)
- Verify date range is valid
- Check for data in billables table
- Review API logs in hosting platform

---

## Emergency Contacts

- **Hosting Support**: [Your hosting provider support]
- **Stripe Support**: https://support.stripe.com/
- **Supabase Support**: https://supabase.com/support
- **On-call Engineer**: [Your contact info]

---

Last Updated: January 19, 2026
