@echo off
cd /d "C:\Users\teste\Downloads\AACG-Platform"
echo.
echo ============================================
echo   AACG Platform - Push Version Badge v1.1.0
echo ============================================
echo.

REM Clear stale git locks
del /f .git\index.lock 2>nul
del /f .git\HEAD.lock 2>nul

REM Stage the two files with local changes
git add admin/app.js
git add package.json
git add VERSION

echo Files staged:
git diff --cached --name-only
echo.

git commit -m "v1.1.0 - Add version badge to admin sidebar, bump package.json to 1.1.0"

echo.
echo Pushing to GitHub...
git push origin main

if %ERRORLEVEL% EQU 0 (
  echo.
  echo ============================================
  echo   SUCCESS! Version badge pushed to GitHub
  echo ============================================
  echo.
  echo Railway auto-deploying now.
  echo Live in ~2 min: https://allamericancg.com/platform
  echo.
)

pause
