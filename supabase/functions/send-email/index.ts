// Supabase Edge Function: send-email
// Sends transactional emails via Resend API
// Deploy: supabase functions deploy send-email
// Call from admin JS: sbClient.functions.invoke('send-email', { body: { to, subject, html, type } })

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL     = 'IronForge <onboarding@resend.dev>'; // Switch to noreply@aacgplatform.com once DNS verified at resend.com/domains

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email templates
function welcomeEmail(name: string, plan: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0f1e;color:#f9fafb;padding:40px;border-radius:12px">
      <div style="font-size:24px;font-weight:800;color:#c9a84c;letter-spacing:2px;margin-bottom:4px">⚡ IRONFORGE</div>
      <div style="color:#6b7280;font-size:13px;margin-bottom:32px">AACG Construction AI Platform</div>
      <h1 style="font-size:28px;margin-bottom:16px">Welcome, ${name}! 🎉</h1>
      <p style="color:#d1d5db;line-height:1.7;margin-bottom:24px">
        Your <strong style="color:#c9a84c">${plan.charAt(0).toUpperCase() + plan.slice(1)}</strong> account is active.
        You now have access to AI agents purpose-built for construction contractors.
      </p>
      <div style="background:#1f2937;border-radius:10px;padding:20px;margin-bottom:24px">
        <div style="font-weight:700;margin-bottom:12px;color:#c9a84c">Your first 3 steps:</div>
        <div style="padding:8px 0;border-bottom:1px solid #374151;color:#d1d5db">1. 🏗️ Add your first project in the Projects panel</div>
        <div style="padding:8px 0;border-bottom:1px solid #374151;color:#d1d5db">2. ⚡ Run a free AI agent — no API key needed</div>
        <div style="padding:8px 0;color:#d1d5db">3. ⚖️ Set up lien tracking for active jobs</div>
      </div>
      <a href="https://aacgplatform.com/admin/index.html"
         style="display:block;background:#ef4444;color:#fff;text-decoration:none;text-align:center;padding:16px;border-radius:8px;font-weight:700;font-size:16px;margin-bottom:24px">
        Open Your Dashboard →
      </a>
      <p style="color:#6b7280;font-size:12px">
        Questions? Reply to this email or text us at (856) 636-3987.<br>
        AACG Platform · IronForge AI for Construction
      </p>
    </div>`;
}

function lienAlertEmail(name: string, jobName: string, daysLeft: number, amount: string): string {
  const urgency = daysLeft <= 7 ? '#ef4444' : daysLeft <= 14 ? '#f59e0b' : '#c9a84c';
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0f1e;color:#f9fafb;padding:40px;border-radius:12px">
      <div style="font-size:24px;font-weight:800;color:#c9a84c;letter-spacing:2px;margin-bottom:4px">⚡ IRONFORGE</div>
      <div style="background:${urgency}22;border:1px solid ${urgency};border-radius:8px;padding:16px;margin:24px 0">
        <div style="font-size:20px;font-weight:700;color:${urgency}">⚖️ Lien Deadline Alert</div>
        <div style="font-size:32px;font-weight:800;margin:8px 0;color:${urgency}">${daysLeft} DAYS LEFT</div>
        <div style="color:#d1d5db">Job: <strong>${jobName}</strong> · Amount: <strong style="color:#c9a84c">${amount}</strong></div>
      </div>
      <p style="color:#d1d5db;line-height:1.7;margin-bottom:24px">
        Hi ${name}, your mechanics lien deadline for <strong>${jobName}</strong> is in <strong style="color:${urgency}">${daysLeft} days</strong>.
        ${daysLeft <= 7 ? '⚠️ <strong>Immediate action required.</strong> Missing this deadline forfeits your lien rights.' : 'Take action now to protect your payment rights.'}
      </p>
      <a href="https://aacgplatform.com/admin/index.html"
         style="display:block;background:${urgency};color:#fff;text-decoration:none;text-align:center;padding:16px;border-radius:8px;font-weight:700;font-size:16px;margin-bottom:24px">
        Manage Lien Now →
      </a>
      <p style="color:#6b7280;font-size:12px">
        IronForge lien tracking · Reply or text (856) 636-3987 for help
      </p>
    </div>`;
}

function agentCompleteEmail(name: string, agentName: string, result: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0f1e;color:#f9fafb;padding:40px;border-radius:12px">
      <div style="font-size:24px;font-weight:800;color:#c9a84c;letter-spacing:2px;margin-bottom:4px">⚡ IRONFORGE</div>
      <div style="background:#10b98122;border:1px solid #10b981;border-radius:8px;padding:16px;margin:24px 0">
        <div style="font-size:16px;font-weight:700;color:#10b981">🤖 Agent Complete: ${agentName}</div>
      </div>
      <p style="color:#d1d5db;line-height:1.7;margin-bottom:24px">
        Hi ${name}, your AI agent <strong>${agentName}</strong> has finished its analysis.
      </p>
      <div style="background:#1f2937;border-radius:8px;padding:16px;margin-bottom:24px;font-size:13px;color:#d1d5db;line-height:1.6;font-family:monospace">
        ${result.substring(0, 500)}${result.length > 500 ? '...' : ''}
      </div>
      <a href="https://aacgplatform.com/admin/index.html"
         style="display:block;background:#2a7de1;color:#fff;text-decoration:none;text-align:center;padding:16px;border-radius:8px;font-weight:700;font-size:16px;margin-bottom:24px">
        View Full Results →
      </a>
    </div>`;
}

function upgradeConfirmEmail(name: string, plan: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0f1e;color:#f9fafb;padding:40px;border-radius:12px">
      <div style="font-size:24px;font-weight:800;color:#c9a84c;letter-spacing:2px;margin-bottom:4px">⚡ IRONFORGE</div>
      <div style="background:#10b98122;border:1px solid #10b981;border-radius:8px;padding:16px;margin:24px 0">
        <div style="font-size:18px;font-weight:700;color:#10b981">✅ Upgrade Confirmed!</div>
        <div style="color:#d1d5db;margin-top:8px">You're now on <strong style="color:#c9a84c">${plan.charAt(0).toUpperCase()+plan.slice(1)}</strong></div>
      </div>
      <p style="color:#d1d5db;line-height:1.7;margin-bottom:24px">
        Hi ${name}, your upgrade to <strong>${plan}</strong> is active immediately.
        All premium features, agents, and workflows are now unlocked.
      </p>
      <a href="https://aacgplatform.com/admin/index.html"
         style="display:block;background:#c9a84c;color:#000;text-decoration:none;text-align:center;padding:16px;border-radius:8px;font-weight:700;font-size:16px;margin-bottom:24px">
        Access Your Upgraded Dashboard →
      </a>
    </div>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, html, type, templateData } = await req.json();

    let finalHtml = html;
    let finalSubject = subject;

    // Auto-generate from template
    if (type && templateData) {
      switch (type) {
        case 'welcome':
          finalHtml = welcomeEmail(templateData.name, templateData.plan || 'starter');
          finalSubject = finalSubject || `Welcome to IronForge, ${templateData.name}! ⚡`;
          break;
        case 'lien_alert':
          finalHtml = lienAlertEmail(templateData.name, templateData.jobName, templateData.daysLeft, templateData.amount || '$0');
          finalSubject = finalSubject || `⚖️ Lien Deadline: ${templateData.daysLeft} days left — ${templateData.jobName}`;
          break;
        case 'agent_complete':
          finalHtml = agentCompleteEmail(templateData.name, templateData.agentName, templateData.result || '');
          finalSubject = finalSubject || `🤖 ${templateData.agentName} finished — view results`;
          break;
        case 'upgrade_confirm':
          finalHtml = upgradeConfirmEmail(templateData.name, templateData.plan);
          finalSubject = finalSubject || `✅ Upgrade confirmed — you're on ${templateData.plan}!`;
          break;
      }
    }

    if (!to || !finalSubject || !finalHtml) {
      return new Response(JSON.stringify({ error: 'Missing to, subject, or html' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject: finalSubject,
        html: finalHtml,
      }),
    });

    const result = await res.json();

    if (result.id) {
      console.log(`Email sent: id=${result.id}, to=${to}, type=${type}`);
      return new Response(JSON.stringify({ success: true, id: result.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.error('Resend error:', result);
      return new Response(JSON.stringify({ error: result.message || 'Email failed' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (err) {
    console.error('send-email error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
