@echo off
cd /d "C:\Users\teste\Downloads\AACG-Platform"
del /f .git\index.lock 2>nul
del /f .git\HEAD.lock 2>nul
git add admin/app.js
git commit -m "Remove last two Claude AI references from admin/app.js — all replaced with AACG AI"
git push origin main
echo.
echo Done! Railway deploying (~2 min).
pause
