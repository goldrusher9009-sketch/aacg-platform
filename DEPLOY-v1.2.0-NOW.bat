@echo off
REM AACG Platform v1.2.0 - Deploy to GitHub and Railway
REM Run this as Administrator

color 0B
cls

echo.
echo ========================================
echo AACG Platform v1.2.0 - DEPLOYMENT
echo ========================================
echo.

cd /d C:\Users\teste\Downloads\AACG-Platform
echo Working directory: %CD%
echo.

REM Remove git lock if stuck
echo Checking git status...
if exist .\.git\index.lock (
    echo Removing git lock file...
    del .\.git\index.lock
)
echo.

REM Configure git
echo Configuring git...
git config user.email "goldrusher9009@gmail.com"
git config user.name "Scott"
echo.

REM Stage changes
echo Staging all changes...
git add .
echo.

REM Commit
echo Committing v1.2.0...
git commit -m "v1.2.0: Production ready - signup endpoint, button handlers, complete dependencies"
echo.

REM Push to GitHub
echo Pushing to GitHub...
git push origin main

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo ========================================
    echo SUCCESS! Code pushed to GitHub!
    echo ========================================
    echo.
    echo NEXT STEPS:
    echo 1. Open: https://railway.app
    echo 2. Click: "New Project" ^> "Deploy from GitHub"
    echo 3. Select: "aacg-platform" repository
    echo 4. Click: "Deploy"
    echo 5. Wait 5-10 minutes for Railway to build
    echo 6. Add environment variables
    echo 7. Your app is LIVE!
    echo.
    echo Version: 1.2.0 - PRODUCTION READY
    echo.
    pause
    exit /b 0
) else (
    color 0C
    echo.
    echo ERROR: Git push failed!
    echo Please check your git credentials and try again.
    echo.
    pause
    exit /b 1
)
