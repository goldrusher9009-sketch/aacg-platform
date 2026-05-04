# AACG Platform - Quick Start Deployment (5 Minutes)

**Time to Deploy:** 5 minutes setup + 5 minutes deployment  
**Status:** ✅ Ready Now

---

## The Fastest Path to Production

### Step 1: Push to GitHub (2 minutes)

```bash
cd /path/to/AACG-Platform

# Set your GitHub username
git init
git add .
git commit -m "AACG Platform v1.0.2 - Production Ready"
git remote add origin https://github.com/YOUR_USERNAME/AACG-Platform.git
git branch -M main
git push -u origin main
```

### Step 2: Create Railway Project (1 minute)

1. Go to https://railway.app (create account if needed)
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Choose **AACG-Platform** repository
5. Click **Deploy**

### Step 3: Add Environment Variables (2 minutes)

In Railway.app, go to **Variables** tab and paste:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your_anon_key]
SUPABASE_SERVICE_ROLE_KEY=[your_service_role_key]
DATABASE_URL=postgresql://[your_db_url]
STRIPE_SECRET_KEY=sk_live_[your_key]
STRIPE_PUBLISHABLE_KEY=pk_live_[your_key]
STRIPE_WEBHOOK_SECRET=whsec_[your_secret]
SENDGRID_API_KEY=SG.[your_key]
SENDGRID_FROM_EMAIL=noreply@aacgplatform.com
OPENAI_API_KEY=sk-proj-[your_key]
NODE_ENV=production
NEXT_PUBLIC_API_URL=[your-railway-url].railway.app
NEXT_PUBLIC_APP_NAME=AACG Platform
```

### Step 4: Verify Deployment (30 seconds)

```bash
# Get your Railway app URL from dashboard
# Test health endpoint:
curl https://YOUR-APP.railway.app/api/health

# Response should show:
{
  "status": "healthy",
  "timestamp": "2026-04-29T...",
  "environment": "production",
  "checks": {
    "api": "operational",
    "database": "connected",
    "stripe": "connected"
  }
}
```

**✅ Done!** Your app is live on `https://YOUR-APP.railway.app`

---

## What Got Deployed

✅ **Next.js 14** - Latest React framework  
✅ **PostgreSQL** - Production database  
✅ **6 Pages** - Dashboard, Login, Mechanics Liens, Photo Analysis, Settings, more  
✅ **11 API Endpoints** - All CRUD operations  
✅ **Stripe Integration** - Payments ready  
✅ **Supabase Auth** - User authentication  
✅ **Multi-tenant** - Company isolation  
✅ **Test Suite** - Comprehensive testing  

---

## Next Steps (Optional)

### Configure Stripe Webhooks

```bash
# In Stripe Dashboard:
# 1. Developers → Webhooks → Add Endpoint
# 2. URL: https://YOUR-APP.railway.app/api/stripe/webhook
# 3. Events: payment_intent.succeeded, failed, refunded
# 4. Copy webhook secret
# 5. Add to Railway: STRIPE_WEBHOOK_SECRET=whsec_...
```

### Set Up Custom Domain

```bash
# In Railway.app:
# 1. Settings → Custom Domain
# 2. Add your domain: app.aacgplatform.com
# 3. Add CNAME record to DNS
# 4. Railway handles SSL certificate
```

### Monitor Performance

```bash
# In Railway.app dashboard:
# - CPU usage
# - Memory usage
# - Request rate
# - Error count
# - Response time
```

---

## Test Your API

```bash
# Test login
curl -X POST https://YOUR-APP.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get mechanics liens
curl https://YOUR-APP.railway.app/api/mechanics-liens?page=1&limit=10

# Get photo analyses
curl https://YOUR-APP.railway.app/api/photo-analysis?page=1&limit=10
```

---

## Rollback (If Needed)

In Railway.app dashboard:
1. Go to **Deployments** tab
2. Click **Redeploy** on previous working version
3. Wait ~3 minutes
4. ✅ App reverted

---

## That's It! 🚀

Your AACG Platform is now live in production.

**Share your app URL:** `https://YOUR-APP.railway.app`

For detailed guides, see:
- **RAILWAY-DEPLOYMENT-GUIDE.md** - Full setup with screenshots
- **DEPLOYMENT-MANIFEST.md** - Pre/post-deployment checklists
- **DEPLOYMENT-FINAL-REPORT.md** - Verification results

---

**Status:** ✅ DEPLOYED & LIVE

Questions? See documentation or Railway.app support.
