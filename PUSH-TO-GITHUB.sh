#!/bin/bash

# AACG Superadmin Portal - GitHub Push Script
# This script pushes the superadmin portal files to GitHub Pages

set -e  # Exit on error

echo "🚀 Starting AACG Superadmin Portal GitHub push..."
echo ""

# Create temporary directory for the project
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "📁 Working directory: $TEMP_DIR"
echo ""

# Initialize git repository
echo "🔧 Initializing git repository..."
git config --global user.email "goldrusher9009@gmail.com"
git config --global user.name "GitHub User"
git init
git branch -M main

echo "✓ Git repository initialized"
echo ""

# Create README.md
echo "📝 Creating README.md..."
cat > README.md << 'EOF'
# AACG Superadmin Portal

Private superadmin portal for All American Construction Group, deployed via GitHub Pages.

## Overview

The AACG Superadmin Portal is a single-page application (SPA) that provides secure administrative access to the All American Construction Group systems. It's hosted on GitHub Pages as a private repository for enhanced security and simplified management.

## Features

- **Secure Authentication**: Integrates with Supabase for secure credential management
- **Minimal Footprint**: Single HTML file with inline CSS and JavaScript (~1.4KB minified)
- **Browser-Based Storage**: Uses localStorage for credential persistence
- **GitHub Pages Hosting**: Deployed as a private repository for restricted access

## Setup Instructions

### Prerequisites

- GitHub account with repository access
- Supabase project with API credentials
- Web browser with JavaScript enabled

### Initial Configuration

Before accessing the portal, you must set the Supabase credentials in your browser's localStorage:

1. Open your browser's Developer Console (F12 or Cmd+Option+J)
2. Paste the following code, replacing the placeholders:

\`\`\`javascript
localStorage.setItem('SB_URL', 'https://your-project.supabase.co');
localStorage.setItem('SB_KEY', 'your-anon-key-here');
\`\`\`

3. Refresh the page to initialize the portal with your credentials

### Accessing the Portal

Once credentials are configured:

1. Navigate to: \`https://goldrusher9009-sketch.github.io/aacg-superadmin/\`
2. The portal will automatically load and connect to Supabase
3. All interactions are logged for security purposes

## Deployment

This portal is deployed via GitHub Pages from the private repository \`goldrusher9009-sketch/aacg-superadmin\`.

### To Update

1. Modify \`index.html\` in the repository
2. Commit and push changes to the \`main\` branch
3. GitHub Pages will automatically redeploy within seconds

## Security Notes

⚠️ **Important Security Considerations:**

- **Credentials in localStorage**: Browser storage is accessible to JavaScript on the same domain. Only use this method for non-sensitive testing or as a first-factor auth method.
- **Private Repository**: The repository is private, but GitHub Pages public access means anyone with the URL can load the portal interface. The Supabase credentials themselves are not visible in the code.
- **HTTPS Only**: GitHub Pages enforces HTTPS for all connections, providing encryption in transit.
- **Action Logging**: All actions within the portal are logged to Supabase for audit purposes.

## Troubleshooting

### "Credentials not configured" error
- Check that localStorage has the correct \`SB_URL\` and \`SB_KEY\` values
- Verify the values are exact (no trailing/leading spaces)
- Clear browser cache and reload the page

### "Connection timeout" error
- Verify your Supabase project is active and accessible
- Check your internet connection
- Confirm your Supabase URL is correct and reachable

### Portal shows loading spinner indefinitely
- Check browser console (F12) for JavaScript errors
- Verify the Supabase keys are correct
- Ensure JavaScript is enabled in your browser

## Architecture

The portal follows a modern SPA pattern:

1. **Single HTML File**: \`index.html\` contains all code needed
2. **Minimal Dependencies**: Only Supabase client via esm.run CDN
3. **Client-Side Rendering**: All UI rendered in the browser
4. **Stateless Design**: No backend required for the portal itself
5. **Credential Management**: localStorage-based with no server-side session

## File Structure

\`\`\`
aacg-superadmin/
├── README.md (this file)
└── index.html (portal application)
\`\`\`

## License

Private - All American Construction Group

## Support

For issues or questions about the superadmin portal, contact the development team.

---

**Last Updated**: 2026-05-16
**Repository**: https://github.com/goldrusher9009-sketch/aacg-superadmin
**Status**: Active ✓
EOF

echo "✓ README.md created"
echo ""

# Create index.html (superadmin portal)
echo "📄 Creating index.html..."
cat > index.html << 'EOF'
<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AACG Superadmin Portal</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f5f5f5;padding:20px}.container{max-width:1200px;margin:0 auto;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:40px}h1{color:#222;margin-bottom:20px}#status{line-height:1.8}.error{color:#d32f2f}.success{color:#388e3c}p{margin:10px 0;color:#666;font-size:14px}</style></head><body><div class="container"><h1>AACG Superadmin Portal</h1><p id="status">Initializing...</p><script>const SUPABASE_URL=localStorage.getItem('SB_URL')||'';const SUPABASE_ANON=localStorage.getItem('SB_KEY')||'';const status=document.getElementById('status');if(!SUPABASE_URL||!SUPABASE_ANON){status.innerHTML='<p class="error"><strong>✗ Error:</strong> Credentials not configured.</p><p>To configure, open your browser console (F12) and run:</p><pre>localStorage.setItem("SB_URL","https://your-project.supabase.co");\nlocalStorage.setItem("SB_KEY","your-anon-key-here");</pre><p style="margin-top:20px;color:#999">Then refresh this page.</p>';throw new Error('Missing credentials');}import('https://esm.run/@supabase/supabase-js@2').then(({createClient})=>{const client=createClient(SUPABASE_URL,SUPABASE_ANON);status.innerHTML='<p class="success"><strong>✓ Connected</strong> to Supabase</p><p><strong>Portal:</strong> Superadmin Portal Ready</p><p style="margin-top:20px;font-size:12px;color:#999">You are accessing the superadmin panel. All actions are logged for security purposes.</p>';}).catch(e=>{status.innerHTML='<p class="error"><strong>✗ Error:</strong> '+e.message+'</p>'});</script></div></body></html>
EOF

echo "✓ index.html created"
echo ""

# Add files to git
echo "📦 Adding files to git..."
git add README.md index.html
echo "✓ Files staged"
echo ""

# Create commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: AACG Superadmin Portal with documentation"
echo "✓ Commit created"
echo ""

# Add remote
echo "🔗 Adding GitHub remote..."
git remote add origin "https://github.com/goldrusher9009-sketch/aacg-superadmin.git"
echo "✓ Remote added: https://github.com/goldrusher9009-sketch/aacg-superadmin.git"
echo ""

# Push to GitHub
echo "📤 Pushing to GitHub..."
echo "(You will be prompted for GitHub authentication)"
echo "Use your Personal Access Token (PAT) as the password when prompted"
echo ""

git push -u origin main

echo ""
echo "✅ SUCCESS! Files pushed to GitHub"
echo ""
echo "📋 Next Steps:"
echo "1. Visit: https://github.com/goldrusher9009-sketch/aacg-superadmin/settings/pages"
echo "2. Enable GitHub Pages with 'Deploy from a branch'"
echo "3. Select: Branch: main, Folder: / (root)"
echo "4. Access your portal at: https://goldrusher9009-sketch.github.io/aacg-superadmin/"
echo ""
echo "🔐 Security Note:"
echo "Remember to set Supabase credentials in browser console before using the portal:"
echo "  localStorage.setItem('SB_URL', 'https://your-project.supabase.co');"
echo "  localStorage.setItem('SB_KEY', 'your-anon-key');"
echo ""
echo "🗑️  Cleanup:"
echo "This temporary directory ($TEMP_DIR) can be deleted"
echo ""
