#!/bin/bash

# BLOCKER FIX #3: Environment Setup Script

echo "🔧 Setting up environment variables..."

# Copy template if .env doesn't exist
if [ ! -f ".env.local" ]; then
  echo "Creating .env.local from .env.example..."
  cp .env.example .env.local
  echo "✅ Created .env.local - Update with actual values"
fi

# Ensure .env.production exists
if [ ! -f ".env.production" ]; then
  echo "Creating .env.production..."
  cat > .env.production << EOF
# Production Environment Variables - Update these in Railway dashboard
DATABASE_URL=postgresql://user:pass@host:5432/aacg_platform
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=YOUR_KEY_HERE
NODE_ENV=production
EOF
  echo "✅ Created .env.production"
fi

echo ""
echo "📝 Environment files setup complete"
echo "   - .env.local: Development variables"
echo "   - .env.production: Production variables (set in Railway)"
