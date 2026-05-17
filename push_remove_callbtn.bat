@echo off
cd /d "C:\Users\teste\Downloads\AACG-Platform"
del /f .git\index.lock 2>nul
del /f .git\HEAD.lock 2>nul
git add aacg-website.html
git commit -m "Remove floating Call Us button from homepage"
git push origin main
echo.
echo Done! Railway deploying now (~2 min).
pause
