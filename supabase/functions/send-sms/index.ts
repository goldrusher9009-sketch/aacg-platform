// Supabase Edge Function: send-sms
// Sends SMS via Twilio REST API
// Deploy: supabase functions deploy send-sms
// Call from admin JS: sbClient.functions.invoke('send-sms', { body: { to, message, type } })

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN  = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_FROM        = Deno.env.get('TWILIO_PHONE_NUMBER') || '+18566363987';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, message, type } = await req.json();

    if (!to || !message) {
      return new Response(JSON.stringify({ error: 'Missing to or message' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean phone number
    const toClean = to.replace(/\D/g, '');
    const toFormatted = toClean.startsWith('1') ? `+${toClean}` : `+1${toClean}`;

    console.log(`Sending ${type || 'sms'} to ${toFormatted}: ${message.substring(0, 50)}...`);

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const params = new URLSearchParams({
      From: TWILIO_FROM,
      To: toFormatted,
      Body: message,
    });

    const res = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const result = await res.json();

    if (result.status === 'queued' || result.status === 'sent' || result.sid) {
      console.log(`SMS sent successfully: SID=${result.sid}`);
      return new Response(JSON.stringify({ success: true, sid: result.sid, status: result.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.error('Twilio error:', result);
      return new Response(JSON.stringify({ error: result.message || 'SMS failed', code: result.code }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (err) {
    console.error('send-sms error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
