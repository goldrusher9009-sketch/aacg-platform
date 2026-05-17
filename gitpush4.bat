@echo off
cd /d C:\Users\teste\Downloads\AACG-Platform
git add config.js admin/app.js
git commit --amend --no-edit
git push origin main --force
