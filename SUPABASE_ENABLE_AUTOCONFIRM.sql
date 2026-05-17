-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- This disables email confirmation requirement so users can
-- sign in immediately after signup without clicking email link
-- ============================================================

-- Option 1: Update auth config (Supabase internal table)
-- This may not work on all plans — use Dashboard setting instead

-- PREFERRED: Go to Supabase Dashboard →
--   Authentication → Settings → Email Auth
--   Turn ON: "Confirm email" → set to DISABLED (toggle off)
--   Or turn ON: "Enable email confirmations" → UNCHECK it

-- Option 2: Auto-confirm all currently unconfirmed users
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL
  AND deleted_at IS NULL;

-- Check how many users are unconfirmed
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed
FROM auth.users
WHERE deleted_at IS NULL;
