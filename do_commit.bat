@echo off
cd /d "C:\Users\teste\Downloads\AACG-Platform"
git rebase --abort
git stash drop
git push origin main --force
