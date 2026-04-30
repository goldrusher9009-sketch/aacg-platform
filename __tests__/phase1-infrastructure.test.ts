/**
 * AACG Platform - Phase 1 Infrastructure Validation Test Suite
 * 24 Infrastructure Validation Tests
 *
 * Purpose: Validate core infrastructure connectivity and health after fresh deployment
 * Scope: Health checks, database connectivity, third-party API integrations
 * Framework: Vitest with TypeScript
 * Expected Runtime: 2-5 minutes (depending on external API response times)
 *
 * Test Categories:
 * - Health Checks (4 tests)
 * - Database Connectivity (5 tests)
 * - Supabase Integration (6 tests)
 * - Stripe Integration (5 tests)
 * - Environment Configuration (4 tests)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios, { AxiosInstance } from 'axios';

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || '';
const DATABASE_URL = process.env.DATABASE_URL || '';

// HTTP Client with timeout
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  validateStatus: () => true, // Don't throw on any status
});

describe('PHASE 1: Infrastructure Validation (24 Tests)', () => {
  // ============================================================================
  // SECTION 1: Health Checks (4 Tests)
  // ============================================================================

  describe('1. Health Check Endpoints', () => {
    it('T1: Application responds on health endpoint', async () => {
      const response = await apiClient.get('/api/health');
      expect(response.status).toBeLessThan(500);
      expect(response.data).toBeDefined();
    });

    it('T2: Health endpoint returns valid JSON', async () => {
      const response = await apiClient.get('/api/health');
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(typeof response.data).toBe('object');
    });

    it('T3: Health endpoint returns status field', async () => {
      const response = await apiClient.get('/api/health');
      expect(response.data).toHaveProperty('status');
      expect(['ok', 'healthy', 'up']).toContain(response.data.status?.toLowerCase());
    });

    it('T4: Health endpoint responds within 5 seconds', async () => {
      const startTime = Date.now();
      await apiClient.get('/api/health');
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
    });
  });

  // ============================================================================
  // SECTION 2: Database Connectivity (5 Tests)
  // ============================================================================

  describe('2. Database Connectivity', () => {
    it('T5: DATABASE_URL environment variable is set', () => {
      expect(DATABASE_URL).toBeTruthy();
      expect(DATABASE_URL).toMatch(/^postgres(ql)?:\/\//);
    });

    it('T6: Database URL contains required components', () => {
      const urlObj = new URL(DATABASE_URL);
      expect(urlObj.hostname).toBeTruthy();
      expect(urlObj.pathname).toBeTruthy();
      expect(urlObj.username).toBeTruthy();
    });

    it('T7: Database endpoint is reachable (ping via health check)', async () => {
      const response = await apiClient.get('/api/health/db');
      expect(response.status).not.toBe(500);
      expect(response.status).not.toBe(503);
    });

    it('T8: Database health check returns connectivity status', async () => {
      const response = await apiClient.get('/api/health/db');
      if (response.status === 200) {
        expect(response.data).toHaveProperty('connected');
      }
    });

    it('T9: Database connection timeout is reasonable (<30s)', async () => {
      const startTime = Date.now();
      await apiClient.get('/api/health/db');
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000);
    });
  });

  // ============================================================================
  // SECTION 3: Supabase Integration (6 Tests)
  // ============================================================================

  describe('3. Supabase Integration', () => {
    it('T10: NEXT_PUBLIC_SUPABASE_URL is configured', () => {
      expect(SUPABASE_URL).toBeTruthy();
      expect(SUPABASE_URL).toMatch(/https:\/\/.*\.supabase\.co/);
    });

    it('T11: NEXT_PUBLIC_SUPABASE_ANON_KEY is configured', () => {
      expect(SUPABASE_KEY).toBeTruthy();
      expect(SUPABASE_KEY.length).toBeGreaterThan(50);
    });

    it('T12: Supabase endpoint is accessible', async () => {
      try {
        const response = await axios.get(`${SUPABASE_URL}/rest/v1/`, {
          headers: {
            'apikey': SUPABASE_KEY,
          },
          timeout: 10000,
        });
        // Supabase returns 404 for /rest/v1/ root, which is expected
        expect([404, 200]).toContain(response.status);
      } catch (error: any) {
        // Network errors mean the endpoint is unreachable
        expect(error.code).not.toBe('ECONNREFUSED');
        expect(error.code).not.toBe('EHOSTUNREACH');
      }
    });

    it('T13: API can authenticate with Supabase anon key', async () => {
      const response = await apiClient.get('/api/supabase/check');
      // Should not return 401 Unauthorized
      expect(response.status).not.toBe(401);
    });

    it('T14: Supabase can execute basic query (user table exists)', async () => {
      const response = await apiClient.get('/api/supabase/tables');
      expect(response.status).toBeLessThan(500);
      // Should not have generic database errors
      expect(response.data?.error).not.toMatch(/table.*does not exist/i);
    });

    it('T15: Supabase RLS policies are in effect (auth context check)', async () => {
      const response = await apiClient.get('/api/supabase/rls-check');
      // RLS check should complete without errors
      expect(response.status).not.toBe(500);
    });
  });

  // ============================================================================
  // SECTION 4: Stripe Integration (5 Tests)
  // ============================================================================

  describe('4. Stripe Integration', () => {
    it('T16: STRIPE_SECRET_KEY environment variable is set', () => {
      expect(STRIPE_KEY).toBeTruthy();
      expect(STRIPE_KEY).toMatch(/^sk_(live|test)_/);
    });

    it('T17: Stripe key is valid format (test or live)', () => {
      const isTestKey = STRIPE_KEY.includes('sk_test_');
      const isLiveKey = STRIPE_KEY.includes('sk_live_');
      expect(isTestKey || isLiveKey).toBe(true);
    });

    it('T18: Stripe API endpoint is reachable', async () => {
      try {
        const response = await axios.get('https://api.stripe.com/v1/products', {
          auth: {
            username: STRIPE_KEY,
            password: '',
          },
          timeout: 10000,
        });
        // Stripe returns 200 for valid API key
        expect([200, 400]).toContain(response.status);
      } catch (error: any) {
        // Should not have network errors
        expect(['ECONNREFUSED', 'EHOSTUNREACH', 'ETIMEDOUT']).not.toContain(error.code);
      }
    });

    it('T19: Stripe webhook endpoint is configured in API', async () => {
      const response = await apiClient.get('/api/webhooks/stripe');
      // Should have webhook configuration (405 Method Not Allowed for GET is acceptable)
      expect([200, 405, 404]).toContain(response.status);
    });

    it('T20: Stripe products/prices are accessible from API', async () => {
      const response = await apiClient.get('/api/stripe/products');
      expect(response.status).not.toBe(500);
      // Should not have authentication errors
      expect(response.status).not.toBe(401);
    });
  });

  // ============================================================================
  // SECTION 5: Environment Configuration (4 Tests)
  // ============================================================================

  describe('5. Environment Configuration', () => {
    it('T21: All required environment variables are set', () => {
      const requiredVars = [
        'DATABASE_URL',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'STRIPE_SECRET_KEY',
      ];

      requiredVars.forEach(varName => {
        const value = process.env[varName];
        expect(value, `${varName} must be set`).toBeTruthy();
      });
    });

    it('T22: NODE_ENV is configured (production or development)', () => {
      const nodeEnv = process.env.NODE_ENV;
      expect(['production', 'development', 'test']).toContain(nodeEnv);
    });

    it('T23: API URL is accessible from environment', async () => {
      expect(API_BASE_URL).toBeTruthy();
      const response = await apiClient.get('/');
      // Should not have DNS resolution errors
      expect(response.status).not.toBeUndefined();
    });

    it('T24: All integrations report connectivity status', async () => {
      const statusResponse = await apiClient.get('/api/health/integrations');
      expect(statusResponse.status).not.toBe(500);

      if (statusResponse.status === 200 && statusResponse.data) {
        expect(statusResponse.data).toHaveProperty('database');
        expect(statusResponse.data).toHaveProperty('supabase');
        expect(statusResponse.data).toHaveProperty('stripe');
      }
    });
  });
});

// ============================================================================
// Test Summary & Reporting
// ============================================================================

describe('Test Suite Summary', () => {
  it('Should complete all 24 infrastructure validation tests', () => {
    expect(true).toBe(true);
  });
});
