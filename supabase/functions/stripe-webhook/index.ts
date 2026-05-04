// Supabase Edge Function: stripe-webhook
// Handles Stripe checkout.session.completed → updates profiles.plan
// Deploy: supabase functions deploy stripe-webhook

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || 'YOUR_STRIPE_WEBHOOK_SECRET';
const SUPABASE_URL           = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('No signature', { status: 400 });

  const body = await req.text();

  // Verify Stripe signature
  let event: any;
  try {
    // Simple HMAC verification without the Stripe SDK
    const encoder = new TextEncoder();
    const parts = signature.split(',');
    const timestamp = parts.find((p: string) => p.startsWith('t='))?.split('=')[1];
    const sigHex   = parts.find((p: string) => p.startsWith('v1='))?.split('=')[1];

    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(STRIPE_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signedPayload = encoder.encode(`${timestamp}.${body}`);
    const sig = await crypto.subtle.sign('HMAC', key, signedPayload);
    const computed = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    if (computed !== sigHex) {
      console.error('Stripe signature mismatch');
      return new Response('Invalid signature', { status: 400 });
    }
    event = JSON.parse(body);
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Webhook error', { status: 400 });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Handle checkout completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_email || session.customer_details?.email;
    const priceId = session.line_items?.data?.[0]?.price?.id || session.metadata?.price_id;

    // Map price ID to plan name
    const PRICE_TO_PLAN: Record<string, string> = {
      'price_pro_monthly':        'pro',
      'price_enterprise_custom':  'enterprise',
    };

    // Try to get plan from metadata first (more reliable)
    const plan = session.metadata?.plan || PRICE_TO_PLAN[priceId] || 'pro';
    const userId = session.metadata?.user_id;
    const stripeCustomerId = session.customer;

    console.log(`Checkout complete: email=${customerEmail}, plan=${plan}, userId=${userId}`);

    if (userId) {
      const { error } = await sb.from('profiles').update({
        plan,
        stripe_customer_id: stripeCustomerId,
        status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('id', userId);

      if (error) console.error('Profile update error:', error);
    } else if (customerEmail) {
      const { error } = await sb.from('profiles').update({
        plan,
        stripe_customer_id: stripeCustomerId,
        status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('email', customerEmail);

      if (error) console.error('Profile update by email error:', error);
    }
  }

  // Handle subscription cancellation
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const stripeCustomerId = sub.customer;

    const { error } = await sb.from('profiles')
      .update({ plan: 'starter', status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('stripe_customer_id', stripeCustomerId);

    if (error) console.error('Subscription cancel error:', error);
    else console.log(`Subscription cancelled for customer: ${stripeCustomerId}`);
  }

  // Handle payment failure
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    const stripeCustomerId = invoice.customer;
    console.log(`Payment failed for customer: ${stripeCustomerId}`);
    // Could downgrade plan here or send warning email
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
