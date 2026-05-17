@echo off
REM AACG Platform v1.2.0 - Deploy to Railway
REM All fixes complete - ready for production

cd /d C:\Users\teste\Downloads\AACG-Platform

echo.
echo ====================================================================
echo AACG Platform v1.2.0 - Deploying to Railway
echo ====================================================================
echo.

echo [1/3] Adding changes to git...
git add .
if %errorlevel% neq 0 goto error

echo [2/3] Committing changes...
git commit -m "AACG Platform v1.2.0 - Production ready: signup flow, button handlers, all dependencies"
if %errorlevel% neq 0 goto error

echo [3/3] Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 goto error

echo.
echo ====================================================================
echo SUCCESS! Code pushed to GitHub
echo ====================================================================
echo.
echo Next steps:
echo 1. Go to https://railway.app
echo 2. Click "New Project" ^> "Deploy from GitHub"
echo 3. Select AACG-Platform repository
echo 4. Set environment variables from .env.local
echo 5. Railway will auto-build and deploy!
echo.
pause
exit /b 0

:error
echo.
echo ERROR: Git operation failed!
echo Please check your git configuration and try again.
echo.
pause
exit /b 1
