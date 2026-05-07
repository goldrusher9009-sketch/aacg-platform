// Supabase Edge Function: receive-whatsapp
// Receives inbound WhatsApp messages (with photos) from Twilio webhook
// Configure in Twilio Console: WhatsApp Sandbox → "When a message comes in" → this URL
// URL: https://<project>.supabase.co/functions/v1/receive-whatsapp
// Deploy: supabase functions deploy receive-whatsapp

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY   = Deno.env.get('ANTHROPIC_API_KEY')!;
const TWILIO_AUTH_TOKEN   = Deno.env.get('TWILIO_AUTH_TOKEN')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Fetch project drawings for a job ────────────────────────────────────────
async function getJobDrawings(
  supabase: ReturnType<typeof createClient>,
  jobId: string | null
): Promise<Array<{ drawing_type: string; title: string; file_url: string; description: string }>> {
  if (!jobId) return [];
  const { data } = await supabase
    .from('project_drawings')
    .select('drawing_type, title, file_url, description')
    .eq('job_id', jobId)
    .eq('is_current', true)
    .order('drawing_type');
  return data || [];
}

// ── Claude Vision Analysis ──────────────────────────────────────────────────
async function analyzePhotoWithClaude(
  imageUrl: string,
  jobContext: string = '',
  drawings: Array<{ drawing_type: string; title: string; file_url: string; description: string }> = []
): Promise<{
  analysis: string;
  progress_pct: number;
  suggested_amount: number;
  severity: string;
}> {
  const drawingsContext = drawings.length > 0
    ? `\n\nProject drawings on file:\n${drawings.map(d => `- ${d.drawing_type.toUpperCase()}: ${d.title}${d.description ? ` — ${d.description}` : ''}`).join('\n')}\n\nCompare the photo against the project scope defined in these drawings when estimating completion percentage.`
    : '';

  const prompt = `You are a construction site AI inspector. Analyze this job site photo and provide:

1. A detailed description of what work has been completed
2. Safety hazards or concerns (if any)
3. Work quality assessment
4. Estimated completion percentage (0-100) for the visible scope of work
5. Suggested payment amount as a percentage of total contract (should match completion %)

${jobContext ? `Job context: ${jobContext}` : ''}${drawingsContext}

Respond in this exact JSON format:
{
  "summary": "Brief 2-3 sentence description of work shown",
  "completed_items": ["item1", "item2"],
  "safety_issues": ["issue1"] or [],
  "quality_notes": "assessment",
  "progress_pct": 65,
  "severity": "ok" | "warning" | "critical",
  "suggested_payment_pct": 65,
  "analysis_full": "Full detailed analysis paragraph"
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          { type: 'text', text: prompt }
        ]
      }]
    })
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || '{}';

  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    return {
      analysis: parsed.analysis_full || parsed.summary || text,
      progress_pct: parsed.progress_pct || 0,
      suggested_amount: parsed.suggested_payment_pct || 0,  // stored as % — multiply by contract later
      severity: parsed.severity || 'ok',
    };
  } catch {
    return { analysis: text, progress_pct: 0, suggested_amount: 0, severity: 'ok' };
  }
}

// ── Upload media to Supabase Storage ────────────────────────────────────────
async function uploadMediaToStorage(
  supabase: ReturnType<typeof createClient>,
  mediaUrl: string,
  filename: string
): Promise<string | null> {
  try {
    const response = await fetch(mediaUrl);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const { data, error } = await supabase.storage
      .from('photo-submissions')
      .upload(`whatsapp/${Date.now()}_${filename}`, uint8Array, {
        contentType: blob.type || 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return mediaUrl; // Fall back to original URL
    }

    const { data: { publicUrl } } = supabase.storage
      .from('photo-submissions')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (err) {
    console.error('Upload failed:', err);
    return mediaUrl;
  }
}

// ── Find sub-contractor by phone number ─────────────────────────────────────
async function findSubByPhone(
  supabase: ReturnType<typeof createClient>,
  phone: string
): Promise<{ id: string; name: string } | null> {
  const cleanPhone = phone.replace(/\D/g, '').replace(/^1/, '');
  const { data } = await supabase
    .from('profiles')
    .select('id, name, phone')
    .or(`phone.ilike.%${cleanPhone}%`)
    .limit(1)
    .single();
  return data || null;
}

// ── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const body = await req.text();
    const params = new URLSearchParams(body);

    const from        = params.get('From') || '';          // whatsapp:+1xxxxxxxxxx
    const numMedia    = parseInt(params.get('NumMedia') || '0');
    const messageBody = params.get('Body') || '';
    const cleanFrom   = from.replace('whatsapp:', '');

    console.log(`Received WhatsApp from ${cleanFrom}, numMedia=${numMedia}, body="${messageBody}"`);

    // If no media, send back instructions
    if (numMedia === 0) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Hi! Send a photo of your job site and I'll analyze it for you. Include your job name in the message if you like.</Message>
</Response>`;
      return new Response(twiml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' }
      });
    }

    // Find which sub-contractor this phone belongs to
    const sub = await findSubByPhone(supabase, cleanFrom);

    // Try to match a job by name from message body
    let jobId: string | null = null;
    if (messageBody && sub) {
      const { data: jobMatch } = await supabase
        .from('jobs')
        .select('id')
        .eq('user_id', sub.id)
        .ilike('name', `%${messageBody.split(' ').slice(0, 3).join(' ')}%`)
        .limit(1)
        .single();
      jobId = jobMatch?.id || null;
    }

    // Fetch project drawings for context
    const drawings = await getJobDrawings(supabase, jobId);

    // Process each media item
    const results = [];
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl      = params.get(`MediaUrl${i}`) || '';
      const mediaType     = params.get(`MediaContentType${i}`) || 'image/jpeg';

      if (!mediaType.startsWith('image/')) {
        console.log(`Skipping non-image media: ${mediaType}`);
        continue;
      }

      // Upload to Supabase Storage
      const storedUrl = await uploadMediaToStorage(supabase, mediaUrl, `photo_${i}.jpg`);

      // Analyze with Claude Vision (with drawings context)
      const { analysis, progress_pct, suggested_amount, severity } =
        await analyzePhotoWithClaude(storedUrl || mediaUrl, messageBody, drawings);

      // Save to photo_submissions
      const { data: submission, error: insertErr } = await supabase
        .from('photo_submissions')
        .insert({
          user_id:        sub?.id || null,
          job_id:         jobId,
          job_name:       messageBody || 'Unknown Job',
          photo_url:      storedUrl || mediaUrl,
          source:         'whatsapp',
          source_from:    cleanFrom,
          ai_analysis:    analysis,
          ai_progress_pct: progress_pct,
          ai_amount:      suggested_amount,
          severity,
          status:         'analyzed',
        })
        .select()
        .single();

      if (insertErr) {
        console.error('Insert error:', insertErr);
      } else {
        results.push(submission);
        console.log(`Saved photo_submission id=${submission.id}`);
      }
    }

    // Send TwiML reply with analysis summary
    const firstResult = results[0];
    const replyMessage = firstResult
      ? `✅ Photo received and analyzed!\n\n📊 Progress: ${firstResult.ai_progress_pct}% complete\n⚠️ Severity: ${firstResult.severity.toUpperCase()}\n💰 Suggested payment: ${firstResult.ai_amount}% of contract\n\nView full analysis in your dashboard and submit to GC when ready.`
      : `✅ Photo received! Analysis in progress — check your dashboard shortly.`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${replyMessage}</Message>
</Response>`;

    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' }
    });

  } catch (err) {
    console.error('receive-whatsapp error:', err);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Sorry, there was an error processing your photo. Please try again or contact support.</Message>
</Response>`;
    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      status: 200  // Twilio requires 200 even for errors
    });
  }
});
