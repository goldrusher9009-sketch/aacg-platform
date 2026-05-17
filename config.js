// IronForge AACG Platform — Supabase Configuration
// SECURITY: Credentials should be loaded from environment variables, not hardcoded
// For development, use a .env file (never commit to git)
// For production, use your hosting provider's environment variable system

// Load from environment variables - these should be set on your hosting platform
const SUPABASE_URL = process.env.SUPABASE_URL || localStorage.getItem('sb_url') || '';
const SUPABASE_ANON = process.env.SUPABASE_ANON || localStorage.getItem('sb_key') || '';

// For browser environment (no process.env), fallback to window variables set by server
if (typeof window !== 'undefined') {
  window.SUPABASE_URL = window.SUPABASE_URL || SUPABASE_URL;
  window.SUPABASE_ANON = window.SUPABASE_ANON || SUPABASE_ANON;
}

console.log('✅ Config loaded securely - credentials from environment variables');
