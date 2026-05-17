@echo off
cd /d "C:\Users\teste\Downloads\AACG-Platform"
git add admin/app.js
git commit -m "CRITICAL FIX: broken nested backtick in template literal crashed entire app.js"
git push origin main
echo DONE
