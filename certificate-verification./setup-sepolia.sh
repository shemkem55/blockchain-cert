#!/bin/bash
# Setup script for Sepolia network configuration
# Usage: source setup-sepolia.sh

echo "Setting up Sepolia network configuration..."
echo ""

# Set public Sepolia RPC URL (you can replace this with your own endpoint)
# Environment variables override keystore values, so this will fix any invalid keystore entries
# Using a reliable public endpoint - if this fails, try alternatives listed below
export SEPOLIA_RPC_URL='https://ethereum-sepolia-rpc.publicnode.com'

echo "✅ SEPOLIA_RPC_URL set to: $SEPOLIA_RPC_URL"
echo "   (This overrides any keystore value)"
echo ""

# Check if private key is already set
if [ -z "$SEPOLIA_PRIVATE_KEY" ]; then
    echo "⚠️  SEPOLIA_PRIVATE_KEY is not set!"
    echo ""
    echo "To set your private key, run:"
    echo "  export SEPOLIA_PRIVATE_KEY='your_private_key_here'"
    echo ""
    echo "⚠️  WARNING: Never commit your private key to version control!"
    echo ""
    echo "Alternatively, you can use hardhat-keystore:"
    echo "  npx hardhat keystore set SEPOLIA_PRIVATE_KEY"
    echo "  npx hardhat keystore set SEPOLIA_RPC_URL"
    echo ""
else
    echo "✅ SEPOLIA_PRIVATE_KEY is set"
fi

echo "✅ SEPOLIA_RPC_URL is set to: $SEPOLIA_RPC_URL"
echo ""
echo "⚠️  If you're getting RPC errors, try these alternative endpoints:"
echo "   export SEPOLIA_RPC_URL='https://rpc.sepolia.org'"
echo "   export SEPOLIA_RPC_URL='https://sepolia.infura.io/v3/YOUR_PROJECT_ID'"
echo "   export SEPOLIA_RPC_URL='https://ethereum-sepolia-rpc.publicnode.com'"
echo ""
echo "⚠️  If you previously set SEPOLIA_RPC_URL in keystore with an invalid/broken URL,"
echo "   fix it by running:"
echo "   npx hardhat keystore set SEPOLIA_RPC_URL"
echo "   Then enter: https://ethereum-sepolia-rpc.publicnode.com"
echo ""
echo "   Or use environment variables (which take precedence over keystore):"
echo "   export SEPOLIA_RPC_URL='https://ethereum-sepolia-rpc.publicnode.com'"
echo ""
echo "You can now deploy to Sepolia with:"
echo "  npx hardhat run scripts/deploy.js --network sepolia"

