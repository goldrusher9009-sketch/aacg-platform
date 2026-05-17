@echo off
cd /d C:\Users\teste\Downloads\AACG-Platform
git add sub/index.html
git commit -m "Fix sub portal jobs tab: remove invalid PostgREST join, query payment_negotiations directly"
git push origin main
echo Done.
pause
