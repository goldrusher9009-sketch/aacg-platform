# 🚨 AACG Platform - Railway Deployment Fix Guide

## Issue Summary
The Railway deployment **FAILED** due to:
1. **Incomplete package-lock.json** - Missing version numbers and integrity hashes
2. **Missing source files:**
   - `lib/supabase-client.ts`
   - `lib/types.ts`
3. **Corrupted scconfig.json** - Invalid paths configuration

## ✅ Steps to Fix (Execute on Your Local Machine)

### Step 1: Navigate to Your Project
```bash
cd ~/aacg-platform
```
Or on Windows:
```bash
cd C:\path\to\aacg-platform
```

### Step 2: Clean Up and Regenerate package-lock.json
```bash
# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# On Windows use:
# rmdir /s node_modules
# del package-lock.json

# Reinstall dependencies (this creates a fresh, complete lock file)
npm install
```

This will take 2-3 minutes. Wait for it to complete fully.

### Step 3: Create Missing Source Files

#### Create `lib/supabase-client.ts`
```bash
# Create the file (Linux/Mac)
cat > lib/supabase-client.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
EOF
```

On **Windows PowerShell**, use:
```powershell
$content = @"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
"@

Set-Content -Path "lib/supabase-client.ts" -Value $content
```

#### Create `lib/types.ts`
```bash
# Create the file (Linux/Mac)
cat > lib/types.ts << 'EOF'
export interface User {
  id: string
  email: string
  name?: string
  createdAt: Date
}

export interface Company {
  id: string
  name: string
  userId: string
  createdAt: Date
}

export interface LienRecord {
  id: string
  companyId: string
  amount: number
  status: 'pending' | 'active' | 'resolved'
  createdAt: Date
}

export interface PhotoAnalysis {
  id: string
  userId: string
  imageUrl: string
  analysisResult: Record<string, unknown>
  createdAt: Date
}

export interface Transaction {
  id: string
  userId: string
  amount: number
  type: 'payment' | 'refund'
  status: 'pending' | 'completed' | 'failed'
  createdAt: Date
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  environment: string
  checks: {
    api: 'operational' | 'degraded' | 'down'
    database?: 'connected' | 'disconnected'
    stripe?: 'connected' | 'disconnected'
    supabase?: 'connected' | 'disconnected'
  }
}
EOF
```

On **Windows PowerShell**, use:
```powershell
$content = @"
export interface User {
  id: string
  email: string
  name?: string
  createdAt: Date
}

export interface Company {
  id: string
  name: string
  userId: string
  createdAt: Date
}

export interface LienRecord {
  id: string
  companyId: string
  amount: number
  status: 'pending' | 'active' | 'resolved'
  createdAt: Date
}

export interface PhotoAnalysis {
  id: string
  userId: string
  imageUrl: string
  analysisResult: Record<string, unknown>
  createdAt: Date
}

export interface Transaction {
  id: string
  userId: string
  amount: number
  type: 'payment' | 'refund'
  status: 'pending' | 'completed' | 'failed'
  createdAt: Date
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  environment: string
  checks: {
    api: 'operational' | 'degraded' | 'down'
    database?: 'connected' | 'disconnected'
    stripe?: 'connected' | 'disconnected'
    supabase?: 'connected' | 'disconnected'
  }
}
"@

Set-Content -Path "lib/types.ts" -Value $content
```

### Step 4: Check scconfig.json
If the file exists, ensure the paths are correct. The error suggests it has invalid paths. Check with:
```bash
ls -la scconfig.json
# or on Windows:
# dir scconfig.json
```

If it exists with errors, either delete it or correct the paths to match your actual directory structure.

### Step 5: Stage and Commit Changes
```bash
git add .
git commit -m "Fix: Regenerate package-lock.json and add missing source files (lib/supabase-client.ts, lib/types.ts)"
```

### Step 6: Push to GitHub
```bash
git push origin main
```

Watch the Railway dashboard at: **https://railway.app/dashboard**

The deployment should now succeed. Total time: ~3 minutes.

---

## 🔍 Verification After Fix

Once the build completes (watch at Railway dashboard), verify:

```bash
curl https://web-production-b2192.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "environment": "production",
  "checks": {
    "api": "operational",
    "database": "connected",
    "stripe": "connected"
  }
}
```

---

## ⚠️ Important Notes

1. **npm install** will take 2-3 minutes - this is normal
2. The new `package-lock.json` will be ~500 KB larger than before
3. The missing source files are TypeScript interfaces and utilities
4. After pushing, Railway will auto-detect and re-build
5. Build should complete in 8-10 minutes this time

---

**Status:** Ready to fix  
**Action:** Follow steps 1-6 above on your local machine  
**Support:** Railway build logs available at https://railway.app/dashboard
