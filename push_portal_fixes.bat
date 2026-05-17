@echo off
cd /d "%~dp0"
del /f .git\index.lock 2>nul
del /f .git\HEAD.lock 2>nul
git add admin/app.js admin/index.html gc/index.html owner/index.html sub/index.html
git commit -m "Fix all portals: wire missing functions, complete truncated JS, add password reset

- gc/index.html: fixed truncation, added saveGCApproval, gcApproveAndPay, gcRejectNeg, gcForwardToOwner, viewSubmissionDetail, showNotification
- owner/index.html: fixed truncation, added openReleaseModal, saveOwnerRelease, ownerRejectNeg, updateOwnerDollarPreview, ownerReleaseQuick, viewOwnerPhoto, showNotification, password reset handler
- sub/index.html: fixed truncation, added acceptCounter, openCounter, submitCounter, openModal, closeModal, switchTab, submitInvoice, showToast, password reset handler
- admin/app.js: added toggleNotifSetting
- admin/index.html: added password reset landing handler (showResetView, doResetPassword)"
git push origin main
echo.
echo Done! Check Railway for deployment status.
pause
