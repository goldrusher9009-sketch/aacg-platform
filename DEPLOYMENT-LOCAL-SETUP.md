# AACG Platform - Local Setup & Railway Deployment

## Overview
This guide walks you through deploying the AACG Platform to Railway.app using credentials stored securely on your local machine.

---

## Step 1: Gather Your Credentials

Collect the following from your service dashboards:

### Supabase (Database & Auth)
- Dashboard URL: https://app.supabase.com
- Go to: Settings > API
- Copy:
  - **NEXT_PUBLIC_SUPABASE_URL** (Project URL)
  - **NEXT_PUBLIC_SUPABASE_ANON_KEY** (anon key)
  - **SUPABASE_SERVICE_ROLE_KEY** (service_role key)
- Go to: Settings > Database
  - Copy: **DATABASE_URL** (Connection string)

### Stripe (Payments)
- Dashboard URL: https://dashboard.stripe.com
- Go to: Developers > API Keys
- Copy (use LIVE keys, not test):
  - **STRIPE_SECRET_KEY** (sk_live_...)
  - **STRIPE_PUBLISHABLE_KEY** (pk_live_...)
- Go to: Developers > Webhooks
  - Create new endpoint for: `https://your-app.railway.app/api/stripe/webhook`
  - Copy the signing secret as: **STRIPE_WEBHOOK_SECRET** (whsec_...)

### SendGrid (Email)
- Dashboard URL: https://app.sendgrid.com
- Go to: Settings > API Keys
- Create new API key with "Mail Send" permission
- Copy: **SENDGRID_API_KEY** (SG....)
- Set: **SENDGRID_FROM_EMAIL** (e.g., noreply@aacgplatform.com)

### OpenAI (AI Photo Analysis)
- Dashboard URL: https://platform.openai.com
- Go to: API Keys
- Copy: **OPENAI_API_KEY** (sk-proj-...)

---

## Step 2: Create Local Environment File

1. Open `.env.local` in the AACG-Platform directory
2. Fill in ALL credential values (replace placeholders)
3. Save the file
4. **⚠️ IMPORTANT:** Never commit `.env.local` to git (it's in .gitignore)

```bash
# Example for testing:
NEXT_PUBLIC_SUPABASE_URL=https://myproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
# ... etc
```

---

## Step 3: Install Railway CLI

### macOS / Linux:
```bash
npm install -g @railway/cli
# or
brew install railway
```

### Windows:
```bash
npm install -g @railway/cli
```

Verify installation:
```bash
railway --version
```

---

## Step 4: Authenticate with Railway

```bash
railway login
```

This opens a browser window for you to authenticate. Follow the prompts.

---

## Step 5: Link to Your Railway Project

```bash
railway link
```

Select your AACG Platform project from the list (or create a new one if this is first deployment).

---

## Step 6: Deploy Application

**Automatic Deployment (Recommended):**
```bash
bash deploy-to-railway.sh
```

This script:
1. Verifies `.env.local` exists
2. Checks Railway CLI is installed
3. Loads your credentials
4. Sets all environment variables in Railway
5. Deploys the application

**Manual Deployment:**
```bash
# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Set them in Railway
railway variables set \
  NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  # ... (all 12 variables)

# Deploy
railway up
```

---

## Step 7: Verify Deployment

### Check Deployment Status:
```bash
railway status
```

Output shows your app URL (e.g., https://aacg-platform-prod.railway.app)

### Test Health Endpoint:
```bash
curl https://YOUR-APP-URL.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "database": "connected",
    "stripe": "connected",
    "auth": "configured"
  }
}
```

### View Logs:
```bash
railway logs
```

This streams real-time logs from your deployed application.

---

## Step 8: Configure Stripe Webhook

1. Get your Railway app URL from `railway status`
2. Go to Stripe Dashboard > Developers > Webhooks
3. Add endpoint: `https://YOUR-APP-URL/api/stripe/webhook`
4. Select events: `payment_intent.succeeded`, `charge.refunded`, `invoice.payment_succeeded`
5. Copy the signing secret
6. Update in Railway: `railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."`

---

## Step 9: Verify All API Endpoints

Test key endpoints to confirm deployment:

```bash
# Health check
curl https://YOUR-APP-URL/api/health

# Get mechanics liens
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://YOUR-APP-URL/api/mechanics-liens

# Check Supabase connection
curl https://YOUR-APP-URL/api/db/health

# Check Stripe status
curl https://YOUR-APP-URL/api/stripe/health
```

---

## Troubleshooting

### "Railway CLI not found"
```bash
npm install -g @railway/cli
```

### ".env.local not found"
```bash
cp .env.local.example .env.local
# Then fill in your actual credentials
```

### "Authentication failed"
```bash
railway logout
railway login  # Re-authenticate
```

### "Environment variables not set"
```bash
railway variables list  # Check what's set
railway variables set KEY=VALUE  # Set individually
```

### "Deployment failed - build error"
```bash
railway logs  # Check what failed
# Common issues:
# - Node.js version mismatch (need 18.x or 20.x)
# - Missing database migrations
# - Invalid environment variable format
```

### "Cannot connect to database"
- Verify DATABASE_URL is correct in Railway variables
- Check Supabase firewall allows Railway IP
- Ensure Supabase project is running

### "Stripe webhook not delivering"
- Verify webhook URL is correct in Stripe dashboard
- Check webhook secret matches STRIPE_WEBHOOK_SECRET
- View webhook logs in Stripe dashboard for delivery status

---

## Next Steps (Phase 1)

After successful deployment:

1. **Verify all 11 API endpoints** are responding
2. **Test authentication flow** - login and verify JWT tokens work
3. **Test payment flow** - complete a test Stripe transaction
4. **Start Phase 1 MVP Development:**
   - Agent A-01: Photo AI (OpenAI integration for image analysis)
   - Agent A-04: Mechanics Lien Tracking (CRUD + status management)

---

## File Reference

- `.env.local` - Your local credentials (never commit to git)
- `deploy-to-railway.sh` - Automated deployment script
- `.env.production` - Production template (for reference)
- `Procfile` - Railway process definition
- `Dockerfile` - Container configuration
- `package.json` - Dependencies and scripts

---

## Security Notes

✅ **Secure:**
- Credentials stored only on your local machine
- `.env.local` is in `.gitignore` (won't be committed)
- Railway stores credentials encrypted in their vault
- Script loads variables into Railway, never uploads .env.local file

❌ **Never do:**
- Commit `.env.local` to git
- Paste credentials in chat or email
- Share the script output containing secrets
- Store credentials in code comments

---

**Deployment ready. Execute `bash deploy-to-railway.sh` when you have credentials in `.env.local`**
