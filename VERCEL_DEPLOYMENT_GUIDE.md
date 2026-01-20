# Vercel Deployment Guide - TrackBillables

Complete step-by-step guide to deploy TrackBillables to Vercel.

---

## Step 1: Create Vercel Account & Connect Repository

### 1.1 Sign Up for Vercel
1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended - easiest integration)
4. Authorize Vercel to access your GitHub account
5. Complete any additional verification if prompted

### 1.2 Import Your Repository
1. Once logged in, click **"Add New..."** → **"Project"**
2. You'll see a list of your GitHub repositories
3. Find **"trackBillables"** repository
4. Click **"Import"**

**If you don't see your repository:**
- Click "Adjust GitHub App Permissions"
- Make sure Vercel has access to the repository
- Refresh the page

---

## Step 2: Configure Project Settings

### 2.1 Basic Configuration
Vercel should auto-detect Next.js settings:

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

**✅ Don't change these - they're correct!**

### 2.2 Configure Environment Variables

Click **"Environment Variables"** section.

**CRITICAL**: Add all environment variables from your `.env.local` file:

#### Supabase Variables

| Name | Value | Notes |
|------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://abhplcdqblijxfvcbfgj.supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1...` (from your .env.local) | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1...` (from your .env.local) | ⚠️ Secret - server-side only |

#### Stripe Variables (TEST MODE)

| Name | Value | Notes |
|------|-------|-------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (from your .env.local) | TEST mode publishable key |
| `STRIPE_SECRET_KEY` | `sk_test_...` (from your .env.local) | ⚠️ TEST mode secret key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from your .env.local) | TEST mode webhook secret |
| `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY` | `price_1SefDaCnzNMpemDjuleE3Rjy` | Monthly price ID |
| `NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL` | `price_1SefDaCnzNMpemDjIl8Hku8y` | Annual price ID |

#### Application Variables

| Name | Value | Notes |
|------|-------|-------|
| `NODE_ENV` | `production` | Set environment to production |
| `NEXT_PUBLIC_APP_URL` | Leave blank for now | We'll add this after deployment |

**How to add each variable:**
1. Enter the **Name** (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
2. Enter the **Value** (copy from your `.env.local`)
3. Click **"Add"**
4. Repeat for all variables above

**⚠️ Important Notes:**
- Use TEST mode Stripe keys for initial deployment
- We'll switch to live keys after Stripe approves your site
- Make sure there are no typos - variable names are case-sensitive
- Don't add quotes around values (Vercel handles this)

---

## Step 3: Deploy!

### 3.1 Start Deployment
1. After adding all environment variables, click **"Deploy"**
2. Vercel will:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Run build (`npm run build`)
   - Deploy to their edge network
3. Watch the build logs in real-time

**Build time**: Usually 2-5 minutes

### 3.2 Deployment Success
When complete, you'll see:
- ✅ **"Congratulations!"** message
- Your deployment URL: `https://trackbillables.vercel.app` (or similar)
- A preview screenshot of your site

**Click "Visit"** to see your live site!

---

## Step 4: Verify Deployment

### 4.1 Basic Functionality Tests

1. **Visit your site**: Click the deployment URL
2. **Test HTTPS**: Verify the padlock icon in browser (Vercel auto-provisions SSL)
3. **Test Authentication**:
   - Click "Sign Up" or "Login"
   - Create a test account
   - Verify you can log in successfully
4. **Test Dashboard**:
   - Verify dashboard loads
   - Check that UI renders correctly
   - Open browser console (F12) - check for errors
5. **Test Adding Entry**:
   - Add a billable entry
   - Verify it saves and appears in the list
6. **Test Export**:
   - Click Export
   - Try downloading CSV
   - Verify file downloads

### 4.2 Check for Issues

**Open Browser Console (F12) and check:**
- ❌ Red errors? Note them down
- ⚠️ Warnings? Usually okay, but review them
- ✅ No errors? Perfect!

**Common Issues:**

| Issue | Cause | Fix |
|-------|-------|-----|
| "Failed to fetch" | CORS or API route issue | Check Vercel function logs |
| "Invalid credentials" | Supabase env vars wrong | Double-check environment variables |
| White screen | Build error | Check Vercel deployment logs |
| Stripe checkout fails | Stripe keys incorrect | Verify Stripe environment variables |

---

## Step 5: Update NEXT_PUBLIC_APP_URL

Now that you have your deployment URL, we need to add it to environment variables.

### 5.1 Add App URL
1. In Vercel dashboard, go to your project
2. Click **"Settings"** tab
3. Click **"Environment Variables"** in left sidebar
4. Add new variable:
   - **Name**: `NEXT_PUBLIC_APP_URL`
   - **Value**: `https://trackbillables.vercel.app` (your actual URL)
   - Click **"Save"**

### 5.2 Redeploy
1. Go to **"Deployments"** tab
2. Click the three dots (⋯) on the latest deployment
3. Click **"Redeploy"**
4. Wait for redeployment to complete

---

## Step 6: Configure Stripe Webhook (TEST Mode)

Even though we're using test mode, let's configure the webhook with your live URL.

### 6.1 Update Stripe Webhook URL
1. Go to Stripe Dashboard: https://dashboard.stripe.com/test/webhooks
2. Find your existing webhook (or create new one if needed)
3. Click to edit
4. Update **Endpoint URL** to: `https://trackbillables.vercel.app/api/stripe/webhook`
5. Ensure these events are selected:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click **"Update endpoint"**

### 6.2 Update Webhook Secret (if changed)
1. Copy the new **Signing secret** (whsec_...)
2. If it changed, update in Vercel:
   - Settings → Environment Variables
   - Update `STRIPE_WEBHOOK_SECRET`
   - Redeploy

---

## Step 7: End-to-End Testing on Production

Run through complete flow on your live site:

### 7.1 Create Test Account
1. Visit your live URL
2. Sign up with test email: `test+production@yourdomain.com`
3. Verify you can log in

### 7.2 Test Free Tier
1. Add a few billable entries
2. Verify usage counter updates
3. Try exporting

### 7.3 Test Upgrade Flow (TEST MODE)
1. Click "Upgrade to Pro"
2. Complete Stripe checkout with test card: `4242 4242 4242 4242`
3. After redirect, verify:
   - Pro badge appears
   - Usage shows "Unlimited"
   - Billing page shows "Pro Plan - Active"

### 7.4 Verify Webhook
1. Check Stripe Dashboard → Webhooks → Your webhook
2. Look for recent `checkout.session.completed` event
3. Should show 200 response

✅ **If all tests pass, your production deployment is successful!**

---

## Step 8: Domain Setup - trackbillables.com

### 8.1 Check Domain Availability

**Option A: Use Vercel Domains**
1. In Vercel project, go to **Settings** → **Domains**
2. Enter `trackbillables.com`
3. Vercel will check availability and show price
4. Typical cost: **$15-20/year** for .com domains

**Option B: Use External Registrar**
- Namecheap: ~$13/year
- Google Domains: ~$12/year
- Cloudflare: ~$10/year (at cost)

**My Recommendation**: Buy through Vercel for simplicity - automatic configuration!

### 8.2 Purchase Domain via Vercel

If available and priced reasonably:

1. In Vercel project → **Settings** → **Domains**
2. Click **"Buy"** next to trackbillables.com
3. Fill in registration details:
   - Full name
   - Email address
   - Physical address (required by ICANN)
   - Phone number
4. Enter payment details
5. Complete purchase

**Vercel automatically:**
- Configures DNS
- Provisions SSL certificate
- Sets up CDN
- No additional configuration needed!

### 8.3 Alternative: Purchase Externally & Connect

If you buy from another registrar:

1. Purchase domain from registrar
2. In domain registrar, add these DNS records:

**For root domain (trackbillables.com):**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21`

**For www subdomain:**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`

3. In Vercel project → **Settings** → **Domains**
4. Enter `trackbillables.com`
5. Click **"Add"**
6. Vercel will verify DNS configuration
7. Wait for SSL certificate (can take 5-60 minutes)

### 8.4 Update Environment Variables
Once domain is configured:

1. Go to Vercel → **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_APP_URL`:
   - Change from: `https://trackbillables.vercel.app`
   - Change to: `https://trackbillables.com`
3. Click **"Save"**
4. Redeploy application

### 8.5 Update Stripe Webhook URL
1. Go to Stripe Dashboard → Webhooks
2. Edit your webhook
3. Update URL to: `https://trackbillables.com/api/stripe/webhook`
4. Save changes

---

## Step 9: Submit to Stripe for Verification

Now that your site is live, submit it to Stripe to activate production mode.

### 9.1 Update Business Information
1. Go to Stripe Dashboard: https://dashboard.stripe.com
2. Click **Settings** (⚙️ icon) → **Account details**
3. Ensure all information is complete:
   - Business name
   - Business description
   - Support email
   - Support phone (optional but recommended)

### 9.2 Add Website URL
1. In Settings → **Public details**
2. Add **Website URL**: `https://trackbillables.com` (or .vercel.app URL)
3. Add **Business description**: "Time tracking and billable hours management for professionals"
4. Click **"Save"**

### 9.3 Wait for Verification
- Stripe will review your website (usually 1-2 business days)
- You'll receive an email when approved
- Once approved, you can switch to Live Mode

### 9.4 What Stripe Checks
- Website is accessible (not password-protected)
- Website has clear product/service description
- Contact information is visible
- Privacy policy (add this if missing!)
- Terms of service (add this if missing!)

**Pro Tip**: Add simple Privacy Policy and Terms of Service pages to speed up approval. These can be basic templates.

---

## Step 10: Post-Deployment Checklist

After deployment is complete:

- [ ] Site is live and accessible via HTTPS
- [ ] Authentication works (signup/login)
- [ ] Dashboard loads correctly
- [ ] Can add billable entries
- [ ] Can export data
- [ ] Test upgrade flow works (test mode)
- [ ] Pro badge appears after upgrade
- [ ] Webhooks deliver successfully
- [ ] Custom domain configured (trackbillables.com)
- [ ] Environment variable `NEXT_PUBLIC_APP_URL` updated
- [ ] Stripe webhook URL updated with custom domain
- [ ] Website submitted to Stripe for verification
- [ ] No console errors in browser

---

## Troubleshooting

### Build Fails
**Check Vercel build logs:**
1. Go to deployment
2. Click on failed deployment
3. Review build logs for errors
4. Common fixes:
   - Missing environment variables
   - TypeScript errors (fix locally first)
   - Dependency issues (`npm install` locally to verify)

### Site Loads but Features Don't Work
**Check Vercel Function Logs:**
1. Go to project → **Logs** tab
2. Filter by errors
3. Look for API route failures
4. Common causes:
   - Wrong environment variables
   - Database connection issues
   - CORS problems

### Stripe Checkout Doesn't Open
**Check:**
- Stripe publishable key is correct (pk_test_...)
- Stripe secret key is correct (sk_test_...)
- Price IDs match your Stripe products
- Browser console for errors

### Webhooks Not Received
**Check:**
- Webhook URL is correct in Stripe Dashboard
- Webhook secret matches Vercel environment variable
- Check Stripe webhook logs for delivery failures
- Ensure webhook signature verification is enabled

---

## Next Steps After Deployment

1. **Monitor first 24 hours**:
   - Check Vercel logs for errors
   - Test all features thoroughly
   - Get feedback from test users

2. **Wait for Stripe approval** (1-2 days)

3. **Once Stripe approves**:
   - Create production products
   - Switch to live Stripe keys
   - Test with real payment (then cancel)
   - Announce launch! 🚀

---

## Useful Links

- **Your Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Documentation**: https://vercel.com/docs
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Supabase Dashboard**: https://supabase.com/dashboard

---

Last Updated: January 19, 2026
