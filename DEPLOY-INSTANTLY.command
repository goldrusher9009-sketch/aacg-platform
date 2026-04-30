#!/bin/bash
# AACG Platform - One-Command Deploy to GitHub + Railway
# Copy and paste this entire script into your terminal (macOS/Linux)

cd ~/aacg-platform 2>/dev/null || cd ~/path/to/aacg-platform || { echo "ERROR: Cannot find aacg-platform directory. Edit the path and try again."; exit 1; }

echo "🚀 AACG Platform - Deploying to Production"
echo "==========================================="
echo ""
echo "⏱️  Starting deployment at $(date)"
echo ""

# Configure git
git config user.email "goldrusher9009@gmail.com"
git config user.name "Scott"

# Stage files
echo "📦 Staging application code..."
git add app/ components/ lib/ __tests__/ \
  package.json package-lock.json tsconfig.json \
  next.config.js jest.config.js jest.setup.js vitest.config.ts \
  .dockerignore Procfile .gitignore

# Commit
echo "💾 Creating commit..."
git commit -m "Add complete AACG Platform Next.js application source code

- Next.js 13+ App Router (app/ directory)
- React components (components/ directory)
- Utility libraries (lib/ directory)
- Build scripts and test suites
- Static public assets
- Configuration files (tsconfig, next.config, jest, vitest)
- Package.json with all dependencies

This commit enables Railway deployment using Railpack (automatic detection)."

# Push
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "==========================================="
echo "✅ CODE PUSHED TO GITHUB!"
echo "==========================================="
echo ""
echo "📊 Railway Deployment Starting..."
echo ""
echo "Timeline:"
echo "  0-1 sec:   GitHub webhook triggers Railway"
echo "  1-5 sec:   Railpack detects Next.js app"
echo "  5-10 sec:  Build pipeline starts"
echo "  1-2 min:   npm install (47 dependencies)"
echo "  2-3 min:   npm run build (compilation)"
echo "  3-4 min:   npm start (deployment)"
echo "  4-5 min:   ✅ APP LIVE"
echo ""
echo "🌐 Watch deployment: https://railway.app"
echo "   Project: grand-empathy"
echo "   Service: web"
echo ""
echo "🔍 Verify health (after 5 min):"
echo "   curl https://web-production-b2192.up.railway.app/api/health"
echo ""
echo "⏳ Deployment in progress... Check Railway dashboard"
echo ""
