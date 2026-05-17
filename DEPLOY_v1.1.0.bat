@echo off
cd /d "C:\Users\teste\Downloads\AACG-Platform"
echo.
echo ============================================
echo   AACG Platform v1.1.0 - One-Click Deploy
echo ============================================
echo.

REM Clear stale git locks
del /f .git\index.lock 2>nul
del /f .git\HEAD.lock 2>nul

REM Stage all portal fix files + version bump
git add admin\app.js
git add admin\index.html
git add gc\index.html
git add owner\index.html
git add sub\index.html
git add package.json
git add VERSION
git add aacg-website.html
git add DEPLOY_v1.1.0.bat
git add DEPLOY_v1.1.0.ps1
git add push_portal_fixes.bat

echo.
echo Files staged for v1.1.0:
git diff --cached --name-only
echo.

REM Commit (may say "nothing to commit" if already committed - that's fine)
git commit -m "v1.1.0 - Fix all portals: wire modal functions, password reset, complete JS, version bump" 2>nul

echo.
echo Pushing to GitHub (triggers Railway auto-deploy)...
echo.
git push origin main

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo *** Push failed. Setting up credentials... ***
  echo.
  echo Enter your GitHub Personal Access Token when prompted.
  echo Get one at: https://github.com/settings/tokens
  echo Select: repo scope only
  echo.
  git config credential.helper store
  git push origin main
)

if %ERRORLEVEL% EQU 0 (
  echo.
  echo ============================================
  echo   SUCCESS! v1.1.0 pushed to GitHub
  echo ============================================
  echo.
  echo Railway is auto-deploying now.
  echo Live in ~2 min: https://allamericancg.com/platform
  echo Railway dashboard: https://railway.app
  echo.
)

pause
