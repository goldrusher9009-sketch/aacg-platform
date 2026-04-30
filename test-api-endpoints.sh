#!/bin/bash

# AACG Platform API Endpoint Test Suite
# Tests all critical API endpoints for functionality

set -e

BASE_URL="${1:-http://localhost:3000}"
PASSED=0
FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================"
echo "AACG Platform API Endpoint Tests"
echo "========================================"
echo "Base URL: $BASE_URL"
echo ""

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local data=$4
    local description=$5

    echo -n "Testing $description... "

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$status" = "$expected_status" ] || [ "$status" = "200" ] || [ "$status" = "201" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status)"
        echo "Response: $body"
        ((FAILED++))
        return 1
    fi
}

# Health Check
echo -e "${BLUE}=== Health Check ===${NC}"
test_endpoint "GET" "/api/health" "200" "" "Health endpoint"
echo ""

# Mechanics Liens Endpoints
echo -e "${BLUE}=== Mechanics Liens Endpoints ===${NC}"
test_endpoint "GET" "/api/mechanics-liens?page=1&limit=10" "200" "" "GET all liens"
test_endpoint "GET" "/api/mechanics-liens?page=1&limit=10&status=draft" "200" "" "GET liens filtered by status"
test_endpoint "GET" "/api/mechanics-liens?page=1&limit=10&company_id=comp_1" "200" "" "GET liens filtered by company"

create_lien_data='{
  "contractor_id": "CONT_TEST_001",
  "property_address": "123 Test St, New York, NY 10001",
  "lien_amount": 45000,
  "filing_date": "2026-04-29",
  "company_id": "comp_test_001"
}'

test_endpoint "POST" "/api/mechanics-liens" "201" "$create_lien_data" "POST create new lien"
echo ""

# Photo Analysis Endpoints
echo -e "${BLUE}=== Photo Analysis Endpoints ===${NC}"
test_endpoint "GET" "/api/photo-analysis?page=1&limit=10" "200" "" "GET all analyses"
test_endpoint "GET" "/api/photo-analysis?page=1&limit=10&status=completed" "200" "" "GET analyses filtered by status"
test_endpoint "GET" "/api/photo-analysis?page=1&limit=10&project_id=proj_test" "200" "" "GET analyses filtered by project"

create_analysis_data='{
  "photo_url": "https://example.com/test-photo.jpg",
  "analysis_type": "damage",
  "project_id": "proj_test_001"
}'

test_endpoint "POST" "/api/photo-analysis" "201" "$create_analysis_data" "POST create new analysis"
echo ""

# Authentication Endpoints
echo -e "${BLUE}=== Authentication Endpoints ===${NC}"
login_data='{
  "email": "test@example.com",
  "password": "test_password_123"
}'

test_endpoint "POST" "/api/auth/login" "200" "$login_data" "POST login endpoint"
echo ""

# Summary
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
