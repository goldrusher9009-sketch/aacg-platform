# AACG Superadmin Portal - GitHub Deployment Instructions

## Overview

Your superadmin portal is ready to deploy to GitHub Pages! A fully automated deployment script has been created to push all files and set up your repository.

## What's Included

### Files Created
1. **push-to-github.sh** - Automated deployment script
2. **DEPLOYMENT-INSTRUCTIONS.md** - This file
3. **superadmin-portal.html** - The portal application (already created)

### What the Script Does
- Creates a git repository with proper configuration
- Adds README.md (comprehensive documentation)
- Adds index.html (your superadmin portal)
- Creates an initial commit with descriptive message
- Adds GitHub remote pointing to your repository
- Pushes all files to the main branch on GitHub
- Guides you through enabling GitHub Pages

## Deployment Steps

### Step 1: Prepare Your Environment

Open a terminal/command prompt on your computer. You'll need:
- Git installed on your system
- A GitHub Personal Access Token (if you haven't created one already)

**To create a Personal Access Token:**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name like "AACG Deployment"
4. Select scopes: `repo` (full control of private repositories)
5. Click "Generate token"
6. Copy the token and save it somewhere safe (you'll need it in Step 2)

### Step 2: Run the Deployment Script

Navigate to the folder where you saved `push-to-github.sh` and run:

**On macOS/Linux:**
```bash
chmod +x push-to-github.sh
./push-to-github.sh
```

**On Windows (PowerShell):**
```powershell
bash push-to-github.sh
```

**On Windows (Git Bash):**
```bash
./push-to-github.sh
```

### Step 3: Provide GitHub Authentication

When prompted by the script:
- **Username:** Your GitHub username (e.g., `goldrusher9009-sketch`)
- **Password:** Your Personal Access Token (from Step 1)

The script will then push your files to GitHub.

### Step 4: Enable GitHub Pages

After the script completes successfully:

1. Open https://github.com/goldrusher9009-sketch/aacg-superadmin/settings/pages
2. Under "Build and deployment":
   - **Source:** Select "Deploy from a branch"
   - **Branch:** Select "main"
   - **Folder:** Select "/ (root)"
3. Click "Save"

GitHub Pages will now build and deploy your portal. This typically takes 30-60 seconds.

### Step 5: Verify Deployment

Your portal is now live at:
```
https://goldrusher9009-sketch.github.io/aacg-superadmin/
```

You should see:
- The AACG Superadmin Portal heading
- A message about credentials not being configured (expected on first load)

## Configuring Supabase Credentials

Once your portal is deployed, you need to set your Supabase credentials:

1. Visit: https://goldrusher9009-sketch.github.io/aacg-superadmin/
2. Open your browser's Developer Console:
   - Windows/Linux: Press `F12`
   - macOS: Press `Cmd + Option + J`
3. In the Console tab, paste these commands (with your actual values):

```javascript
localStorage.setItem('SB_URL', 'https://your-project.supabase.co');
localStorage.setItem('SB_KEY', 'your-anon-key-here');
```

Replace:
- `your-project` with your actual Supabase project name
- `your-anon-key-here` with your Supabase anon public key

4. Press Enter to execute
5. Refresh the page (`Ctrl+R` or `Cmd+R`)

You should now see a success message with "✓ Connected to Supabase".

## Troubleshooting

### "Command not found: bash"
You need to install Git for Windows, which includes bash.
- Download from: https://git-scm.com/download/win
- Run the installer
- Try the script again

### "Permission denied" (on macOS/Linux)
Make the script executable:
```bash
chmod +x push-to-github.sh
./push-to-github.sh
```

### "fatal: Authentication failed"
Your Personal Access Token is incorrect or expired:
1. Create a new token at https://github.com/settings/tokens
2. Copy it carefully (no spaces before/after)
3. Try running the script again

### Portal shows "Credentials not configured"
You haven't set the Supabase credentials yet:
1. Follow the "Configuring Supabase Credentials" section above
2. Make sure to use your actual Supabase URL and anon key
3. Refresh the page

### Portal doesn't load at all
1. Check that GitHub Pages is enabled (Settings → Pages)
2. Verify the branch is set to "main" and folder is "/" (root)
3. Check that GitHub Actions completed successfully (Actions tab)
4. Wait a minute and refresh again

## File Structure

After deployment, your GitHub repository will contain:

```
aacg-superadmin/
├── README.md
└── index.html
```

- **README.md**: Complete documentation for the portal
- **index.html**: The actual superadmin portal application

## Security Summary

✅ **What's Secure:**
- Private GitHub repository (not searchable, requires access)
- HTTPS encryption (enforced by GitHub Pages)
- No credentials stored in code
- All actions are logged to Supabase

⚠️ **Important:**
- Supabase credentials are stored only in your browser's localStorage
- Anyone with the portal URL can see the interface, but cannot interact without credentials
- Only share the portal URL with trusted team members

## Next Steps

1. **Deploy:** Run the script following the steps above
2. **Configure:** Set your Supabase credentials in the browser console
3. **Test:** Verify you can access the portal and connect to Supabase
4. **Use:** Start using your superadmin portal

## Updating the Portal

To update the portal in the future:

1. Edit `index.html` in the repository (via GitHub web interface or git)
2. Commit and push the changes to the `main` branch
3. GitHub Pages will automatically rebuild within seconds
4. Refresh your browser to see the changes

## Need Help?

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the full README.md in the GitHub repository
3. Check GitHub Pages status at https://www.githubstatus.com/

## Quick Reference

| Item | URL/Location |
|------|--------------|
| GitHub Repository | https://github.com/goldrusher9009-sketch/aacg-superadmin |
| Portal URL | https://goldrusher9009-sketch.github.io/aacg-superadmin/ |
| Pages Settings | https://github.com/goldrusher9009-sketch/aacg-superadmin/settings/pages |
| Personal Access Tokens | https://github.com/settings/tokens |

---

**Deployment Script Version**: 1.0
**Created**: 2026-05-16
**Status**: Ready for deployment ✓
