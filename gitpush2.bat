@echo off
cd /d C:\Users\teste\Downloads\AACG-Platform
git add admin/app.js
git commit -m "Remove remaining fake data: LOG_LINES const, hardcoded project dropdowns, demo log fallback"
git push origin main
