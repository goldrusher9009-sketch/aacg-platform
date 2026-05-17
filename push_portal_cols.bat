@echo off
cd /d C:\Users\teste\Downloads\AACG-Platform
git add sub/index.html gc/index.html owner/index.html
git commit -m "Fix portal column alignment: sub/gc/owner portals use correct payment_negotiations and invoices column names"
git push origin main
echo Done.
pause
