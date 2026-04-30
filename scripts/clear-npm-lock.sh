#!/bin/bash

# BLOCKER FIX #2: NPM Process Lock Cleanup Script

echo "🔧 Clearing NPM process locks..."

# Kill any stuck npm processes
pkill -f "npm install" || true
pkill -f "node" || true

# Wait a moment
sleep 2

# Remove npm lock files
echo "Removing npm lock files..."
rm -f package-lock.json
rm -rf node_modules/.package-lock.json
rm -rf ~/.npm/_cacache/*

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

echo "✅ NPM locks cleared"
echo "Ready to run: npm install"
