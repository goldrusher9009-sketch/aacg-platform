/**
 * ============================================================
 *  IRONFORGE — AACG PLATFORM  |  Supabase Configuration
 * ============================================================
 *  1. Go to https://supabase.com and create a free project
 *  2. In your Supabase dashboard → Settings → API
 *  3. Copy your Project URL and anon/public key below
 *  4. Run the SQL in supabase-schema.sql in the SQL Editor
 * ============================================================
 */

const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';       // e.g. https://xyzabc.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';     // eyJhbGciOiJIUzI1NiIsInR5cCI6...

// ── Supabase client (loaded via CDN in each HTML page) ────────────────────────
function getSupabaseClient() {
  if (typeof supabase === 'undefined') {
    console.error('[AACG] Supabase CDN not loaded. Add the script tag to your page.');
    return null;
  }
  return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ── Auth helpers ──────────────────────────────────────────────────────────────
const AACG = {
  sb: null,

  init() {
    this.sb = getSupabaseClient();
    return this;
  },

  // Sign up a new subscriber
  async signUp({ name, email, phone, company, plan, trade }) {
    const { data, error } = await this.sb.auth.signUp({
      email,
      password: Math.random().toString(36).slice(-10) + 'Aa1!', // temp pw — user sets via email
      options: {
        data: { name, phone, company, plan, trade, role: 'subscriber' }
      }
    });
    if (error) throw error;

    // Insert profile row
    if (data.user) {
      await this.sb.from('profiles').upsert({
        id: data.user.id,
        email,
        name,
        phone,
        company,
        plan,
        trade,
        role: 'subscriber',
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 86400000).toISOString(),
        status: 'trial'
      });
    }
    return data;
  },

  // Sign in existing user
  async signIn(email, password) {
    const { data, error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // Get current session + profile
  async getSession() {
    const { data: { session } } = await this.sb.auth.getSession();
    if (!session) return null;
    const { data: profile } = await this.sb.from('profiles').select('*').eq('id', session.user.id).single();
    return { session, profile };
  },

  // Sign out
  async signOut() {
    await this.sb.auth.signOut();
    window.location.href = '../aacg-website.html';
  },

  // Get all subscribers (superadmin only)
  async getAllUsers() {
    const { data, error } = await this.sb.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get agent run logs for a user
  async getAgentLogs(userId) {
    const { data, error } = await this.sb.from('agent_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },

  // Log an agent run
  async logAgentRun({ userId, agentName, action, result, jobId }) {
    await this.sb.from('agent_logs').insert({
      user_id: userId,
      agent_name: agentName,
      action,
      result,
      job_id: jobId,
      created_at: new Date().toISOString()
    });
  },

  // Get jobs for a user
  async getJobs(userId) {
    const { data, error } = await this.sb.from('jobs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Add a job
  async addJob({ userId, name, address, gcName, contractAmount, startDate }) {
    const { data, error } = await this.sb.from('jobs').insert({
      user_id: userId, name, address, gc_name: gcName,
      contract_amount: contractAmount, start_date: startDate,
      status: 'active', created_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  },

  // Get invoices
  async getInvoices(userId) {
    const { data, error } = await this.sb.from('invoices').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Update user plan (superadmin)
  async updateUserPlan(userId, plan) {
    await this.sb.from('profiles').update({ plan }).eq('id', userId);
  },

  // Suspend user (superadmin)
  async suspendUser(userId) {
    await this.sb.from('profiles').update({ status: 'suspended' }).eq('id', userId);
  },
};

// Export for use in other files
if (typeof module !== 'undefined') module.exports = AACG;
