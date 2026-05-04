#!/bin/bash

# ============================================================
# AACG Platform - Railway.app Deployment Script
# ============================================================
# This script deploys the application to Railway.app using
# credentials from your local .env.local file

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║ AACG Platform - Railway.app Deployment                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# STEP 1: Verify .env.local exists
# ============================================================
echo "Step 1/6: Checking environment file..."
if [ ! -f ".env.local" ]; then
    echo "❌ ERROR: .env.local not found"
    echo "   Please create .env.local with your credentials"
    echo "   Use .env.local.example as a template"
    exit 1
fi
echo "✅ .env.local found"
echo ""

# ============================================================
# STEP 2: Verify Railway CLI is installed
# ============================================================
echo "Step 2/6: Checking Railway CLI..."
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    echo "   Install: npm install -g @railway/cli"
    echo "   Or: brew install railway"
    exit 1
fi
echo "✅ Railway CLI installed: $(railway --version)"
echo ""

# ============================================================
# STEP 3: Login to Railway
# ============================================================
echo "Step 3/6: Authenticating with Railway..."
railway login --browserless
echo "✅ Authenticated with Railway"
echo ""

# ============================================================
# STEP 4: Link to Railway project
# ============================================================
echo "Step 4/6: Linking to Railway project..."
echo "   Select your AACG Platform project when prompted"
railway link
echo "✅ Linked to Railway project"
echo ""

# ============================================================
# STEP 5: Set environment variables
# ============================================================
echo "Step 5/6: Setting environment variables..."
export $(cat .env.local | grep -v '^#' | xargs)

# Set variables in Railway
railway variables set \
  NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  DATABASE_URL="$DATABASE_URL" \
  STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE_KEY" \
  STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  SENDGRID_API_KEY="$SENDGRID_API_KEY" \
  SENDGRID_FROM_EMAIL="$SENDGRID_FROM_EMAIL" \
  OPENAI_API_KEY="$OPENAI_API_KEY" \
  NODE_ENV="production" \
  NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL"

echo "✅ Environment variables configured"
echo ""

# ============================================================
# STEP 6: Deploy application
# ============================================================
echo "Step 6/6: Deploying to Railway..."
railway up

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║ ✅ Deployment Complete                                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Monitor deployment: railway logs"
echo "2. Get your app URL: railway status"
echo "3. Verify health: curl https://YOUR-APP.railway.app/api/health"
echo "4. Configure Stripe webhook to: https://YOUR-APP.railway.app/api/stripe/webhook"
echo ""
