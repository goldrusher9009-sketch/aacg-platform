@echo off
cd /d "C:\Users\teste\Downloads\AACG-Platform"
del /f .git\index.lock 2>nul
del /f .git\HEAD.lock 2>nul

echo.
echo ============================================
echo   AACG Platform - Push Email Confirm Fix
echo ============================================
echo.
echo Fixes applied:
echo  - aacg-website.html: show "check email" message after signup
echo  - aacg-website.html: Resend confirmation email button
echo  - aacg-website.html: emailRedirectTo routes to correct portal
echo  - aacg-website.html: openSignIn() routes to correct portal
echo.

git add aacg-website.html

echo Files staged:
git diff --cached --name-only
echo.

git commit -m "Fix email confirmation flow: show check-email message, resend button, route emailRedirectTo by account type"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ============================================
echo   SUCCESS! Railway deploying (~2 min)
echo.
echo   ALSO DO THIS in Supabase Dashboard:
echo   1. Go to: https://supabase.com/dashboard/project/wausefmzaqtlomyhqcjf
echo   2. Click: Authentication ^> Settings ^> Email Auth
echo   3. UNCHECK: "Enable email confirmations"
echo   4. Click Save
echo   (This lets users log in immediately without email click)
echo.
echo   OR run SUPABASE_ENABLE_AUTOCONFIRM.sql in the SQL Editor
echo   to confirm all existing unconfirmed users.
echo ============================================
echo.
pause
