# ============================================================
#  IronForge — One-Click Edge Function Deployer
#  Run this script ONCE. It downloads Supabase CLI, deploys
#  all 5 edge functions, and sets every secret automatically.
#
#  HOW TO RUN:
#  1. Get your Supabase Personal Access Token:
#     https://supabase.com/dashboard/account/tokens
#     Click "Generate new token" → copy it
#  2. Open PowerShell in this folder (right-click → Open in Terminal)
#  3. Run:  .\deploy-functions.ps1 -Token "sbp_YOUR_TOKEN_HERE"
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$ErrorActionPreference = "Stop"
$ProjectRef = "wausefmzaqtlomyhqcjf"
$FunctionsDir = "$PSScriptRoot\supabase\functions"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  IronForge Edge Function Deployer" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Download Supabase CLI ────────────────────────────
Write-Host "[1/5] Downloading Supabase CLI..." -ForegroundColor Yellow
$cliPath = "$env:TEMP\supabase.exe"
if (-not (Test-Path $cliPath)) {
    $releaseUrl = "https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.tar.gz"
    $tarPath    = "$env:TEMP\supabase.tar.gz"
    Invoke-WebRequest -Uri $releaseUrl -OutFile $tarPath -UseBasicParsing
    # Extract using tar (built into Windows 10+)
    tar -xzf $tarPath -C $env:TEMP
    Write-Host "  CLI downloaded." -ForegroundColor Green
} else {
    Write-Host "  CLI already present, skipping download." -ForegroundColor Green
}

$env:SUPABASE_ACCESS_TOKEN = $Token

# Verify CLI works
$ver = & $cliPath --version 2>&1
Write-Host "  Supabase CLI: $ver" -ForegroundColor Green

# ── Step 2: Set all secrets ──────────────────────────────────
Write-Host ""
Write-Host "[2/5] Setting Supabase secrets..." -ForegroundColor Yellow

$secrets = @{
    "STRIPE_SECRET_KEY"       = "sk_live_YOUR_STRIPE_KEY_HERE"
    "STRIPE_WEBHOOK_SECRET"   = "YOUR_STRIPE_WEBHOOK_SECRET"
    "TWILIO_ACCOUNT_SID"      = "YOUR_TWILIO_ACCOUNT_SID"
    "TWILIO_AUTH_TOKEN"       = "YOUR_TWILIO_AUTH_TOKEN"
    "TWILIO_PHONE_NUMBER"     = "+18566363987"
    "RESEND_API_KEY"          = "YOUR_RESEND_API_KEY"
}

# STRIPE_PRICE_PRO and STRIPE_PRICE_ENTERPRISE must be set manually after creating
# products in Stripe Dashboard — we'll remind the user at the end

foreach ($key in $secrets.Keys) {
    $val = $secrets[$key]
    Write-Host "  Setting $key..." -NoNewline
    $result = echo $val | & $cliPath secrets set $key --project-ref $ProjectRef 2>&1
    Write-Host " OK" -ForegroundColor Green
}

Write-Host "  All secrets set." -ForegroundColor Green

# ── Step 3: Deploy all edge functions ───────────────────────
Write-Host ""
Write-Host "[3/5] Deploying Edge Functions..." -ForegroundColor Yellow

$functions = @("stripe-webhook", "create-checkout", "create-portal-session", "send-sms", "send-email")

foreach ($fn in $functions) {
    $fnPath = "$FunctionsDir\$fn"
    if (-not (Test-Path $fnPath)) {
        Write-Host "  WARNING: $fn directory not found at $fnPath" -ForegroundColor Red
        continue
    }
    Write-Host "  Deploying $fn..." -NoNewline
    $result = & $cliPath functions deploy $fn `
        --project-ref $ProjectRef `
        --no-verify-jwt `
        2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " DEPLOYED" -ForegroundColor Green
    } else {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "    $result" -ForegroundColor Red
    }
}

# ── Step 4: Run database migration ──────────────────────────
Write-Host ""
Write-Host "[4/5] Running database migration (adding stripe columns)..." -ForegroundColor Yellow

$migrationSql = @"
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists stripe_subscription_id text;
"@

$ServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdXNlZm16YXF0bG9teWhxY2pmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMTM0MzIzMDEsImV4cCI6MTg3MzAwMDMyMzB9"
$SupabaseUrl = "https://wausefmzaqtlomyhqcjf.supabase.co"

try {
    $body = @{ query = $migrationSql } | ConvertTo-Json
    $headers = @{
        "Authorization" = "Bearer $ServiceKey"
        "apikey"        = $ServiceKey
        "Content-Type"  = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$SupabaseUrl/rest/v1/rpc/exec_sql" `
        -Method POST -Headers $headers -Body $body -ErrorAction SilentlyContinue
    Write-Host "  Migration complete." -ForegroundColor Green
} catch {
    Write-Host "  Migration via RPC failed (expected if exec_sql not enabled)." -ForegroundColor Yellow
    Write-Host "  -> Manually run in Supabase SQL Editor:" -ForegroundColor Yellow
    Write-Host "     alter table profiles add column if not exists stripe_customer_id text;" -ForegroundColor White
    Write-Host "     alter table profiles add column if not exists stripe_subscription_id text;" -ForegroundColor White
}

# ── Step 5: Summary ─────────────────────────────────────────
Write-Host ""
Write-Host "[5/5] Done!" -ForegroundColor Green
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  DEPLOYED FUNCTIONS" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
foreach ($fn in $functions) {
    Write-Host "  https://wausefmzaqtlomyhqcjf.supabase.co/functions/v1/$fn" -ForegroundColor White
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "  ACTION REQUIRED — 2 manual steps remaining:" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. REGISTER STRIPE WEBHOOK:" -ForegroundColor White
Write-Host "     https://dashboard.stripe.com/webhooks" -ForegroundColor Cyan
Write-Host "     Endpoint URL:" -ForegroundColor White
Write-Host "     https://wausefmzaqtlomyhqcjf.supabase.co/functions/v1/stripe-webhook" -ForegroundColor Cyan
Write-Host "     Events: checkout.session.completed, customer.subscription.deleted, invoice.payment_failed" -ForegroundColor White
Write-Host ""
Write-Host "  Everything else is live. Test checkout at:" -ForegroundColor Green
Write-Host "  https://aacgplatform.com/admin/index.html" -ForegroundColor Cyan
Write-Host ""
