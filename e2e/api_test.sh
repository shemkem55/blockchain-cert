#!/bin/bash
set -e

BACKEND="https://localhost:3000"
COOKIE_JAR="/tmp/e2e_cookies.txt"
OUTPUT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== E2E API Test ==="
echo "Backend: $BACKEND"

# Clean up previous cookies
rm -f "$COOKIE_JAR"

# Step 1: Login
echo ""
echo "Step 1: Login..."
LOGIN_RESPONSE=$(curl -sS -k -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BACKEND/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}')
echo "Login Response: $LOGIN_RESPONSE"

# Extract OTP from response (looking for devOtp or otp field)
OTP=$(echo "$LOGIN_RESPONSE" | grep -o '"devOtp":"[^"]*"' | cut -d'"' -f4 || echo "")
if [ -z "$OTP" ]; then
  OTP=$(echo "$LOGIN_RESPONSE" | grep -o '"otp":"[^"]*"' | cut -d'"' -f4 || echo "")
fi

if [ -z "$OTP" ]; then
  echo "ERROR: Could not extract OTP from response"
  exit 1
fi

echo "Extracted OTP: $OTP"

# Step 2: Verify OTP
echo ""
echo "Step 2: Verify OTP..."
VERIFY_OTP_RESPONSE=$(curl -sS -k -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BACKEND/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@test.com\",\"otp\":\"$OTP\"}")
echo "Verify OTP Response: $VERIFY_OTP_RESPONSE"

# Step 3: Issue Certificate
echo ""
echo "Step 3: Issue Certificate..."
ISSUE_RESPONSE=$(curl -sS -k -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BACKEND/issue" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Smith","course":"Blockchain Fundamentals","year":"2025"}')
echo "Issue Response: $ISSUE_RESPONSE"

# Extract certificate id
CERT_ID=$(echo "$ISSUE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$CERT_ID" ]; then
  echo "ERROR: Could not extract certificate ID from response"
  exit 1
fi

echo "Issued Certificate ID: $CERT_ID"

# Save to JSON for UI test
cat > "$OUTPUT_DIR/e2e_issue.json" <<EOF
{
  "certificate": {
    "id": "$CERT_ID"
  }
}
EOF

echo "Saved certificate info to e2e_issue.json"

# Step 4: Verify Certificate
echo ""
echo "Step 4: Verify Certificate..."
VERIFY_CERT_RESPONSE=$(curl -sS -k -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BACKEND/verify" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$CERT_ID\"}")
echo "Verify Certificate Response: $VERIFY_CERT_RESPONSE"

# Check if valid
VALID=$(echo "$VERIFY_CERT_RESPONSE" | grep -o '"valid":true' || echo "")
if [ -n "$VALID" ]; then
  echo ""
  echo "✅ API E2E Test PASSED - Certificate verified successfully"
  exit 0
else
  echo ""
  echo "❌ API E2E Test FAILED - Certificate verification failed"
  exit 1
fi
