#!/bin/bash

# AACG Platform - Phase 1 Infrastructure Validation Test Execution Script
# This script runs the 24 infrastructure validation tests against the Railway deployment

set -e

echo "=========================================="
echo "AACG Platform - Phase 1 Test Suite"
echo "Infrastructure Validation (24 Tests)"
echo "=========================================="
echo ""

# Step 1: Install dependencies
echo "Step 1: Installing dependencies..."
npm install --save-dev vitest @vitest/ui typescript @types/node axios

echo ""
echo "Step 2: Running Phase 1 infrastructure validation tests..."
echo ""

# Run the test suite with detailed output
npm run test:phase1

echo ""
echo "=========================================="
echo "Test Suite Execution Complete"
echo "=========================================="
echo ""
echo "Results Summary:"
echo "- Test file: __tests__/phase1-infrastructure.test.ts"
echo "- Framework: Vitest"
echo "- Total tests: 24"
echo "- Categories: Health Checks, Database, Supabase, Stripe, Environment"
echo ""
echo "For detailed results, check test-results.html"
