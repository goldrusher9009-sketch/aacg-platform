# AACG Platform v1.1.0 — Auto Deploy Script
# Commits all portal fixes and pushes to GitHub → triggers Railway auto-deploy
# Run from PowerShell: .\DEPLOY_v1.1.0.ps1

$ErrorActionPreference = "Stop"
$repo = "C:\Users\teste\Downloads\AACG-Platform"
Set-Location $repo

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AACG Platform v1.1.0 — Deploying..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Remove any stale git locks
if (Test-Path ".git\index.lock")  { Remove-Item ".git\index.lock"  -Force }
if (Test-Path ".git\HEAD.lock")   { Remove-Item ".git\HEAD.lock"   -Force }

# Stage all changed portal files + version bump
git add admin/app.js
git add admin/index.html
git add gc/index.html
git add owner/index.html
git add sub/index.html
git add package.json
git add VERSION
git add aacg-website.html

# Show what's staged
Write-Host "Staged files:" -ForegroundColor Yellow
git diff --cached --name-only

Write-Host ""

# Commit with version tag
$commitMsg = "v1.1.0 — Fix all portals: wire modal functions, password reset, complete truncated JS

CHANGES:
- gc/index.html: saveGCApproval, gcApproveAndPay, gcRejectNeg, gcForwardToOwner, viewSubmissionDetail, showNotification
- owner/index.html: openReleaseModal, saveOwnerRelease, ownerRejectNeg, updateOwnerDollarPreview, ownerReleaseQuick, viewOwnerPhoto, showNotification, password reset
- sub/index.html: acceptCounter, openCounter, submitCounter, openModal, closeModal, switchTab, submitInvoice, showToast, password reset
- admin/app.js: toggleNotifSetting, version badge (v1.1.0) in sidebar
- admin/index.html: showResetView, doResetPassword password reset landing
- aacg-website.html: account-type routing on signup, portal links in footer
- package.json: bumped to v1.1.0
- VERSION: 1.1.0"

git commit -m $commitMsg

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SUCCESS! v1.1.0 pushed to GitHub" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Railway is now auto-deploying." -ForegroundColor White
Write-Host "Live URL: https://allamericancg.com/platform" -ForegroundColor Cyan
Write-Host "Railway:  https://railway.app" -ForegroundColor Cyan
Write-Host ""
