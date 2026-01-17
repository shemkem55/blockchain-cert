#!/bin/bash

# Render Backend Configuration Verification Script
# This script checks if all components are properly configured

echo "🔍 Blockchain Certificate System - Configuration Verification"
echo "=============================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} $2 (Missing: $1)"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} $2 (Missing: $1)"
        return 1
    fi
}

check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $3"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $3 (Not found in $1)"
        return 1
    fi
}

# Counter for issues
ISSUES=0

echo "📁 File Structure Check"
echo "----------------------"
check_file "render.yaml" "Render configuration file" || ((ISSUES++))
check_file "netlify.toml" "Netlify configuration file" || ((ISSUES++))
check_file "certificate-backend/server.js" "Backend server file" || ((ISSUES++))
check_file "certificate-backend/config/db-pg.js" "PostgreSQL adapter" || ((ISSUES++))
check_file "certificate-backend/config/models-pg.js" "PostgreSQL models" || ((ISSUES++))
check_file "certificate-backend/package.json" "Backend package.json" || ((ISSUES++))
check_file "frontend v2/vite.config.ts" "Frontend Vite config" || ((ISSUES++))
check_dir "certificate-backend/artifacts" "Backend artifacts directory" || ((ISSUES++))
echo ""

echo "🔧 Backend Configuration Check"
echo "------------------------------"
check_content "render.yaml" "DB_TYPE" "Database type configured" || ((ISSUES++))
check_content "render.yaml" "postgres" "PostgreSQL selected" || ((ISSUES++))
check_content "certificate-backend/package.json" "pg" "PostgreSQL driver installed" || ((ISSUES++))
check_content "certificate-backend/server.js" "db-pg" "PostgreSQL adapter imported" || ((ISSUES++))
echo ""

echo "🌐 Frontend Configuration Check"
echo "-------------------------------"
check_content "netlify.toml" "blockchain-cert-backend.onrender.com" "Render backend URL configured" || ((ISSUES++))
check_content "netlify.toml" "/auth/*" "Auth API redirect configured" || ((ISSUES++))
check_content "netlify.toml" "/certificates/*" "Certificates API redirect configured" || ((ISSUES++))
check_content "frontend v2/vite.config.ts" "localhost:3000" "Local dev proxy configured" || ((ISSUES++))
echo ""

echo "📦 Dependencies Check"
echo "--------------------"
cd certificate-backend
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Backend node_modules exists"
    if [ -d "node_modules/pg" ]; then
        echo -e "${GREEN}✓${NC} PostgreSQL driver (pg) installed"
    else
        echo -e "${RED}✗${NC} PostgreSQL driver (pg) not installed"
        ((ISSUES++))
    fi
else
    echo -e "${YELLOW}⚠${NC} Backend node_modules not found (run: npm install)"
    ((ISSUES++))
fi
cd ..

cd "frontend v2"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Frontend node_modules exists"
else
    echo -e "${YELLOW}⚠${NC} Frontend node_modules not found (run: npm install)"
    ((ISSUES++))
fi
cd ..
echo ""

echo "🔐 Environment Variables Check"
echo "------------------------------"
if [ -f "certificate-backend/.env" ]; then
    echo -e "${GREEN}✓${NC} Backend .env file exists"
    
    # Check for required variables
    if grep -q "DB_TYPE" certificate-backend/.env; then
        DB_TYPE=$(grep "DB_TYPE" certificate-backend/.env | cut -d '=' -f2)
        echo -e "${GREEN}✓${NC} DB_TYPE is set to: $DB_TYPE"
    else
        echo -e "${YELLOW}⚠${NC} DB_TYPE not set in .env"
    fi
    
    if grep -q "JWT_SECRET" certificate-backend/.env; then
        echo -e "${GREEN}✓${NC} JWT_SECRET is configured"
    else
        echo -e "${YELLOW}⚠${NC} JWT_SECRET not set (required for production)"
    fi
else
    echo -e "${YELLOW}⚠${NC} Backend .env file not found (OK for production, required for local dev)"
fi
echo ""

echo "⛓️  Blockchain Artifacts Check"
echo "------------------------------"
check_file "certificate-backend/artifacts/deployed_address.json" "Deployed contract address" || ((ISSUES++))
check_file "certificate-backend/artifacts/SoulboundCertificate.json" "Contract ABI" || ((ISSUES++))
echo ""

echo "=============================================================="
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Configuration looks good.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Deploy backend to Render (push to GitHub)"
    echo "2. Set environment variables in Render dashboard"
    echo "3. Deploy frontend to Netlify"
    echo "4. Test the application"
else
    echo -e "${YELLOW}⚠️  Found $ISSUES issue(s) that need attention.${NC}"
    echo ""
    echo "Please review the items marked with ✗ or ⚠ above."
    echo "See RENDER_BACKEND_SETUP.md for detailed instructions."
fi
echo ""
