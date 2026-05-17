@echo off
cd /d C:\Users\teste\Downloads\AACG-Platform
git add config.js admin/app.js
git commit -m "Fix agents: pre-seed OR key from config.js, fix model name, fix HTTP-Referer URL"
git push origin main
