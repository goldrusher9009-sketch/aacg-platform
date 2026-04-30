# AACG Platform - Push Source Code to GitHub and Trigger Railway Deployment
# Run this script from your local aacg-platform repository in PowerShell

Write-Host "==========================================" -ForegroundColor Green
Write-Host "AACG Platform - GitHub Push & Deploy" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Check if we're in a git repo
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository!" -ForegroundColor Red
    Write-Host "Please run this script from your aacg-platform directory" -ForegroundColor Red
    exit 1
}

# Get current branch
$CURRENT_BRANCH = & git rev-parse --abbrev-ref HEAD

if ($CURRENT_BRANCH -ne "main") {
    Write-Host "⚠️  Warning: You're on branch '$CURRENT_BRANCH', not 'main'" -ForegroundColor Yellow
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne "y") {
        exit 1
    }
}

Write-Host ""
Write-Host "🔧 Configuring git..." -ForegroundColor Cyan
& git config user.email "goldrusher9009@gmail.com"
& git config user.name "Scott"

Write-Host ""
Write-Host "📦 Adding application source files..." -ForegroundColor Cyan
& git add app/, components/, lib/, __tests__/, `
    package.json, package-lock.json, tsconfig.json, `
    next.config.js, jest.config.js, jest.setup.js, vitest.config.ts, `
    .dockerignore, Procfile, .gitignore

Write-Host ""
Write-Host "📋 Checking git status..." -ForegroundColor Cyan
& git status --short | Select-Object -First 15

Write-Host ""
$response = Read-Host "Commit and push these files? (y/n)"
if ($response -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "💾 Creating commit..." -ForegroundColor Cyan
& git commit -m @"
Add complete AACG Platform Next.js application source code

- Next.js 13+ App Router (app/ directory)
- React components (components/ directory)
- Utility libraries (lib/ directory)
- Build scripts and test suites
- Static public assets
- Configuration files (tsconfig, next.config, jest, vitest)
- Package.json with all dependencies

This commit enables Railway deployment using Railpack (automatic detection).
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  No changes to commit or commit already exists" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
& git push origin main

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ SUCCESS!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "The code has been pushed to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Railway will now:" -ForegroundColor Cyan
Write-Host "  1. Detect the push via webhook"
Write-Host "  2. Start a new build using Railpack"
Write-Host "  3. Install dependencies (npm install)"
Write-Host "  4. Build the application (npm run build)"
Write-Host "  5. Deploy and start the server (npm start)"
Write-Host ""
Write-Host "⏳ Build typically takes 3-5 minutes" -ForegroundColor Yellow
Write-Host ""
Write-Host "📍 Your app will be live at:" -ForegroundColor Cyan
Write-Host "   https://web-production-b2192.up.railway.app"
Write-Host ""
Write-Host "🔍 Verify with:" -ForegroundColor Cyan
Write-Host "   curl https://web-production-b2192.up.railway.app/api/health"
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Green
Write-Host "  1. Monitor deployment in Railway dashboard"
Write-Host "  2. Run health checks once deployment completes"
Write-Host "  3. Begin Phase 2: MVP Agents implementation"
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
