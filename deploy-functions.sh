#!/bin/bash
# ============================================================
#  IronForge — One-Click Edge Function Deployer (bash)
#  Works on WSL, Mac, Linux
#
#  HOW TO RUN:
#  1. Get your Supabase PAT: https://supabase.com/dashboard/account/tokens
#  2. Run: bash deploy-functions.sh sbp_YOUR_TOKEN_HERE
# ============================================================

set -e

TOKEN="${1}"
if [ -z "$TOKEN" ]; then
  echo "Usage: bash deploy-functions.sh sbp_YOUR_TOKEN_HERE"
  echo "Get your token at: https://supabase.com/dashboard/account/tokens"
  exit 1
fi

PROJECT_REF="wausefmzaqtlomyhqcjf"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FUNCTIONS_DIR="$SCRIPT_DIR/supabase/functions"
CLI="/tmp/supabase"

echo ""
echo "=================================================="
echo "  IronForge Edge Function Deployer"
echo "=================================================="
echo ""

# ── Step 1: Download Supabase CLI ────────────────────────────
echo "[1/4] Downloading Supabase CLI..."
if [ ! -f "$CLI" ]; then
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  ARCH=$(uname -m)
  [ "$ARCH" = "x86_64" ] && ARCH="amd64"
  [ "$ARCH" = "aarch64" ] && ARCH="arm64"
  curl -sL "https://github.com/supabase/cli/releases/latest/download/supabase_${OS}_${ARCH}.tar.gz" \
    | tar -xz -C /tmp/
  chmod +x "$CLI"
fi
echo "  CLI ready: $($CLI --version)"

export SUPABASE_ACCESS_TOKEN="$TOKEN"

# ── Step 2: Set all secrets ──────────────────────────────────
echo ""
echo "[2/4] Setting Supabase secrets..."

declare -A SECRETS=(
  ["STRIPE_SECRET_KEY"]="sk_live_YOUR_STRIPE_KEY_HERE"
  ["STRIPE_WEBHOOK_SECRET"]="YOUR_STRIPE_WEBHOOK_SECRET"
  ["TWILIO_ACCOUNT_SID"]="YOUR_TWILIO_ACCOUNT_SID"
  ["TWILIO_AUTH_TOKEN"]="YOUR_TWILIO_AUTH_TOKEN"
  ["TWILIO_PHONE_NUMBER"]="+18566363987"
  ["RESEND_API_KEY"]="YOUR_RESEND_API_KEY"
)

for KEY in "${!SECRETS[@]}"; do
  echo "  Setting $KEY..."
  echo "${SECRETS[$KEY]}" | "$CLI" secrets set "$KEY" --project-ref "$PROJECT_REF"
done

echo "  All secrets set."

# ── Step 3: Deploy all edge functions ───────────────────────
echo ""
echo "[3/4] Deploying Edge Functions..."

FUNCTIONS=("stripe-webhook" "create-checkout" "create-portal-session" "send-sms" "send-email")

for FN in "${FUNCTIONS[@]}"; do
  FN_PATH="$FUNCTIONS_DIR/$FN"
  if [ ! -d "$FN_PATH" ]; then
    echo "  WARNING: $FN not found at $FN_PATH"
    continue
  fi
  echo -n "  Deploying $FN..."
  if "$CLI" functions deploy "$FN" \
      --project-ref "$PROJECT_REF" \
      --no-verify-jwt \
      2>/dev/null; then
    echo " DEPLOYED"
  else
    echo " FAILED (check output above)"
  fi
done

# ── Step 4: Summary ─────────────────────────────────────────
echo ""
echo "=================================================="
echo "  DEPLOYED FUNCTIONS"
echo "=================================================="
for FN in "${FUNCTIONS[@]}"; do
  echo "  https://$PROJECT_REF.supabase.co/functions/v1/$FN"
done

echo ""
echo "=================================================="
echo "  ACTION REQUIRED — 2 manual steps:"
echo "=================================================="
echo ""
echo "  1. RUN MIGRATION in Supabase SQL Editor:"
echo "     alter table profiles add column if not exists stripe_customer_id text;"
echo "     alter table profiles add column if not exists stripe_subscription_id text;"
echo ""
echo "  2. REGISTER STRIPE WEBHOOK → https://dashboard.stripe.com/webhooks"
echo "     URL: https://$PROJECT_REF.supabase.co/functions/v1/stripe-webhook"
echo "     Events: checkout.session.completed, customer.subscription.deleted, invoice.payment_failed"
echo ""
echo "  Platform live at: https://aacgplatform.com/admin/index.html"
echo ""
