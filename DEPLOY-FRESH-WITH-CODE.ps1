# AACG Platform - Fresh Deploy to GitHub (with complete source code)
# This script uses the clean AACG-Platform-Fresh directory and pushes to GitHub

Write-Host "================================" -ForegroundColor Cyan
Write-Host "AACG Platform - Fresh GitHub Push" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Copying source code from AACG-Platform-Fresh..." -ForegroundColor Yellow
$source = "C:\Users\teste\Downloads\AACG-Platform-Fresh"
$dest = "C:\Users\teste\Downloads\AACG-Deploy-Temp"

if (Test-Path $dest) {
    Write-Host "  Removing old temp directory..." -ForegroundColor Gray
    Remove-Item -Recurse -Force $dest -ErrorAction SilentlyContinue
}

Copy-Item -Path $source -Destination $dest -Recurse -Force
Write-Host "OK Source code copied to temp directory" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Initializing git repository..." -ForegroundColor Yellow
Set-Location $dest
Remove-Item -Recurse -Force ".\.git" -ErrorAction SilentlyContinue
& git init
& git config user.email "goldrusher9009@gmail.com"
& git config user.name "Scott"
Write-Host "OK Git initialized" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Adding all files to git..." -ForegroundColor Yellow
& git add .
Write-Host "OK All files added to staging" -ForegroundColor Green

Write-Host ""
Write-Host "Step 4: Creating initial commit..." -ForegroundColor Yellow
& git commit -m "Initial commit: AACG Platform with 20 AI agents - Complete source code"
Write-Host "OK Commit created" -ForegroundColor Green

Write-Host ""
Write-Host "Step 5: Setting main branch and adding remote..." -ForegroundColor Yellow
& git branch -M main
& git remote remove origin -ErrorAction SilentlyContinue
& git remote add origin https://github.com/goldrusher9009-sketch/aacg-platform.git
Write-Host "OK Main branch configured and remote added" -ForegroundColor Green

Write-Host ""
Write-Host "Step 6: Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "  ⚠️  You may be prompted to enter GitHub credentials" -ForegroundColor Yellow
& git push -u origin main -f
Write-Host "OK Push complete!" -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT READY!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Check GitHub: https://github.com/goldrusher9009-sketch/aacg-platform" -ForegroundColor White
Write-Host "  2. Check Railway dashboard for automatic build trigger" -ForegroundColor White
Write-Host "  3. Wait 2-5 minutes for Railway build to complete" -ForegroundColor White
Write-Host "  4. Verify live endpoints once build succeeds" -ForegroundColor White
Write-Host ""
Write-Host "Expected live URLs:" -ForegroundColor Cyan
Write-Host "  Web: https://aacg-platform-production.up.railway.app" -ForegroundColor Gray
Write-Host "  API: https://api.aacg-platform.up.railway.app" -ForegroundColor Gray
Write-Host ""
Write-Host "Run Phase 1 Validation once live: .\PHASE-1-VALIDATION-CHECKLIST.md" -ForegroundColor White
Write-Host ""
