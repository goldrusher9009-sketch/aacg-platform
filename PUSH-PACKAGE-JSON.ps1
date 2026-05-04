# Script to commit and push package.json to GitHub
# Run this in PowerShell from the AACG-Platform directory

Write-Host "Starting package.json commit and push..." -ForegroundColor Cyan

# Check git status
Write-Host "`nChecking git status..." -ForegroundColor Yellow
git status

# Add package.json
Write-Host "`nAdding package.json..." -ForegroundColor Yellow
git add package.json

# Commit
Write-Host "`nCommitting package.json..." -ForegroundColor Yellow
git commit -m "feat: Add package.json to repository for Railway deployment"

# Push to main
Write-Host "`nPushing to GitHub origin/main..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Successfully pushed package.json to GitHub!" -ForegroundColor Green
    Write-Host "`nThe Railway deployment should now work. You can:" -ForegroundColor Cyan
    Write-Host "  1. Go to Railway.app dashboard"
    Write-Host "  2. Click the three-dot menu on the deployment"
    Write-Host "  3. Select 'Redeploy' to trigger a new build"
    Write-Host "  4. Monitor the build logs for successful completion"
} else {
    Write-Host "`n✗ Push failed. Please check your GitHub credentials and try again." -ForegroundColor Red
}
