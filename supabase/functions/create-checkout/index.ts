// Supabase Edge Function: create-checkout
// Creates a Stripe Checkout session and returns the URL
// Deploy: supabase functions deploy create-checkout

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL       = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Your real Stripe Price IDs — create these in your Stripe Dashboard:
// Dashboard → Products → Create Product → Add Price
// Live Stripe Price IDs (created via API 2026-05-03)
const PRICE_IDS: Record<string, string> = {
  pro:        Deno.env.get('STRIPE_PRICE_PRO')        || 'price_1TT1iICJZMFTCOYkXHqOyK7l',
  enterprise: Deno.env.get('STRIPE_PRICE_ENTERPRISE') || 'price_1TT1iMCJZMFTCOYkS02Z7ObG',
};

const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://aacgplatform.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { plan, userId, email, successUrl, cancelUrl } = await req.json();

    if (!plan || !userId || !email) {
      return new Response(JSON.stringify({ error: 'Missing plan, userId, or email' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return new Response(JSON.stringify({ error: `Unknown plan: ${plan}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Stripe Checkout Session via REST API
    const params = new URLSearchParams({
      'payment_method_types[]': 'card',
      'mode': 'subscription',
      'customer_email': email,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': successUrl || `${APP_URL}/admin/index.html?upgrade=success&plan=${plan}`,
      'cancel_url': cancelUrl || `${APP_URL}/admin/index.html?upgrade=cancelled`,
      'metadata[user_id]': userId,
      'metadata[plan]': plan,
      'allow_promotion_codes': 'true',
      'billing_address_collection': 'auto',
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (session.error) {
      console.error('Stripe error:', session.error);
      return new Response(JSON.stringify({ error: session.error.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('create-checkout error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
