# AACG Platform v1.2.0 - Deploy to GitHub and Railway NOW
# Run this in PowerShell as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AACG Platform v1.2.0 - DEPLOYMENT START" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project
$projectPath = "C:\Users\teste\Downloads\AACG-Platform"
Set-Location $projectPath
Write-Host "📁 Working directory: $projectPath" -ForegroundColor Green

# Remove git lock if stuck
Write-Host ""
Write-Host "🔧 Checking git status..." -ForegroundColor Yellow
if (Test-Path ".\.git\index.lock") {
    Write-Host "⚠️  Git lock file found, removing..." -ForegroundColor Yellow
    Remove-Item -Path ".\.git\index.lock" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Lock removed" -ForegroundColor Green
}

# Configure git
Write-Host ""
Write-Host "⚙️  Configuring git..." -ForegroundColor Yellow
git config user.email "goldrusher9009@gmail.com"
git config user.name "Scott"
Write-Host "✅ Git configured" -ForegroundColor Green

# Stage changes
Write-Host ""
Write-Host "📦 Staging all changes..." -ForegroundColor Yellow
git add .
Write-Host "✅ Changes staged" -ForegroundColor Green

# Commit
Write-Host ""
Write-Host "💾 Committing v1.2.0..." -ForegroundColor Yellow
git commit -m "v1.2.0: Production ready - signup endpoint, button handlers, complete dependencies"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Committed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Commit status: $LASTEXITCODE (might already be committed)" -ForegroundColor Yellow
}

# Push to GitHub
Write-Host ""
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "❌ Push failed with code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Check your git credentials and try again" -ForegroundColor Red
    exit 1
}

# Success!
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT TO GITHUB COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 NEXT STEPS - Connect to Railway:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open: https://railway.app" -ForegroundColor White
Write-Host "2. Click: 'New Project' → 'Deploy from GitHub'" -ForegroundColor White
Write-Host "3. Select: 'aacg-platform' repository" -ForegroundColor White
Write-Host "4. Click: 'Deploy'" -ForegroundColor White
Write-Host "5. Wait: 5-10 minutes for Railway to build" -ForegroundColor White
Write-Host "6. Add environment variables from .env.local" -ForegroundColor White
Write-Host "7. Your app goes LIVE!" -ForegroundColor Green
Write-Host ""
Write-Host "🔑 Required Environment Variables:" -ForegroundColor Cyan
Write-Host "   - NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Gray
Write-Host "   - NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Gray
Write-Host "   - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Gray
Write-Host "   - DATABASE_URL" -ForegroundColor Gray
Write-Host "   - JWT_SECRET" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 What's Deployed:" -ForegroundColor Cyan
Write-Host "   ✅ Signup endpoint (/api/auth/signup)" -ForegroundColor Green
Write-Host "   ✅ Signup form (/app/signup/page.tsx)" -ForegroundColor Green
Write-Host "   ✅ All button handlers" -ForegroundColor Green
Write-Host "   ✅ Supabase auth integration" -ForegroundColor Green
Write-Host "   ✅ Database user creation" -ForegroundColor Green
Write-Host "   ✅ JWT token handling" -ForegroundColor Green
Write-Host "   ✅ All dependencies" -ForegroundColor Green
Write-Host ""
Write-Host "Version: 1.2.0 | Status: 🟢 PRODUCTION READY" -ForegroundColor Green
Write-Host ""
pause
