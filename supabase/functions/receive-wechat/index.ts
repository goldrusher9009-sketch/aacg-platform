// Supabase Edge Function: receive-wechat
// Receives inbound WeChat Work bot messages (with photos/images)
// Configure in WeChat Work: App → Receiving Messages → set URL to this function
// URL: https://<project>.supabase.co/functions/v1/receive-wechat
// Deploy: supabase functions deploy receive-wechat

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY    = Deno.env.get('ANTHROPIC_API_KEY')!;
const WECHAT_CORP_ID       = Deno.env.get('WECHAT_CORP_ID')    || '';
const WECHAT_AGENT_ID      = Deno.env.get('WECHAT_AGENT_ID')   || '';
const WECHAT_SECRET        = Deno.env.get('WECHAT_SECRET')     || '';
const WECHAT_TOKEN         = Deno.env.get('WECHAT_TOKEN')      || '';  // for webhook verification

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── WeChat token ─────────────────────────────────────────────────────────────
async function getWechatToken(): Promise<string | null> {
  if (!WECHAT_CORP_ID || !WECHAT_SECRET) return null;
  const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${WECHAT_CORP_ID}&corpsecret=${WECHAT_SECRET}`;
  const res  = await fetch(url);
  const data = await res.json();
  return data.access_token || null;
}

// ── Get WeChat media URL ──────────────────────────────────────────────────────
async function getWechatMediaUrl(token: string, mediaId: string): Promise<string | null> {
  const url = `https://qyapi.weixin.qq.com/cgi-bin/media/get?access_token=${token}&media_id=${mediaId}`;
  // WeChat returns a redirect to the actual file — follow it
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) return null;
  // Return the final URL after redirects
  return res.url;
}

// ── Send WeChat reply ────────────────────────────────────────────────────────
async function sendWechatReply(token: string, toUser: string, message: string): Promise<void> {
  const url  = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`;
  const body = {
    touser:  toUser,
    msgtype: 'text',
    agentid: parseInt(WECHAT_AGENT_ID),
    text:    { content: message },
    safe:    0,
  };
  await fetch(url, { method: 'POST', body: JSON.stringify(body) });
}

// ── Fetch project drawings for a job ─────────────────────────────────────────
async function getJobDrawings(
  supabase: ReturnType<typeof createClient>,
  jobId: string | null
): Promise<Array<{ drawing_type: string; title: string; description: string }>> {
  if (!jobId) return [];
  const { data } = await supabase
    .from('project_drawings')
    .select('drawing_type, title, description')
    .eq('job_id', jobId)
    .eq('is_current', true)
    .order('drawing_type');
  return data || [];
}

// ── Claude Vision Analysis ───────────────────────────────────────────────────
async function analyzePhotoWithClaude(
  imageUrl: string,
  jobContext: string = '',
  drawings: Array<{ drawing_type: string; title: string; description: string }> = []
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
  "summary": "Brief 2-3 sentence description",
  "progress_pct": 65,
  "severity": "ok",
  "suggested_payment_pct": 65,
  "analysis_full": "Full detailed analysis"
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
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    return {
      analysis: parsed.analysis_full || parsed.summary || text,
      progress_pct: parsed.progress_pct || 0,
      suggested_amount: parsed.suggested_payment_pct || 0,
      severity: parsed.severity || 'ok',
    };
  } catch {
    return { analysis: text, progress_pct: 0, suggested_amount: 0, severity: 'ok' };
  }
}

// ── Upload media to Supabase Storage ─────────────────────────────────────────
async function uploadMedia(
  supabase: ReturnType<typeof createClient>,
  mediaUrl: string,
  filename: string
): Promise<string> {
  try {
    const res = await fetch(mediaUrl);
    const ab  = await res.arrayBuffer();
    const { data, error } = await supabase.storage
      .from('photo-submissions')
      .upload(`wechat/${Date.now()}_${filename}`, new Uint8Array(ab), {
        contentType: 'image/jpeg',
        upsert: false,
      });
    if (error || !data) return mediaUrl;
    const { data: { publicUrl } } = supabase.storage
      .from('photo-submissions')
      .getPublicUrl(data.path);
    return publicUrl;
  } catch {
    return mediaUrl;
  }
}

// ── Find sub by WeChat UserID ─────────────────────────────────────────────────
async function findSubByWechat(
  supabase: ReturnType<typeof createClient>,
  wechatUserId: string
): Promise<{ id: string; name: string } | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('wechat_userid', wechatUserId)
    .limit(1)
    .single();
  return data || null;
}

// ── Parse WeChat Work XML message ────────────────────────────────────────────
function parseWechatXml(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const tagRegex = /<([A-Za-z]+)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/\1>/g;
  let match;
  while ((match = tagRegex.exec(xml)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // WeChat webhook verification (GET request)
  if (req.method === 'GET') {
    const url    = new URL(req.url);
    const echostr = url.searchParams.get('echostr') || '';
    return new Response(echostr, { headers: { 'Content-Type': 'text/plain' } });
  }

  try {
    const supabase   = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const body       = await req.text();
    const msg        = parseWechatXml(body);

    const fromUser   = msg['FromUserName'] || '';
    const msgType    = msg['MsgType']      || '';
    const mediaId    = msg['MediaId']      || '';
    const content    = msg['Content']      || '';

    console.log(`WeChat message from=${fromUser} type=${msgType}`);

    // Only process image messages
    if (msgType !== 'image') {
      const token = await getWechatToken();
      if (token && fromUser) {
        await sendWechatReply(token, fromUser,
          'Hi! Send a photo of your job site and I\'ll analyze it. Include job name in a text message before sending the photo.');
      }
      return new Response('success', { headers: corsHeaders });
    }

    const token = await getWechatToken();
    if (!token) {
      console.error('Could not get WeChat token');
      return new Response('success', { headers: corsHeaders });
    }

    // Get the actual image URL
    const mediaUrl = await getWechatMediaUrl(token, mediaId);
    if (!mediaUrl) {
      await sendWechatReply(token, fromUser, 'Sorry, could not retrieve your photo. Please try again.');
      return new Response('success', { headers: corsHeaders });
    }

    // Upload to Storage
    const storedUrl = await uploadMedia(supabase, mediaUrl, `photo_${mediaId}.jpg`);

    // Find the sub-contractor
    const sub = await findSubByWechat(supabase, fromUser);

    // Try to match job by content (job name prefix)
    let jobId: string | null = null;
    if (content && sub) {
      const { data: jobMatch } = await supabase
        .from('jobs')
        .select('id')
        .eq('user_id', sub.id)
        .ilike('name', `%${content.split(' ').slice(0, 3).join(' ')}%`)
        .limit(1)
        .single();
      jobId = jobMatch?.id || null;
    }

    // Fetch drawings for AI context
    const drawings = await getJobDrawings(supabase, jobId);

    // Analyze with Claude Vision (with drawings context)
    const { analysis, progress_pct, suggested_amount, severity } =
      await analyzePhotoWithClaude(storedUrl, content, drawings);

    // Save to photo_submissions
    const { data: submission, error: insertErr } = await supabase
      .from('photo_submissions')
      .insert({
        user_id:         sub?.id || null,
        job_id:          jobId,
        job_name:        content || 'Unknown Job',
        photo_url:       storedUrl,
        source:          'wechat',
        source_from:     fromUser,
        ai_analysis:     analysis,
        ai_progress_pct: progress_pct,
        ai_amount:       suggested_amount,
        severity,
        status:          'analyzed',
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Insert error:', insertErr);
      await sendWechatReply(token, fromUser, 'Photo received but analysis failed. Please try again.');
    } else {
      console.log(`Saved photo_submission id=${submission.id}`);
      const reply = `✅ Photo analyzed!\n\n📊 Progress: ${progress_pct}% complete\n⚠️ Severity: ${severity.toUpperCase()}\n💰 Suggested payment: ${suggested_amount}% of contract\n\nOpen your dashboard to view details and submit to GC.`;
      await sendWechatReply(token, fromUser, reply);
    }

    return new Response('success', { headers: corsHeaders });

  } catch (err) {
    console.error('receive-wechat error:', err);
    return new Response('success', { headers: corsHeaders }); // WeChat requires 200
  }
});
