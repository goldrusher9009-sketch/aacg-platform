// Supabase Edge Function: create-portal-session
// Creates a Stripe Customer Portal session so users can manage billing
// Deploy: supabase functions deploy create-portal-session

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_SECRET_KEY    = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { userId, returnUrl } = await req.json();
    if (!userId) return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400, headers: corsHeaders });

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: profile } = await sb.from('profiles').select('stripe_customer_id, email').eq('id', userId).single();

    if (!profile?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'No Stripe customer found. Upgrade first.' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams({
      customer: profile.stripe_customer_id,
      return_url: returnUrl || 'https://aacgplatform.com/admin/index.html',
    });

    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await res.json();
    if (session.error) throw new Error(session.error.message);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
