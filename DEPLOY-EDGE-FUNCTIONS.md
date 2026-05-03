# IronForge — Edge Function Deployment Guide

Complete step-by-step instructions to deploy all 5 Supabase Edge Functions and wire live Stripe, Twilio, and Resend credentials.

---

## Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Node.js 18+
- Access to your Supabase project dashboard
- Live credentials from `.env.local`

---

## Step 1 — Log in to Supabase CLI

```bash
supabase login
```

This opens a browser window. Authorize it with your Supabase account.

Then link your project (use the project ref from your Supabase URL — the part after `https://` and before `.supabase.co`):

```bash
cd C:\Users\teste\Downloads\AACG-Platform
supabase link --project-ref wausefmzaqtlomyhqcjf
```

---

## Step 2 — Run the Database Schema

Go to **Supabase Dashboard → SQL Editor → New Query**, paste the contents of `supabase-schema.sql`, and click Run.

If your `profiles` table already exists, just run the migration block at the bottom:

```sql
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists stripe_subscription_id text;
```

---

## Step 3 — Set Environment Variables in Supabase

Go to **Supabase Dashboard → Settings → Edge Functions → Secrets** and add each of these:

| Secret Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_51TGr8NCJZMFTCOYkj7Z9xv4ighg4...` (your full key from .env.local) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_524pAJmXFN3HLYh4Jy0MvK4mjT8O7RxP` |
| `STRIPE_PRICE_PRO` | *(set after Step 4 below)* |
| `STRIPE_PRICE_ENTERPRISE` | *(set after Step 4 below)* |
| `TWILIO_ACCOUNT_SID` | `ACee6888f6c48f33d00fe4a84eaf110c00` |
| `TWILIO_AUTH_TOKEN` | `ae6a0b535cc75e2d97cf5088643b1ae3` |
| `TWILIO_PHONE_NUMBER` | `+18566363987` |
| `RESEND_API_KEY` | `re_N3FuSsnk_NjfmrdPGxnPJTgPzRxku6N2A` |

> **Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available in every Edge Function — you don't need to add them manually.

---

## Step 4 — Create Stripe Products and Get Price IDs

1. Go to **[https://dashboard.stripe.com/products](https://dashboard.stripe.com/products)**
2. Click **+ Add product**

**Product 1 — Professional Plan**
- Name: `IronForge Professional`
- Price: `$99.00 / month` (recurring)
- Click **Save product**
- Copy the **Price ID** (looks like `price_1ABC...`)
- Add it to Supabase Secrets as `STRIPE_PRICE_PRO`

**Product 2 — Enterprise Plan**
- Name: `IronForge Enterprise`
- Price: `$299.00 / month` (recurring, or custom)
- Click **Save product**
- Copy the **Price ID**
- Add it to Supabase Secrets as `STRIPE_PRICE_ENTERPRISE`

---

## Step 5 — Deploy All Edge Functions

Run these commands from your project root:

```bash
supabase functions deploy stripe-webhook
supabase functions deploy create-checkout
supabase functions deploy create-portal-session
supabase functions deploy send-sms
supabase functions deploy send-email
```

Or deploy all at once:

```bash
for fn in stripe-webhook create-checkout create-portal-session send-sms send-email; do
  supabase functions deploy $fn
done
```

Each deployment takes ~10 seconds. You'll see confirmation with the function URL.

---

## Step 6 — Register the Stripe Webhook

1. Go to **[https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)**
2. Click **+ Add endpoint**
3. Endpoint URL:
   ```
   https://wausefmzaqtlomyhqcjf.supabase.co/functions/v1/stripe-webhook
   ```
4. Select these events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
5. Click **Add endpoint**
6. On the webhook detail page, click **Reveal** under **Signing secret**
7. Copy the `whsec_...` value
8. Update the `STRIPE_WEBHOOK_SECRET` in Supabase Secrets with this value

> **Important:** The webhook secret in the Supabase Secrets must match the signing secret shown on the Stripe webhook detail page. If you already set `whsec_524pAJmXFN3HLYh4Jy0MvK4mjT8O7RxP`, verify it matches what Stripe shows — if not, update Supabase Secrets.

---

## Step 7 — Enable Stripe Customer Portal

1. Go to **[https://dashboard.stripe.com/settings/billing/portal](https://dashboard.stripe.com/settings/billing/portal)**
2. Click **Activate test link** (or it may already be active on live mode)
3. Configure what customers can do:
   - ✅ Cancel subscriptions
   - ✅ Update payment methods
   - ✅ View invoice history
4. Set the **Default return URL** to: `https://aacgplatform.com/admin/index.html`
5. Click **Save**

---

## Step 8 — Verify Domain in Resend

1. Go to **[https://resend.com/domains](https://resend.com/domains)**
2. Add `aacgplatform.com` as a sending domain
3. Follow the DNS verification steps (add the TXT and DKIM records to your domain registrar)
4. Once verified, emails from `noreply@aacgplatform.com` will deliver reliably

> Until the domain is verified, Resend will still send emails but they may land in spam.

---

## Step 9 — Test Everything

### Test Stripe Checkout
1. Log into your admin panel at `https://aacgplatform.com/admin/index.html`
2. Click **Upgrade** in any feature that prompts it
3. Select the **Professional** plan
4. You should be redirected to a real Stripe Checkout page
5. Complete payment with a test card: `4242 4242 4242 4242` (any future date, any CVC)
6. You should be redirected back to the admin panel with `?upgrade=success&plan=pro`
7. Your plan should update to **Professional** and a confirmation email + SMS should arrive

### Test SMS
Invoke the function directly via Supabase CLI:
```bash
supabase functions invoke send-sms --body '{"to":"YOUR_PHONE","message":"IronForge test SMS"}'
```

### Test Email
```bash
supabase functions invoke send-email --body '{"to":"YOUR_EMAIL","type":"welcome","templateData":{"name":"Test User","plan":"pro"}}'
```

### Test Stripe Portal
In the admin panel Billing section, click **Update Billing** — you should be redirected to the Stripe Customer Portal.

---

## Edge Function URLs (after deployment)

| Function | URL |
|---|---|
| stripe-webhook | `https://wausefmzaqtlomyhqcjf.supabase.co/functions/v1/stripe-webhook` |
| create-checkout | `https://wausefmzaqtlomyhqcjf.supabase.co/functions/v1/create-checkout` |
| create-portal-session | `https://wausefmzaqtlomyhqcjf.supabase.co/functions/v1/create-portal-session` |
| send-sms | `https://wausefmzaqtlomyhqcjf.supabase.co/functions/v1/send-sms` |
| send-email | `https://wausefmzaqtlomyhqcjf.supabase.co/functions/v1/send-email` |

---

## Troubleshooting

**Checkout redirects to error page instead of Stripe**
- Verify `STRIPE_PRICE_PRO` is set in Supabase Secrets and starts with `price_` (not the placeholder `price_pro_monthly`)

**Webhook not updating the user's plan**
- Check Supabase → Edge Function Logs for `stripe-webhook`
- Verify the `STRIPE_WEBHOOK_SECRET` matches the Stripe dashboard webhook signing secret exactly
- Confirm the profiles table has the `stripe_customer_id` column (run the migration SQL)

**SMS not sending**
- Check Twilio console for error logs: [https://console.twilio.com/](https://console.twilio.com/)
- Verify the phone number is verified in Twilio (trial accounts require verified numbers)
- Check `send-sms` function logs in Supabase

**Email going to spam**
- Complete domain verification in Resend (Step 8)
- Check Resend dashboard for delivery status

**"No Stripe customer found" error on Portal**
- The user hasn't completed a checkout yet — `stripe_customer_id` is set by the webhook after first successful payment
- Direct them to upgrade first

---

## What Happens Automatically (The Full Flow)

1. **User signs up** → Supabase Auth creates account → trigger creates profile row → welcome email + SMS sent
2. **User clicks Upgrade** → `create-checkout` Edge Function creates Stripe session → user redirects to Stripe
3. **User pays** → Stripe fires `checkout.session.completed` webhook → `stripe-webhook` updates profile: `plan='pro'`, `stripe_customer_id='cus_xxx'`, `status='active'` → upgrade confirmation email + SMS sent
4. **Lien deadline approaches** → admin saves lien → SMS + email sent immediately with deadline count
5. **Agent completes** → SMS + email sent with truncated result summary
6. **User manages billing** → `create-portal-session` creates Stripe portal URL → user redirects to Stripe self-service portal
7. **User cancels subscription** → Stripe fires `customer.subscription.deleted` → webhook downgrades profile to `plan='starter'`
