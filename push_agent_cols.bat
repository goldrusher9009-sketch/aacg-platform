@echo off
cd /d C:\Users\teste\Downloads\AACG-Platform
git add admin/app.js
git commit -m "Fix agent routing: align all inserts to actual Supabase column names"
git push origin main
echo Done.
pause
