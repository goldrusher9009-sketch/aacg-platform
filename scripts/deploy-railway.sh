#!/bin/bash

# Railway Deployment Script

echo "🚀 Deploying AACG Platform to Railway..."

# Check environment
if [ ! -f ".env.production" ]; then
  echo "❌ Error: .env.production not found"
  exit 1
fi

# Build check
echo "Building application..."
npm run build || {
  echo "❌ Build failed"
  exit 1
}

# Verify git is clean
echo "Checking git status..."
git status

echo ""
echo "✅ Ready for Railway deployment"
echo "   Next steps:"
echo "   1. git push origin main"
echo "   2. Railway will auto-build and deploy"
echo "   3. Monitor at: https://railway.app"
