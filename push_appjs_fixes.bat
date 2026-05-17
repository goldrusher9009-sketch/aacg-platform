@echo off
cd /d C:\Users\teste\Downloads\AACG-Platform
git add admin/app.js
git commit -m "Fix admin app.js: correct liens column (project->job_name), fix invoice agent insert, fix sub agent sub_user_id->sub_id, fix lien_filings->liens table, fix saveLien job_name"
git push origin main
echo Done.
pause
