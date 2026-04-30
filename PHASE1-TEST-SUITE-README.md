# Phase 1 Infrastructure Validation Test Suite
## Comprehensive Test Coverage & Execution Guide

### Overview
This test suite provides **24 infrastructure validation tests** designed to validate the AACG Platform deployment on Railway.app immediately after a fresh build. The tests verify core infrastructure connectivity, health endpoints, database connectivity, and third-party API integrations (Supabase, Stripe).

**Framework:** Vitest with TypeScript  
**Location:** `__tests__/phase1-infrastructure.test.ts`  
**Expected Runtime:** 2-5 minutes  
**Status:** Ready for Review & Approval

---

## Test Structure (24 Tests Across 5 Categories)

### Category 1: Health Check Endpoints (4 Tests)
Tests verify that the application is running and responding to basic health checks.

- **T1:** Application responds on health endpoint
- **T2:** Health endpoint returns valid JSON response
- **T3:** Health endpoint includes required status field
- **T4:** Health endpoint response time is acceptable (<5s)

**Purpose:** Confirm the application is deployed and running on the target environment.

---

### Category 2: Database Connectivity (5 Tests)
Tests validate PostgreSQL database configuration and connectivity.

- **T5:** DATABASE_URL environment variable is properly set
- **T6:** Database URL contains all required connection components
- **T7:** Database endpoint is reachable (verified via health check)
- **T8:** Database health check returns connectivity status
- **T9:** Database connection completes within reasonable timeout (<30s)

**Purpose:** Ensure PostgreSQL database is accessible and responding to connection requests.

---

### Category 3: Supabase Integration (6 Tests)
Tests validate Supabase configuration, authentication, and basic operations.

- **T10:** NEXT_PUBLIC_SUPABASE_URL is configured with valid Supabase domain
- **T11:** NEXT_PUBLIC_SUPABASE_ANON_KEY is configured with sufficient length
- **T12:** Supabase endpoint responds to API requests
- **T13:** API authenticates successfully with Supabase anon key
- **T14:** Supabase can execute basic queries (table existence check)
- **T15:** Supabase RLS policies are active and enforced

**Purpose:** Verify Supabase backend is connected, authenticated, and configured for multi-tenant RLS.

---

### Category 4: Stripe Integration (5 Tests)
Tests validate Stripe payment processing configuration and connectivity.

- **T16:** STRIPE_SECRET_KEY environment variable is set
- **T17:** Stripe key is in valid format (test or live key)
- **T18:** Stripe API endpoint is reachable and responding
- **T19:** Stripe webhook endpoint is configured in the application
- **T20:** Stripe products/prices are accessible through the API

**Purpose:** Confirm Stripe payment integration is configured and operational for subscription management.

---

### Category 5: Environment Configuration (4 Tests)
Tests verify all required environment variables are set and accessible.

- **T21:** All required environment variables are present
- **T22:** NODE_ENV is properly configured
- **T23:** API URL is accessible from environment
- **T24:** All integrations report connectivity status

**Purpose:** Ensure the deployment environment is correctly configured for production operation.

---

## Pre-Execution Checklist

Before running the test suite, verify:

- [ ] Fresh deployment has completed successfully on Railway.app
- [ ] Application is responding to HTTP requests
- [ ] All environment variables are set in Railway deployment
- [ ] `.env.production` is loaded with valid credentials:
  - [ ] DATABASE_URL (PostgreSQL connection string)
  - [ ] NEXT_PUBLIC_SUPABASE_URL (Supabase project URL)
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY (Supabase anon key)
  - [ ] STRIPE_SECRET_KEY (Stripe test or live key)
- [ ] Network connectivity to external services (Supabase, Stripe, database)
- [ ] No firewall/security group restrictions on API ports

---

## Installation & Configuration

### 1. Install Vitest & Dependencies

```bash
npm install --save-dev vitest @vitest/ui typescript @types/node axios
```

### 2. Update package.json Scripts

Add the following test scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:phase1": "vitest run __tests__/phase1-infrastructure.test.ts",
    "test:phase1:watch": "vitest __tests__/phase1-infrastructure.test.ts",
    "test:ui": "vitest --ui"
  }
}
```

### 3. Configure Environment Variables

Create a `.env.test` file with your test environment:

```env
API_URL=http://localhost:3000
NODE_ENV=test
DATABASE_URL=<your-postgresql-connection-string>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
STRIPE_SECRET_KEY=<your-stripe-test-key>
```

---

## Execution Instructions

### Option 1: Run Tests Locally (Development)

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.production .env.test

# Run the test suite
npm run test:phase1
```

### Option 2: Run Tests Against Railway Deployment

```bash
# Set API_URL to your Railway deployment
export API_URL="https://your-railway-deployment.railway.app"

# Run tests
npm run test:phase1
```

### Option 3: Watch Mode (Development)

```bash
npm run test:phase1:watch
```

### Option 4: With UI Dashboard

```bash
npm run test:ui
```

---

## Expected Test Results

### Passing Test Output
```
✓ PHASE 1: Infrastructure Validation (24 tests)
  ✓ 1. Health Check Endpoints (4)
    ✓ T1: Application responds on health endpoint
    ✓ T2: Health endpoint returns valid JSON
    ✓ T3: Health endpoint returns status field
    ✓ T4: Health endpoint responds within 5 seconds
  
  ✓ 2. Database Connectivity (5)
    ✓ T5: DATABASE_URL environment variable is set
    ✓ T6: Database URL contains required components
    ✓ T7: Database endpoint is reachable
    ✓ T8: Database health check returns connectivity status
    ✓ T9: Database connection timeout is reasonable
  
  ✓ 3. Supabase Integration (6)
    ✓ T10: NEXT_PUBLIC_SUPABASE_URL is configured
    ✓ T11: NEXT_PUBLIC_SUPABASE_ANON_KEY is configured
    ✓ T12: Supabase endpoint is accessible
    ✓ T13: API can authenticate with Supabase anon key
    ✓ T14: Supabase can execute basic query
    ✓ T15: Supabase RLS policies are in effect
  
  ✓ 4. Stripe Integration (5)
    ✓ T16: STRIPE_SECRET_KEY environment variable is set
    ✓ T17: Stripe key is valid format
    ✓ T18: Stripe API endpoint is reachable
    ✓ T19: Stripe webhook endpoint is configured
    ✓ T20: Stripe products/prices are accessible
  
  ✓ 5. Environment Configuration (4)
    ✓ T21: All required environment variables are set
    ✓ T22: NODE_ENV is configured
    ✓ T23: API URL is accessible
    ✓ T24: All integrations report connectivity status

Test Files  1 passed (1)
Tests  24 passed (24)
```

---

## Troubleshooting Common Test Failures

### T1-T4 Failures (Health Check)
**Issue:** Application not responding on `/api/health`  
**Solutions:**
1. Verify deployment completed successfully
2. Check application logs: `railway logs -f`
3. Verify API_URL environment variable
4. Check network connectivity to Railway deployment

### T5-T9 Failures (Database Connectivity)
**Issue:** Database connection failing  
**Solutions:**
1. Verify DATABASE_URL is set in Railway environment
2. Test connection: `psql $DATABASE_URL -c "SELECT 1"`
3. Check PostgreSQL logs in Supabase dashboard
4. Verify database user has correct permissions
5. Check firewall/security group rules for database port

### T10-T15 Failures (Supabase Integration)
**Issue:** Supabase authentication or API access failing  
**Solutions:**
1. Verify NEXT_PUBLIC_SUPABASE_URL is correct in Railway
2. Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is correct
3. Check Supabase dashboard for project status
4. Verify RLS policies are configured in Supabase
5. Check API logs for Supabase errors

### T16-T20 Failures (Stripe Integration)
**Issue:** Stripe API key invalid or Stripe endpoint unreachable  
**Solutions:**
1. Verify STRIPE_SECRET_KEY is set correctly in Railway
2. Confirm Stripe account is active (test or live mode)
3. Check Stripe API status: https://status.stripe.com
4. Verify webhook endpoint configuration in Stripe dashboard
5. Check for any Stripe API restrictions

### T21-T24 Failures (Environment Configuration)
**Issue:** Missing or invalid environment variables  
**Solutions:**
1. List all vars: `railway env`
2. Verify each required variable is set
3. Check for typos in environment variable names
4. Reload environment: Redeploy service from Railway dashboard

---

## Success Criteria

The Phase 1 test suite is considered **PASSED** when:
- ✅ All 24 tests pass
- ✅ No timeout errors (all tests complete within 5 minutes)
- ✅ All external API connections (Supabase, Stripe) are reachable
- ✅ Database connectivity confirmed working
- ✅ Environment variables properly configured

---

## Next Steps After Phase 1

Once Phase 1 infrastructure validation passes:

1. **Phase 2:** Functional Testing (6-8 hours post-deployment)
   - API endpoint functionality
   - User authentication flow
   - Tenant isolation & RLS validation
   - Payment processing workflow

2. **Phase 3:** Stability & Performance (Day 1)
   - Load testing
   - Error handling validation
   - Response time monitoring
   - Database query optimization

3. **Phase 4:** Operational Handoff (Day 2+)
   - Monitoring setup
   - Alert configuration
   - Documentation review
   - Team training

---

## Notes & Considerations

- Tests use Vitest's native async/await support for clean, readable test code
- All network timeouts default to 10s (configurable in vitest.config.ts)
- Tests are non-destructive and read-only where possible
- Database health checks use read-only queries
- Stripe tests use API key validation only (no transactions)
- Test results are saved to `test-results.json` and `test-results.html`

---

## Review & Approval

**Test Suite Created:** 2026-04-28  
**Total Tests:** 24  
**Coverage:** Infrastructure, Health, Database, Supabase, Stripe, Environment  
**Status:** ✅ Ready for User Review & Approval

Please review the test suite structure, categories, and individual tests above. Once approved, execute with:

```bash
npm run test:phase1
```

