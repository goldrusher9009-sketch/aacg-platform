@echo off
cd /d "C:\Users\teste\Downloads\AACG-Platform"
git add admin/app.js
git commit -m "Fix jobs table column mapping: contract_value->contract_amount, client->gc_name, deadline->start_date, drop sector"
git push origin main
echo DONE
