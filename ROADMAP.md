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

#### Tasks:
1. **Create Production Stripe Products**
   - [ ] Create Pro Monthly product ($10/month)
   - [ ] Create Pro Annual product ($100/year)
   - [ ] Note down production price IDs
   - [ ] Save production API keys (publishable & secret)

2. **Security Review**
   - [ ] Review all API endpoints for authentication
   - [ ] Verify webhook signature verification is enabled
   - [ ] Check that service role key usage is appropriate
   - [ ] Review CORS settings
   - [ ] Ensure no sensitive data in client-side code

3. **Documentation**
   - [ ] Document production environment variables
   - [ ] Create deployment checklist
   - [ ] Document rollback procedures
   - [ ] Create monitoring plan

4. **Final Testing in Test Mode**
   - [ ] Test complete signup → upgrade → billing flow
   - [ ] Test subscription cancellation
   - [ ] Test usage limit enforcement
   - [ ] Test monthly usage reset logic
   - [ ] Verify email collection in Stripe checkout

---

### Phase A: Deploy Live

**Goal**: Get the application live with a public URL

#### Tasks:
1. **Choose Hosting Platform**
   - [ ] Decision: Vercel vs Netlify vs other
   - [ ] Set up deployment pipeline
   - [ ] Configure custom domain (if applicable)

2. **Environment Configuration**
   - [ ] Set up production environment variables
   - [ ] Configure Supabase production settings
   - [ ] Set production Stripe keys
   - [ ] Configure production webhook secret (temporary)

3. **Deploy Application**
   - [ ] Initial deployment
   - [ ] Verify SSL certificate
   - [ ] Test basic functionality (login, dashboard)
   - [ ] Smoke test all major features

4. **DNS & Domain Setup**
   - [ ] Configure DNS records
   - [ ] Verify domain is accessible
   - [ ] Test HTTPS enforcement

---

### Phase C (Continued): Finalize Production Billing (10% Online)

**Goal**: Complete billing setup that requires live URL

#### Tasks:
1. **Configure Production Webhooks**
   - [ ] Add webhook endpoint in Stripe Dashboard: `https://yourdomain.com/api/stripe/webhook`
   - [ ] Update production webhook secret in environment variables
   - [ ] Redeploy with new webhook secret

2. **End-to-End Production Testing**
   - [ ] Create test account on production
   - [ ] Complete full upgrade flow with real card (then cancel)
   - [ ] Verify webhook events are received
   - [ ] Verify subscription syncs to database
   - [ ] Verify Pro badge appears after upgrade
   - [ ] Test subscription management (update payment, cancel)
   - [ ] Verify usage limits work correctly

3. **Monitoring Setup**
   - [ ] Set up Stripe webhook monitoring
   - [ ] Configure error alerting
   - [ ] Set up logging for critical paths

4. **Final Verification**
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
