#!/bin/bash
# Quick push script to deploy AACG Platform to Railway
# Run this from your local aacg-platform repository

set -e

echo "=========================================="
echo "AACG Platform - Quick GitHub Push"
echo "=========================================="
echo ""

# Check if we're in a git repo
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository!"
    echo "Please run this script from the aacg-platform directory"
    exit 1
fi

# Verify we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Warning: You're on branch '$CURRENT_BRANCH', not 'main'"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📦 Checking for application source files..."
if [ -d "app" ] && [ -d "components" ] && [ -f "package.json" ]; then
    echo "✅ Source files found"
else
    echo "⚠️  Some source files are missing. Did you extract the archive?"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "📝 Staging files..."
git add app/ components/ lib/ scripts/ public/ __tests__/ \
    package.json package-lock.json tsconfig.json \
    next.config.js jest.config.js jest.setup.js vitest.config.ts \
    .dockerignore Procfile .gitignore 2>/dev/null || true

echo ""
echo "📋 Commit message:"
echo "---"
echo "Add complete AACG Platform Next.js application source code"
echo ""
echo "- Next.js 13+ App Router (app/ directory)"
echo "- React components (components/ directory)"
echo "- Utility libraries (lib/ directory)"
echo "- Build scripts and test suites"
echo "- Static public assets"
echo "- Configuration files (tsconfig, next.config, jest, vitest)"
echo "- Package.json with all dependencies"
echo ""
echo "This commit enables Railway deployment using Railpack (automatic detection)."
echo "---"
echo ""

read -p "Create commit? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "💾 Creating commit..."
git commit -m "Add complete AACG Platform Next.js application source code

- Next.js 13+ App Router (app/ directory)
- React components (components/ directory)
- Utility libraries (lib/ directory)
- Build scripts and test suites
- Static public assets
- Configuration files (tsconfig, next.config, jest, vitest)
- Package.json with all dependencies

This commit enables Railway deployment using Railpack (automatic detection)." || {
    echo "⚠️  No changes to commit or commit already exists"
}

echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "=========================================="
echo "✅ SUCCESS!"
echo "=========================================="
echo ""
echo "The code has been pushed to GitHub!"
echo ""
echo "📊 Railway will now:"
echo "  1. Detect the push via webhook"
echo "  2. Start a new build using Railpack"
echo "  3. Install dependencies (npm install)"
echo "  4. Build the application (npm run build)"
echo "  5. Deploy and start the server (npm start)"
echo ""
echo "⏳ Build typically takes 3-5 minutes"
echo ""
echo "📍 Your app will be live at:"
echo "   https://web-production-b2192.up.railway.app"
echo ""
echo "🔍 Verify with:"
echo "   curl https://web-production-b2192.up.railway.app/api/health"
echo ""
echo "=========================================="
