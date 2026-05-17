@echo off
cd /d C:\Users\teste\Downloads\AACG-Platform
git add admin/app.js
git commit -m "Fix admin app.js: payment_negotiations insert uses notes instead of sub_note"
git push origin main
echo Done.
pause
