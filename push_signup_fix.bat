@echo off
cd /d C:\Users\teste\Downloads\AACG-Platform
git add admin/index.html
git commit -m "Fix admin signup: inline form toggle instead of homepage redirect"
git push origin main
echo Done.
pause
