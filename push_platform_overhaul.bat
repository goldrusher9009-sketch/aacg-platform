@echo off
cd /d "C:\Users\teste\Downloads\AACG-Platform"
echo.
echo ============================================
echo   AACG Platform - Push Platform Overhaul
echo ============================================
echo.

del /f .git\index.lock 2>nul
del /f .git\HEAD.lock 2>nul

git add server.js
git add aacg-website.html
git add admin/app.js
git add gc/index.html
git add owner/index.html

echo Files staged:
git diff --cached --name-only
echo.

git commit -m "Platform overhaul: fix sub portal route, remove exposed keys, branding, SEO, signup validation, video, footer version"

echo.
echo Pushing to GitHub...
git push origin main

if %ERRORLEVEL% EQU 0 (
  echo.
  echo ============================================
  echo   SUCCESS! Overhaul pushed to GitHub
  echo ============================================
  echo.
  echo Railway auto-deploying now (~2 min).
  echo Live: https://allamericancg.com/platform
  echo.
)

pause
