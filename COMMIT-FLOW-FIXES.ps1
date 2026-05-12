# AACG Platform — Commit Flow Fixes
# Run this from your AACG-Platform repo root
# Right-click → "Run with PowerShell" OR paste into Git Bash / Terminal

git add admin/app.js
git add gc/index.html
git add owner/index.html
git add supabase-schema.sql
git commit -m "fix: complete 3-portal auth + payment flow

- admin/app.js: openSubmitToGCModal now loads gc_profiles and shows GC selector
  dropdown; submitToGC passes selected gc_id into payment_negotiations insert
- gc/index.html: added Sign In / Create Account tabs + gcSignup(); data query
  scoped to gc_id.eq.{user} OR gc_id.is.null; all mutations write gc_id to claim row
- owner/index.html: same pattern — ownerSignup() + data scoped to owner_id;
  all mutations write owner_id to claim row
- supabase-schema.sql: ALTER TABLE jobs adds gc_id + owner_id FK columns;
  adds RLS policies so GC/Owner can read their assigned jobs; adds indexes

Run the new ALTER TABLE statements in Supabase SQL Editor if upgrading existing DB."

git push origin main
Write-Host "✅ Pushed! Railway will auto-deploy in ~60 seconds." -ForegroundColor Green
