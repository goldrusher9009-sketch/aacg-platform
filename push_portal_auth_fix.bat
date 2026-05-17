@echo off
cd /d "C:\Users\teste\Downloads\AACG-Platform"
del /f .git\index.lock 2>nul
del /f .git\HEAD.lock 2>nul

echo.
echo ============================================
echo   AACG Platform - Push Portal Auth Fix
echo ============================================
echo.
echo Fixes applied:
echo  - sub/index.html: added DOMContentLoaded startup, fixed sbClient-^>sb
echo  - gc/index.html:  added DOMContentLoaded startup, session restore
echo  - owner/index.html: completed truncated file, added startup init
echo  - admin/app.js:  final AACG AI branding cleanup
echo.

git add sub/index.html
git add gc/index.html
git add owner/index.html
git add admin/app.js

echo Files staged:
git diff --cached --name-only
echo.

git commit -m "Fix portal auth: add DOMContentLoaded session restore to sub/gc/owner portals, fix sbClient bug, complete truncated owner portal, final branding"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ============================================
echo   SUCCESS! Railway deploying now (~2 min)
echo   Live: https://allamericancg.com/platform
echo ============================================
echo.
pause
