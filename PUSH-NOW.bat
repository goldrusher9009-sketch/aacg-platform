@echo off
REM AACG Platform - Autonomous Deployment Push Script
REM This script pushes all commits to GitHub to trigger Railway deployment

echo.
echo ========================================
echo AACG Platform Deployment - Push Script
echo ========================================
echo.

cd C:\Users\teste\Downloads\AACG-Platform

REM Check git status
echo Checking repository status...
git status

echo.
echo ========================================
echo Ready to push to GitHub and trigger Railway
echo ========================================
echo.

REM Display commits to push
echo Latest commits to be pushed:
git log --oneline -3

echo.
echo Pushing to GitHub...
git push origin main

if errorlevel 1 (
  echo.
  echo ERROR: Push failed. Please check your credentials.
  echo Make sure you have GitHub authentication set up.
  pause
  exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Code pushed to GitHub
echo ========================================
echo.
echo Next steps:
echo 1. Check Railway dashboard: https://railway.app
echo 2. Verify deployment is building
echo 3. Check live URL when ready
echo.
pause
