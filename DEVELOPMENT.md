# AACG Platform - Development Guide

**Version**: 1.0.2 | **Last Updated**: 2026-04-29 | **Status**: Production Ready

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Local Setup](#local-setup)
4. [Environment Configuration](#environment-configuration)
5. [Development Workflow](#development-workflow)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/goldrusher9009-sketch/aacg-platform.git
cd AACG-Platform

# Install dependencies
npm ci

# Create .env.local from template
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev

# Open in browser
# http://localhost:3000

# In another terminal, run tests
npm run test:ui
```

**Time to first run**: ~5 minutes

---

## 📦 Prerequisites

### System Requirements
- **Node.js**: 18.x or 20.x (required)
- **npm**: 8.x or higher
- **Git**: 2.x or higher
- **OS**: Windows, macOS, or Linux

### Required Services (for full functionality)
- **Supabase Account** (PostgreSQL database)
- **Stripe Account** (payment processing)
- **GitHub Account** (repository access)
- **Railway.app Account** (deployment platform)

### Verification

```bash
# Check Node.js version
node --version
# Should output: v18.x.x or v20.x.x

# Check npm version
npm --version
# Should output: 8.x.x or higher

# Check Git
git --version
# Should output: git version 2.x or higher
```

---

## 🔧 Local Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/goldrusher9009-sketch/aacg-platform.git
cd AACG-Platform
```

### Step 2: Install Dependencies

**Clean install** (recommended for first setup):
```bash
npm ci
```

**Standard install** (if you have package-lock.json updates):
```bash
npm install
```

**Clear cache if issues occur**:
```bash
./scripts/clear-npm-lock.sh
npm ci
```

### Step 3: Verify Installation

```bash
# Check key dependencies
npm ls next react @supabase/supabase-js stripe typescript

# Should show all packages installed successfully
```

---

## ⚙️ Environment Configuration

### Create .env.local

```bash
# Copy the template
cp .env.example .env.local
```

### Edit .env.local

Required variables for local development:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxxxxxxxxxxxx

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Get Credentials

**Supabase**:
1. Go to https://supabase.com
2. Create project or select existing
3. Navigate to "Settings → API"
4. Copy URL and anon key

**Stripe**:
1. Go to https://stripe.com
2. Navigate to "Developers → API Keys"
3. Copy test keys (pk_test_... and sk_test_...)

### Verify Configuration

```bash
# Test Supabase connection
npm run dev
# Navigate to: http://localhost:3000/api/supabase/health

# Should return:
# {"status":"healthy","service":"Supabase","timestamp":"..."}

# Test Stripe connection
# Navigate to: http://localhost:3000/api/stripe/health
# Should return similar response
```

---

## 💻 Development Workflow

### Start Development Server

```bash
npm run dev
```

**Output**:
```
> aacg-platform@1.0.2 dev
> next dev

  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
✓ Compiled client and server successfully
```

### Code Changes

**Hot Reload Enabled**: Changes automatically reload

```bash
# Edit app/page.tsx
# Save file → Browser automatically refreshes
# No manual restart needed
```

### Create New API Routes

```bash
# Create new route
mkdir -p app/api/my-feature
touch app/api/my-feature/route.ts
```

**Template** (`app/api/my-feature/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    return NextResponse.json({
      status: 'success',
      message: 'My feature working',
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

### Create React Components

**Template** (`app/components/MyComponent.tsx`):
```typescript
'use client';

import React from 'react';

interface MyComponentProps {
  title: string;
  description?: string;
}

export default function MyComponent({ title, description }: MyComponentProps) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      {description && <p className="text-gray-600">{description}</p>}
    </div>
  );
}
```

### Type Checking

```bash
# Run TypeScript compiler
npx tsc --noEmit

# Fix TypeScript errors
# Recommended IDE: VS Code with TypeScript extension
```

---

## 🧪 Testing

### Run All Tests

```bash
npm run test
```

### Run Phase 1 Tests (Infrastructure)

```bash
npm run test:phase1
```

**What it tests**:
- ✅ Database connectivity
- ✅ Stripe integration
- ✅ Supabase integration
- ✅ Health check endpoints
- ✅ Environment variables

### Watch Mode (for development)

```bash
npm run test:phase1:watch
```

Files reload automatically when changed.

### Test Dashboard (UI)

```bash
npm run test:ui
```

Opens interactive dashboard at http://localhost:51204/__vitest__/

**Features**:
- Real-time test results
- Code coverage visualization
- Test filtering by name
- Debug individual tests

### Create New Tests

**File**: `__tests__/my-feature.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('should do something', () => {
    const result = 1 + 1;
    expect(result).toBe(2);
  });

  it('should handle errors', async () => {
    const fn = async () => {
      throw new Error('Test error');
    };
    
    await expect(fn()).rejects.toThrow('Test error');
  });
});
```

### Code Coverage

```bash
npm run test -- --coverage
```

---

## 🚀 Deployment

### Local Production Build

```bash
# Build application
npm run build

# Start production server
npm run start
```

**Output**:
```
> aacg-platform@1.0.2 start
> next start

  ▲ Next.js 14.0.0
  - Local: http://localhost:3000
✓ Ready in 1.2s
```

### Deploy to Railway.app

**Step 1: Ensure code is pushed**

```bash
git add .
git commit -m "feat: Your feature"
git push origin main
```

**Step 2: Trigger deploy**

```powershell
.\PUSH-PACKAGE-JSON.ps1
```

**Step 3: Monitor on Railway**

1. Go to https://railway.app
2. Open AACG Platform project
3. Monitor deployment logs
4. Wait for green status

### Deploy to Docker

```bash
# Build Docker image
docker build -t aacg-platform:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  aacg-platform:latest
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module" errors

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm ci
```

### Issue: TypeScript errors in VS Code

**Solution**:
```bash
# Restart TypeScript server
# VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Issue: Port 3000 already in use

**Solution**:
```bash
# Use different port
npm run dev -- -p 3001

# Or kill process using port 3000
# Windows: netstat -ano | findstr :3000
# macOS/Linux: lsof -i :3000
```

### Issue: Environment variables not loading

**Checklist**:
- [ ] .env.local exists in root directory
- [ ] All required variables are set (see Environment Configuration)
- [ ] No quotes around values in .env.local
- [ ] Restart dev server after changing .env.local

### Issue: Supabase connection fails

**Checklist**:
```bash
# Test endpoint
curl http://localhost:3000/api/supabase/health

# Should return:
# {"status":"healthy","service":"Supabase","timestamp":"..."}

# If fails:
# 1. Verify NEXT_PUBLIC_SUPABASE_URL is correct
# 2. Verify SUPABASE_SERVICE_ROLE_KEY is set
# 3. Check Supabase project status online
```

### Issue: Database migrations fail

**Solution**:
```bash
# Run migrations
npm run migrate

# Check migration status
npm run migrate -- --status
```

### Issue: Tests timeout

**Solution**:
```bash
# Increase timeout
npm run test -- --testTimeout=30000
```

### Get Help

**Check these files**:
- `PROJECT-TREE-TRACKER.md` — Project structure
- `PHASE1-TEST-SUITE-README.md` — Test documentation
- `CRITICAL-FIX-PACKAGE-JSON.md` — Deployment issues

**Contact**:
- Email: goldrusher9009@gmail.com
- GitHub Issues: https://github.com/goldrusher9009-sketch/aacg-platform/issues

---

## 📚 Additional Resources

### Documentation
- Next.js: https://nextjs.org/docs
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org/docs
- Supabase: https://supabase.com/docs
- Stripe: https://stripe.com/docs

### Tools & IDEs
- **VS Code** (Recommended)
  - Extensions: ESLint, Prettier, TypeScript Vue Plugin
  
- **WebStorm/IntelliJ IDEA**
  - Built-in TypeScript support
  
- **Vim/Neovim**
  - Install: coc-prettier, coc-eslint

### Browser DevTools
- React DevTools extension
- Chrome DevTools (F12)
- Network tab for API debugging

---

## 🔒 Security Best Practices

### During Development
- ✅ Never commit .env.local (already in .gitignore)
- ✅ Never commit production credentials
- ✅ Use test/development keys for Stripe & Supabase
- ✅ Keep dependencies updated: `npm outdated`
- ✅ Run security audit: `npm audit`

### Before Deployment
- ✅ Review all environment variables
- ✅ Enable HTTPS in production
- ✅ Set secure CORS headers
- ✅ Enable rate limiting
- ✅ Configure firewall rules

---

## 📊 Performance Tips

### Build Optimization
```bash
# Analyze bundle size
npm run build -- --analyze
```

### Runtime Performance
- Use React.memo for expensive components
- Implement lazy loading: `React.lazy()`
- Use Next.js Image optimization
- Enable caching headers

### Database Performance
- Index frequently queried columns
- Use connection pooling (Supabase included)
- Monitor slow queries in Supabase dashboard

---

## 🎯 Next Steps

1. **Complete Setup**: Follow Local Setup section
2. **Verify Installation**: Run npm scripts above
3. **Start Development**: `npm run dev`
4. **Review Project**: Check `PROJECT-TREE-TRACKER.md`
5. **Run Tests**: `npm run test:ui`
6. **Deploy**: Follow Deployment section

---

**Last Updated**: 2026-04-29 | **Version**: 1.0.2 | **Status**: Production Ready 🚀
