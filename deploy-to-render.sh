#!/bin/bash

# Quick Deploy Script for Render Backend
# This script helps prepare and deploy the backend to Render

echo "🚀 Render Backend Deployment Helper"
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to prompt for confirmation
confirm() {
    read -p "$1 (y/n): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo -e "${RED}Error: render.yaml not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo "📋 Pre-Deployment Checklist"
echo "---------------------------"
echo ""

# Run verification
echo "Running configuration verification..."
./verify-config.sh
echo ""

# Check git status
echo "🔍 Checking Git Status"
echo "---------------------"

if [ -d ".git" ]; then
    BRANCH=$(git branch --show-current)
    echo -e "${BLUE}Current branch:${NC} $BRANCH"
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        echo -e "${YELLOW}⚠ You have uncommitted changes${NC}"
        echo ""
        git status --short
        echo ""
        
        if confirm "Do you want to commit these changes?"; then
            read -p "Enter commit message: " COMMIT_MSG
            git add .
            git commit -m "$COMMIT_MSG"
            echo -e "${GREEN}✓ Changes committed${NC}"
        fi
    else
        echo -e "${GREEN}✓ No uncommitted changes${NC}"
    fi
    
    # Check remote
    REMOTE=$(git remote get-url origin 2>/dev/null)
    echo -e "${BLUE}Remote:${NC} $REMOTE"
    
    # Check if we're ahead of remote
    if git status | grep -q "Your branch is ahead"; then
        echo -e "${YELLOW}⚠ Your local branch is ahead of remote${NC}"
        
        if confirm "Do you want to push to GitHub?"; then
            echo "Pushing to GitHub..."
            git push origin $BRANCH
            echo -e "${GREEN}✓ Pushed to GitHub${NC}"
            echo ""
            echo -e "${GREEN}🎉 Render will automatically deploy from GitHub!${NC}"
        fi
    else
        echo -e "${GREEN}✓ Local branch is up to date with remote${NC}"
    fi
else
    echo -e "${RED}✗ Not a git repository${NC}"
    exit 1
fi

echo ""
echo "📝 Environment Variables Reminder"
echo "---------------------------------"
echo ""
echo "Make sure these are set in Render Dashboard:"
echo ""
echo "Required Variables:"
echo "  • NODE_ENV=production"
echo "  • PORT=10000"
echo "  • DB_TYPE=postgres"
echo "  • JWT_SECRET=<strong-random-secret>"
echo "  • EMAIL_USER=<your-gmail>"
echo "  • EMAIL_PASSWORD=<gmail-app-password>"
echo "  • BLOCKCHAIN_RPC_URL=<sepolia-rpc-url>"
echo "  • BLOCKCHAIN_ADMIN_PRIVATE_KEY=<wallet-private-key>"
echo "  • GOOGLE_CLIENT_ID=<oauth-client-id>"
echo "  • CORS_ORIGINS=<frontend-urls>"
echo ""
echo "Note: DATABASE_URL is auto-set by Render"
echo ""

echo "🔧 Generate Secrets"
echo "------------------"
echo ""

if confirm "Generate a new JWT_SECRET?"; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo ""
    echo -e "${GREEN}Generated JWT_SECRET:${NC}"
    echo "$JWT_SECRET"
    echo ""
    echo "Copy this and add it to Render environment variables"
    echo ""
fi

echo "📚 Useful Links"
echo "--------------"
echo ""
echo "Render Dashboard:"
echo "  https://dashboard.render.com"
echo ""
echo "GitHub Repository:"
echo "  $REMOTE"
echo ""
echo "Documentation:"
echo "  • RENDER_BACKEND_SETUP.md - Complete setup guide"
echo "  • DEPLOYMENT_CHECKLIST.md - Deployment checklist"
echo "  • RENDER_CONFIGURATION_SUMMARY.md - Quick reference"
echo ""

echo "🎯 Next Steps"
echo "-------------"
echo ""
echo "1. Go to Render Dashboard: https://dashboard.render.com"
echo "2. Create new Web Service (or select existing)"
echo "3. Connect to GitHub repository: shemkem55/blockchain-cert"
echo "4. Render will auto-detect render.yaml"
echo "5. Add environment variables in Environment tab"
echo "6. Deploy!"
echo ""
echo "Monitor deployment:"
echo "  Dashboard → Your Service → Logs"
echo ""
echo "Test deployment:"
echo "  curl https://blockchain-cert-backend.onrender.com/health"
echo ""

if confirm "Open Render Dashboard in browser?"; then
    if command -v xdg-open > /dev/null; then
        xdg-open "https://dashboard.render.com" 2>/dev/null
    elif command -v open > /dev/null; then
        open "https://dashboard.render.com"
    else
        echo "Please open: https://dashboard.render.com"
    fi
fi

echo ""
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo ""
