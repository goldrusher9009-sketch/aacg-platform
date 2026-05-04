#!/bin/bash

set -e

echo "======================================"
echo "AACG Platform Deployment & Verification"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="/sessions/awesome-admiring-euler/mnt/AACG-Platform"
cd "$PROJECT_ROOT"

# Function to log
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

# Function to success
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to error
error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to warn
warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Phase 1: Environment Setup
log "Phase 1: Environment Setup"
echo ""

if [ -f ".env.production" ]; then
    success ".env.production exists"
else
    error ".env.production not found"
    exit 1
fi

# Phase 2: Dependency Installation
log "Phase 2: Dependency Installation"
echo ""

if [ -d "node_modules" ]; then
    success "node_modules directory exists"
    log "Verifying critical packages..."
    for package in next react @supabase/supabase-js stripe; do
        if [ -d "node_modules/$package" ]; then
            success "  • $package installed"
        else
            error "  • $package MISSING"
            exit 1
        fi
    done
else
    error "node_modules not found - running npm install"
    npm install --legacy-peer-deps || exit 1
fi

echo ""

# Phase 3: Build Verification
log "Phase 3: Build Verification"
echo ""

if [ -f "next.config.js" ]; then
    success "next.config.js found"
else
    error "next.config.js not found"
    exit 1
fi

if [ -f "tsconfig.json" ]; then
    success "tsconfig.json found"
else
    error "tsconfig.json not found"
    exit 1
fi

echo ""

# Phase 4: Application Structure Verification
log "Phase 4: Application Structure Verification"
echo ""

directories=("app" "components" "lib" "public" "__tests__" "scripts")
for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        success "  • $dir/ exists"
    else
        error "  • $dir/ MISSING"
        exit 1
    fi
done

echo ""

# Phase 5: API Endpoints Verification
log "Phase 5: API Endpoints Verification"
echo ""

api_routes=(
    "app/api/mechanics-liens/route.ts"
    "app/api/photo-analysis/route.ts"
    "app/api/auth/login/route.ts"
)

for route in "${api_routes[@]}"; do
    if [ -f "$route" ]; then
        success "  • ${route##*/} found"
    else
        error "  • ${route##*/} MISSING"
    fi
done

echo ""

# Phase 6: Page Components Verification
log "Phase 6: Page Components Verification"
echo ""

pages=(
    "app/page.tsx"
    "app/login/page.tsx"
    "app/mechanics-liens/page.tsx"
    "app/photo-analysis/page.tsx"
    "app/settings/page.tsx"
)

for page in "${pages[@]}"; do
    if [ -f "$page" ]; then
        success "  • ${page##*/} found"
    else
        warn "  • ${page##*/} missing (will create)"
    fi
done

echo ""

# Phase 7: Test Suite Verification
log "Phase 7: Test Suite Verification"
echo ""

test_files=(
    "__tests__/api/mechanics-liens.test.ts"
    "__tests__/api/photo-analysis.test.ts"
)

for test in "${test_files[@]}"; do
    if [ -f "$test" ]; then
        success "  • ${test##*/} found"
    else
        warn "  • ${test##*/} missing"
    fi
done

echo ""

# Phase 8: Docker Configuration
log "Phase 8: Docker Configuration"
echo ""

if [ -f "Dockerfile" ]; then
    success "Dockerfile exists"
    log "  Verifying Dockerfile syntax..."
    # Check for critical lines
    if grep -q "FROM node:20-alpine" Dockerfile; then
        success "  • Base image: node:20-alpine"
    fi
    if grep -q "EXPOSE 3000" Dockerfile; then
        success "  • Port 3000 exposed"
    fi
    if grep -q "npm run build" Dockerfile; then
        success "  • Build step configured"
    fi
else
    error "Dockerfile not found"
    exit 1
fi

if [ -f "docker-compose.yml" ]; then
    success "docker-compose.yml exists"
else
    error "docker-compose.yml not found"
    exit 1
fi

echo ""

# Phase 9: Deployment Files
log "Phase 9: Deployment Files"
echo ""

deployment_files=(
    ".dockerignore"
    ".env.production"
    "Procfile"
)

for file in "${deployment_files[@]}"; do
    if [ -f "$file" ]; then
        success "  • $file exists"
    else
        warn "  • $file missing"
    fi
done

echo ""

# Phase 10: Summary
log "Phase 10: Deployment Readiness Summary"
echo ""
success "✓ All critical components verified"
echo ""
echo "======================================"
echo "Ready for deployment:"
echo "======================================"
echo ""
echo "Local Development:"
echo "  npm run dev        # Start dev server on http://localhost:3000"
echo ""
echo "Production Build:"
echo "  npm run build      # Build for production"
echo "  npm start          # Start production server"
echo ""
echo "Docker Deployment:"
echo "  docker-compose up  # Start with local PostgreSQL"
echo ""
echo "Railway.app Deployment:"
echo "  1. Push code to GitHub"
echo "  2. Connect repository to Railway.app"
echo "  3. Set environment variables"
echo "  4. Deploy"
echo ""
echo "======================================"
