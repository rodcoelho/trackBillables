# TrackBillables Roadmap

This document outlines our upcoming priorities and implementation steps.

## Current Status

✅ **Completed:**
- Stripe integration with test mode
- Usage limits enforcement (50 entries/month, 1 export/month for free tier)
- Pro subscription system ($10/month, $100/year)
- Admin panel with SSO authentication
- Dashboard, billing, and pricing pages
- Export functionality (CSV & Excel)
- Analytics dashboard (Last 7 Days)

## Next Steps - Production Launch

### Phase C: Production Billing Preparation (90% Offline)

**Goal**: Make billing production-ready before going live

**⚠️ IMPORTANT**: Stripe requires a live, accessible website before activating production mode. Complete Phase A (Deploy Live with TEST mode keys) first, then return here to create production Stripe products.

#### Tasks:
1. **Create Production Stripe Products** ⏸️ (Blocked - Need live site first)
   - [ ] Switch Stripe to Live Mode (requires website verification)
   - [ ] Create Pro Monthly product ($10/month)
   - [ ] Create Pro Annual product ($100/year)
   - [ ] Note down production price IDs
   - [ ] Save production API keys (publishable & secret)
   - **Prerequisite**: Complete Phase A deployment first

2. **Security Review** ✅
   - [x] Review all API endpoints for authentication ✅ All endpoints properly authenticated
   - [x] Verify webhook signature verification is enabled ✅ Properly implemented with Stripe signature validation
   - [x] Check that service role key usage is appropriate ✅ Restricted to server-side admin operations only
   - [x] Review CORS settings ✅ Using Next.js defaults (appropriate for same-origin)
   - [x] Ensure no sensitive data in client-side code ✅ No secrets exposed client-side
   - **Production recommendations**: Add rate limiting, security headers (CSP, X-Frame-Options, HSTS), session timeout

3. **Documentation** ✅
   - [x] Document production environment variables ✅ See PRODUCTION_SETUP.md
   - [x] Create deployment checklist ✅ See PRODUCTION_SETUP.md
   - [x] Document rollback procedures ✅ See PRODUCTION_SETUP.md
   - [x] Create monitoring plan ✅ See PRODUCTION_SETUP.md

4. **Final Testing in Test Mode**
   - [ ] Test complete signup → upgrade → billing flow
   - [ ] Test subscription cancellation
   - [ ] Test usage limit enforcement
   - [ ] Test monthly usage reset logic
   - [ ] Verify email collection in Stripe checkout

---

### Phase A: Deploy Live

**Goal**: Get the application live with a public URL

**Strategy**: Deploy with TEST mode Stripe keys initially. This allows:
- Stripe to verify your live website (required for production activation)
- You to test everything in production environment safely
- No real payments until you switch to live keys

#### Tasks:
1. **Choose Hosting Platform**
   - [ ] Decision: Vercel vs Netlify vs other
   - [ ] Set up deployment pipeline
   - [ ] Configure custom domain (if applicable)

2. **Environment Configuration**
   - [ ] Set up production environment variables (see PRODUCTION_SETUP.md)
   - [ ] Configure Supabase production settings
   - [ ] Set Stripe TEST mode keys initially (pk_test_, sk_test_)
   - [ ] Configure test webhook secret (we'll update to live keys after Stripe approval)
   - [ ] Verify all environment variables are set correctly

3. **Deploy Application**
   - [ ] Initial deployment
   - [ ] Verify SSL certificate
   - [ ] Test basic functionality (login, dashboard)
   - [ ] Smoke test all major features

4. **DNS & Domain Setup**
   - [ ] Configure DNS records
   - [ ] Verify domain is accessible
   - [ ] Test HTTPS enforcement

5. **Stripe Account Activation**
   - [ ] Submit live website URL to Stripe Dashboard (Settings → Account → Website)
   - [ ] Complete any required business verification documents
   - [ ] Wait for Stripe approval email (typically 1-2 business days)
   - [ ] Once approved, return to Phase C to create production products

---

### Phase C (Continued): Finalize Production Billing (10% Online)

**Goal**: Complete billing setup that requires live URL

**Prerequisites**:
- Site deployed and live (Phase A complete)
- Stripe account activated for live mode

#### Tasks:
1. **Create Production Stripe Products** (from Phase C step 1)
   - [ ] Switch Stripe to Live Mode (should now be available)
   - [ ] Create Pro Monthly product ($10/month)
   - [ ] Create Pro Annual product ($100/year)
   - [ ] Note down production price IDs
   - [ ] Save production API keys (pk_live_, sk_live_)
   - [ ] Update environment variables with live keys
   - [ ] Redeploy application

2. **Configure Production Webhooks**
   - [ ] Add webhook endpoint in Stripe Dashboard: `https://yourdomain.com/api/stripe/webhook`
   - [ ] Update production webhook secret in environment variables
   - [ ] Redeploy with new webhook secret

3. **End-to-End Production Testing**
   - [ ] Create test account on production
   - [ ] Complete full upgrade flow with real card (then cancel)
   - [ ] Verify webhook events are received
   - [ ] Verify subscription syncs to database
   - [ ] Verify Pro badge appears after upgrade
   - [ ] Test subscription management (update payment, cancel)
   - [ ] Verify usage limits work correctly

4. **Monitoring Setup**
   - [ ] Set up Stripe webhook monitoring
   - [ ] Configure error alerting
   - [ ] Set up logging for critical paths

5. **Final Verification**
   - [ ] Test all pricing tiers
   - [ ] Verify usage resets work
   - [ ] Test export limits
   - [ ] Verify cancellation flow

---

### Phase B: Chrome Extension

**Goal**: Create new tab extension that opens TrackBillables

#### Tasks:
1. **Extension Development**
   - [ ] Create manifest.json for Chrome extension
   - [ ] Implement new tab override to open live site
   - [ ] Add extension icon and branding
   - [ ] Test locally

2. **Chrome Web Store**
   - [ ] Create Chrome Web Store developer account
   - [ ] Prepare store listing (description, screenshots)
   - [ ] Submit for review
   - [ ] Publish extension

3. **Marketing & Distribution**
   - [ ] Add extension link to website
   - [ ] Create installation guide
   - [ ] Announce to users

---

## Future Enhancements (Post-Launch)

### Email Notifications
- Welcome emails for new users
- Usage warning emails (approaching limits)
- Payment receipts and invoices
- Monthly usage summaries

### Export Templates
- Custom invoice templates for Pro users
- Branding options
- Multiple format options

### Mobile Responsiveness
- Optimize dashboard for mobile devices
- Touch-friendly interactions
- Progressive Web App (PWA) consideration

### Advanced Analytics
- Monthly/yearly trends
- Client profitability analysis
- Time allocation insights
- Custom date ranges

---

## Notes

- All Stripe testing should use test cards: `4242 4242 4242 4242`
- Production Stripe keys start with `pk_live_` and `sk_live_`
- Always test webhook delivery in production before announcing launch
- Keep a rollback plan ready for critical billing issues

---

Last Updated: January 19, 2026
