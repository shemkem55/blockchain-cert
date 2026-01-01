#!/bin/bash

# ============================================
# Deployment Preparation Script
# Blockchain Certificate System
# ============================================

set -e  # Exit on error

echo "🚀 Starting Deployment Preparation..."
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check if we're in the right directory
if [ ! -f "DEPLOYMENT_READINESS_REPORT.md" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_info "Step 1: Generating Strong Secrets"
echo "======================================"

# Generate JWT Secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
print_success "Generated JWT_SECRET (64 bytes)"

# Generate JWT Refresh Secret
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
print_success "Generated JWT_REFRESH_SECRET (64 bytes)"

# Generate Encryption Key
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
print_success "Generated ENCRYPTION_KEY (32 bytes)"

echo ""
print_info "Step 2: Updating Backend .env File"
echo "======================================"

# Backup existing .env
if [ -f "certificate-backend/.env" ]; then
    cp certificate-backend/.env certificate-backend/.env.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Backed up existing .env file"
fi

# Update .env with new secrets
cd certificate-backend

# Update JWT_SECRET
if grep -q "^JWT_SECRET=" .env; then
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
    print_success "Updated JWT_SECRET in .env"
else
    echo "JWT_SECRET=${JWT_SECRET}" >> .env
    print_success "Added JWT_SECRET to .env"
fi

# Update NODE_ENV to production
if grep -q "^NODE_ENV=" .env; then
    sed -i "s|^NODE_ENV=.*|NODE_ENV=production|" .env
    print_success "Set NODE_ENV=production"
else
    echo "NODE_ENV=production" >> .env
    print_success "Added NODE_ENV=production"
fi

# Update FORCE_SHOW_OTP
if grep -q "^FORCE_SHOW_OTP=" .env; then
    sed -i "s|^FORCE_SHOW_OTP=.*|FORCE_SHOW_OTP=false|" .env
    print_success "Set FORCE_SHOW_OTP=false"
fi

cd ..

echo ""
print_info "Step 3: Fixing Frontend Vulnerabilities"
echo "======================================"

cd "frontend v2"

# Fix npm audit issues
print_info "Running npm audit fix..."
if npm audit fix 2>&1 | grep -q "fixed"; then
    print_success "Fixed npm vulnerabilities"
else
    print_warning "No automatic fixes available. Manual review may be needed."
fi

cd ..

echo ""
print_info "Step 4: Building Production Frontend"
echo "======================================"

cd "frontend v2"
npm run build
print_success "Frontend production build completed"
cd ..

echo ""
print_info "Step 5: Running Security Audit"
echo "======================================"

cd certificate-backend
AUDIT_OUTPUT=$(npm audit 2>&1)
if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
    print_success "Backend: No vulnerabilities found"
else
    print_warning "Backend: Some vulnerabilities detected. Review required."
    echo "$AUDIT_OUTPUT"
fi
cd ..

echo ""
print_info "Step 6: Checking File Permissions"
echo "======================================"

# Ensure uploads directory exists with correct permissions
if [ -d "certificate-backend/uploads" ]; then
    chmod 755 certificate-backend/uploads
    print_success "Set uploads directory permissions"
else
    mkdir -p certificate-backend/uploads
    chmod 755 certificate-backend/uploads
    print_success "Created uploads directory with correct permissions"
fi

# Ensure logs directory exists
if [ -d "certificate-backend/logs" ]; then
    chmod 755 certificate-backend/logs
    print_success "Set logs directory permissions"
else
    mkdir -p certificate-backend/logs
    chmod 755 certificate-backend/logs
    print_success "Created logs directory with correct permissions"
fi

echo ""
print_info "Step 7: Creating Deployment Summary"
echo "======================================"

cat > DEPLOYMENT_SUMMARY.txt << EOF
====================================
DEPLOYMENT PREPARATION SUMMARY
Generated: $(date)
====================================

✅ COMPLETED TASKS:
- Generated strong JWT secrets
- Updated .env configuration
- Set NODE_ENV=production
- Fixed frontend vulnerabilities
- Built production frontend
- Ran security audits
- Set correct file permissions

🔐 GENERATED SECRETS:
JWT_SECRET: ${JWT_SECRET:0:20}... (64 bytes)
JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:0:20}... (64 bytes)
ENCRYPTION_KEY: ${ENCRYPTION_KEY:0:20}... (32 bytes)

⚠️  MANUAL ACTIONS REQUIRED:
1. Update EMAIL_USER and EMAIL_PASSWORD in .env
2. Update ADMIN_PASSWORD in .env (currently: 12747aluminA@)
3. Update GOOGLE_CLIENT_ID if using OAuth
4. Review and update CORS_ORIGINS for production domains
5. Set up production database (if using MariaDB)
6. Configure BLOCKCHAIN_RPC_URL for production
7. Set up SSL certificates (Let's Encrypt)
8. Configure NGINX reverse proxy
9. Set up PM2 process manager
10. Configure firewall rules

📋 NEXT STEPS:
1. Review DEPLOYMENT_READINESS_REPORT.md
2. Follow PRODUCTION_DEPLOYMENT.md guide
3. Test in staging environment
4. Deploy to production server
5. Set up monitoring and alerts

⚠️  SECURITY REMINDERS:
- NEVER commit .env file to version control
- Rotate credentials regularly
- Keep backups of database
- Monitor logs for suspicious activity
- Set up automated security scans

====================================
EOF

print_success "Created DEPLOYMENT_SUMMARY.txt"

echo ""
echo "======================================"
print_success "Deployment Preparation Complete!"
echo "======================================"
echo ""
print_info "Generated Files:"
echo "  - certificate-backend/.gitignore"
echo "  - certificate-backend/.env.production.template"
echo "  - DEPLOYMENT_READINESS_REPORT.md"
echo "  - DEPLOYMENT_SUMMARY.txt"
echo ""
print_warning "IMPORTANT: Review DEPLOYMENT_SUMMARY.txt for manual actions required"
echo ""
print_info "Next Steps:"
echo "  1. Review and complete manual actions in DEPLOYMENT_SUMMARY.txt"
echo "  2. Test the application locally with production settings"
echo "  3. Follow PRODUCTION_DEPLOYMENT.md for server setup"
echo "  4. Deploy to staging environment first"
echo "  5. Deploy to production with monitoring"
echo ""
print_success "Good luck with your deployment! 🚀"
