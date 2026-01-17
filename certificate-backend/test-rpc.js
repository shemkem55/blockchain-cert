const { ethers } = require('ethers');

// You can change this URL to test different providers
const RPC_URL = process.argv[2] || "https://ethereum-sepolia.publicnode.com";

console.log(`Testing RPC URL: ${RPC_URL}`);

const provider = new ethers.JsonRpcProvider(RPC_URL);

async function testConnection() {
    try {
        const network = await provider.getNetwork();
        console.log(`✅ Connection Successful!`);
        console.log(`   Chain ID: ${network.chainId}`);
        console.log(`   Network Name: ${network.name}`);

        const blockNumber = await provider.getBlockNumber();
        console.log(`   Current Block: ${blockNumber}`);
    } catch (error) {
        console.error("❌ Connection Failed:", error.message);
    }
}

testConnection();
