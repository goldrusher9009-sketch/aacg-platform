#!/bin/bash

# BLOCKER FIX #1: Git Configuration Repair Script

echo "🔧 Fixing Git Configuration..."

cd "$(dirname "$0")/.." || exit 1

# Remove the lock file that's preventing edits
if [ -f ".git/config.lock" ]; then
  echo "Removing .git/config.lock..."
  rm -f .git/config.lock
fi

# Check current config
echo "Current git config (remote.origin.fetch):"
git config --get-all remote.origin.fetch

# Remove all corrupted fetch entries
echo "Clearing corrupted fetch entries..."
git config --unset-all remote.origin.fetch 2>/dev/null || true

# Set correct fetch configuration
echo "Setting correct fetch configuration..."
git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'

# Verify fix
echo ""
echo "✅ Git configuration fixed!"
echo "Remote origin fetch value:"
git config remote.origin.fetch

# Test git status
echo ""
echo "Testing git status..."
git status
