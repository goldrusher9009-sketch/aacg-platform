@echo off
cd /d C:\Users\teste\Downloads\AACG-Platform
git add sub/index.html
git commit -m "Fix sub portal: replace nonexistent work_orders table with jobs via payment_negotiations join, fix all column name mismatches"
git push origin main
echo Done.
pause
