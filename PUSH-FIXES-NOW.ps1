# ============================================================
# PUSH ALL FIXES TO GITHUB - triggers Railway redeploy
# Run from: C:\Users\teste\Downloads\AACG-Platform\
# ============================================================

Set-Location "C:\Users\teste\Downloads\AACG-Platform"

# Step 1: Remove stale git lock files
$lockFiles = @(".git\index.lock", ".git\config.lock")
foreach ($lock in $lockFiles) {
    if (Test-Path $lock) {
        Remove-Item $lock -Force
        Write-Host "  Removed stale lock: $lock" -ForegroundColor Yellow
    }
}

# Step 2: Pull latest from GitHub (fixes "rejected: fetch first" error)
Write-Host "`nPulling latest from GitHub..." -ForegroundColor Cyan
git pull origin main --rebase

# Step 3: Stage admin/index.html (OpenRouter key pre-seeded)
Write-Host "`nStaging files..." -ForegroundColor Cyan
git add admin/index.html

# Step 4: Commit
$commitMsg = "Pre-seed OpenRouter API key - all 12 cloud AI agents work without manual key entry"
git commit -m $commitMsg

# Step 5: Push
Write-Host "`nPushing to GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSUCCESS! Pushed to GitHub." -ForegroundColor Green
    Write-Host "   Railway redeploys automatically in ~60 seconds." -ForegroundColor Green
    Write-Host "   Watch: https://railway.app/dashboard" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Test after deploy:" -ForegroundColor White
    Write-Host "   Admin + Agents: https://web-production-b2192.up.railway.app/admin" -ForegroundColor Gray
    Write-Host "   Run any Cloud AI agent - no key prompt, runs immediately!" -ForegroundColor Green
} else {
    Write-Host "`nPush failed. Check output above." -ForegroundColor Red
    Write-Host "   If it says 'index.lock exists', the lock was already removed above." -ForegroundColor Yellow
    Write-Host "   Try running the script again." -ForegroundColor Yellow
}
