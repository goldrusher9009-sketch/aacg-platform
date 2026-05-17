@echo off
cd /d C:\Users\teste\Downloads\AACG-Platform
git add admin/app.js
git commit -m "Fix agent routing: all 20 agents now write results to correct portal tables"
git push origin main
echo Done.
pause
