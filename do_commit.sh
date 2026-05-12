#!/bin/bash
cd /c/Users/teste/Downloads/AACG-Platform

# Remove corrupt index
rm -f .git/index

# Rebuild index from HEAD
git reset HEAD

# Stage the critical files
git add admin/index.html
git add superadmin/index.html
git add server.js
git add package.json

# Commit
git commit -m "fix: commit all code fixes - sbQuery helper, data-built guards, analytics freeze fix, server.js clean URLs"

# Push
git push origin main

echo "DONE: $?"
