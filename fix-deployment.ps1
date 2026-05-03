# Fix Git Index and Deploy AACG Platform to Railway

# Step 1: Reset git hard to recover from index corruption
Write-Host "Step 1: Recovering from git index corruption..."
git reset --hard HEAD

# Step 2: Verify Dockerfile has the required flag
Write-Host "Step 2: Verifying Dockerfile configuration..."
$dockerContent = Get-Content Dockerfile
if ($dockerContent -match "--legacy-peer-deps") {
    Write-Host "✓ Dockerfile already has --legacy-peer-deps flag"
} else {
    Write-Host "✗ Adding --legacy-peer-deps flag to Dockerfile..."
    $dockerContent = $dockerContent -replace "RUN npm ci", "RUN npm ci --legacy-peer-deps --no-optional"
    Set-Content Dockerfile $dockerContent
    Write-Host "✓ Dockerfile updated"
}

# Step 3: Stage changes
Write-Host "Step 3: Staging changes..."
git add Dockerfile
git status

# Step 4: Commit
Write-Host "Step 4: Committing to repository..."
git commit -m "Fix: Update Dockerfile with legacy-peer-deps flag for npm ci compatibility"

# Step 5: Push to GitHub (triggers Railway deployment)
Write-Host "Step 5: Pushing to GitHub (triggers Railway deployment)..."
git push origin main

Write-Host "`n========================================`n"
Write-Host "✓ Deployment Triggered!"
Write-Host "`nMonitor deployment at:"
Write-Host "https://railway.app/dashboard`n"
Write-Host "========================================`n"
