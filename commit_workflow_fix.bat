@echo off
cd /d "C:\Users\teste\Downloads\AACG-Platform"
git add admin/app.js
git commit -m "Fix workflow runner: add callLLMApi helper, fix apiKey source, fix w.title ref"
git push origin main
echo DONE
