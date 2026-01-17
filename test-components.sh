#!/bin/bash

# Component Testing Script for Render Backend Setup
# This script tests all major components of the system

echo "🧪 Blockchain Certificate System - Component Testing"
echo "====================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test function
test_component() {
    local test_name="$1"
    local test_command="$2"
    
    echo -ne "${BLUE}Testing:${NC} $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

# Test with output
test_with_output() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}Testing:${NC} $test_name"
    
    local output
    output=$(eval "$test_command" 2>&1)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        echo "$output" | head -n 5
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "$output" | head -n 10
        ((FAILED++))
        return 1
    fi
    echo ""
}

echo "📦 1. Dependency Check"
echo "----------------------"
test_component "Node.js installed" "command -v node"
test_component "npm installed" "command -v npm"
test_component "git installed" "command -v git"
test_component "curl installed" "command -v curl"
echo ""

echo "📁 2. Project Structure"
echo "----------------------"
test_component "Backend directory exists" "[ -d 'certificate-backend' ]"
test_component "Frontend directory exists" "[ -d 'frontend v2' ]"
test_component "Blockchain directory exists" "[ -d 'certificate-verification.' ]"
test_component "render.yaml exists" "[ -f 'render.yaml' ]"
test_component "netlify.toml exists" "[ -f 'netlify.toml' ]"
echo ""

echo "🔧 3. Backend Configuration"
echo "---------------------------"
cd certificate-backend
test_component "package.json exists" "[ -f 'package.json' ]"
test_component "server.js exists" "[ -f 'server.js' ]"
test_component "PostgreSQL adapter exists" "[ -f 'config/db-pg.js' ]"
test_component "PostgreSQL models exist" "[ -f 'config/models-pg.js' ]"
test_component "SQLite adapter exists" "[ -f 'config/db-sqlite.js' ]"
test_component "pg package installed" "[ -d 'node_modules/pg' ]"
test_component "express package installed" "[ -d 'node_modules/express' ]"
test_component "ethers package installed" "[ -d 'node_modules/ethers' ]"
cd ..
echo ""

echo "🌐 4. Frontend Configuration"
echo "----------------------------"
cd "frontend v2"
test_component "package.json exists" "[ -f 'package.json' ]"
test_component "vite.config.ts exists" "[ -f 'vite.config.ts' ]"
test_component "index.html exists" "[ -f 'index.html' ]"
test_component "src directory exists" "[ -d 'src' ]"
test_component "react installed" "[ -d 'node_modules/react' ]"
test_component "vite installed" "[ -d 'node_modules/vite' ]"
cd ..
echo ""

echo "⛓️  5. Blockchain Artifacts"
echo "--------------------------"
test_component "Artifacts directory exists" "[ -d 'certificate-backend/artifacts' ]"
test_component "Deployed address exists" "[ -f 'certificate-backend/artifacts/deployed_address.json' ]"
test_component "Contract ABI exists" "[ -f 'certificate-backend/artifacts/SoulboundCertificate.json' ]"

if [ -f "certificate-backend/artifacts/deployed_address.json" ]; then
    CONTRACT_ADDRESS=$(cat certificate-backend/artifacts/deployed_address.json | grep -o '"address"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
    echo -e "  ${BLUE}Contract Address:${NC} $CONTRACT_ADDRESS"
fi
echo ""

echo "🔐 6. Environment Configuration"
echo "-------------------------------"
if [ -f "certificate-backend/.env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    
    # Check for critical variables
    if grep -q "DB_TYPE" certificate-backend/.env; then
        DB_TYPE=$(grep "DB_TYPE" certificate-backend/.env | cut -d'=' -f2 | tr -d ' ')
        echo -e "  ${BLUE}DB_TYPE:${NC} $DB_TYPE"
    fi
    
    if grep -q "JWT_SECRET" certificate-backend/.env; then
        echo -e "${GREEN}✓${NC} JWT_SECRET is configured"
    else
        echo -e "${YELLOW}⚠${NC} JWT_SECRET not set"
    fi
    
    if grep -q "BLOCKCHAIN_RPC_URL" certificate-backend/.env; then
        RPC_URL=$(grep "BLOCKCHAIN_RPC_URL" certificate-backend/.env | cut -d'=' -f2 | tr -d ' ')
        echo -e "  ${BLUE}RPC URL:${NC} ${RPC_URL:0:50}..."
    fi
else
    echo -e "${YELLOW}⚠${NC} .env file not found (use .env.example as template)"
fi
echo ""

echo "🚀 7. Backend Startup Test"
echo "--------------------------"
echo "Starting backend server..."

cd certificate-backend

# Start server in background
node server.js > /tmp/backend-test.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend server started (PID: $SERVER_PID)"
    
    # Test health endpoint
    echo -n "Testing health endpoint... "
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
    
    if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        
        # Display health info
        echo ""
        echo "Health Check Response:"
        echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
        echo ""
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
        echo "Response: $HEALTH_RESPONSE"
    fi
    
    # Test root endpoint
    echo -n "Testing root endpoint... "
    ROOT_RESPONSE=$(curl -s http://localhost:3000/)
    
    if echo "$ROOT_RESPONSE" | grep -q "Backend is running"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi
    
    # Stop server
    echo ""
    echo "Stopping backend server..."
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null
    echo -e "${GREEN}✓${NC} Server stopped"
else
    echo -e "${RED}✗${NC} Backend server failed to start"
    ((FAILED++))
    echo ""
    echo "Server logs:"
    cat /tmp/backend-test.log
fi

cd ..
echo ""

echo "📊 8. Database Configuration Test"
echo "---------------------------------"
cd certificate-backend

# Test SQLite (default for local)
if [ -f "database.sqlite" ]; then
    echo -e "${GREEN}✓${NC} SQLite database file exists"
    DB_SIZE=$(du -h database.sqlite | cut -f1)
    echo -e "  ${BLUE}Database size:${NC} $DB_SIZE"
fi

# Check PostgreSQL configuration
if grep -q "db-pg" server.js; then
    echo -e "${GREEN}✓${NC} PostgreSQL support is configured"
fi

cd ..
echo ""

echo "🔍 9. Git Repository Status"
echo "---------------------------"
if [ -d ".git" ]; then
    echo -e "${GREEN}✓${NC} Git repository initialized"
    
    BRANCH=$(git branch --show-current 2>/dev/null)
    echo -e "  ${BLUE}Current branch:${NC} $BRANCH"
    
    REMOTE=$(git remote get-url origin 2>/dev/null)
    echo -e "  ${BLUE}Remote:${NC} $REMOTE"
    
    # Check for uncommitted changes
    if git diff-index --quiet HEAD -- 2>/dev/null; then
        echo -e "${GREEN}✓${NC} No uncommitted changes"
    else
        echo -e "${YELLOW}⚠${NC} There are uncommitted changes"
    fi
else
    echo -e "${RED}✗${NC} Not a git repository"
fi
echo ""

echo "====================================================="
echo "📈 Test Summary"
echo "====================================================="
TOTAL=$((PASSED + FAILED))
PASS_RATE=$((PASSED * 100 / TOTAL))

echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo -e "${BLUE}Total:${NC} $TOTAL"
echo -e "${BLUE}Pass Rate:${NC} $PASS_RATE%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! System is ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review RENDER_BACKEND_SETUP.md for deployment instructions"
    echo "2. Set up environment variables in Render dashboard"
    echo "3. Push to GitHub to trigger deployment"
    echo "4. Monitor deployment in Render dashboard"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please review and fix issues.${NC}"
    echo ""
    echo "Common fixes:"
    echo "- Run 'npm install' in backend and frontend directories"
    echo "- Ensure .env file is configured (use .env.example as template)"
    echo "- Check that all required files are present"
    echo "- Review error messages above"
fi
echo ""

# Cleanup
rm -f /tmp/backend-test.log
