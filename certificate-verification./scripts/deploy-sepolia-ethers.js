
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
    console.log("🚀 Starting Sepolia Deployment...");

    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.SEPOLIA_PRIVATE_KEY;

    if (!rpcUrl || !privateKey) {
        throw new Error("❌ Missing SEPOLIA_RPC_URL or SEPOLIA_PRIVATE_KEY in .env");
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`👤 Deploying with account: ${wallet.address}`);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

    if (balance === 0n) {
        throw new Error("❌ Insufficient funds. Please get Sepolia ETH from a faucet.");
    }

    // Load Artifact
    // Note: Adjust path if necessary depending on where this script runs
    const artifactPath = path.join(__dirname, "../artifacts/contracts/SoulboundCertificate.sol/SoulboundCertificate.json");

    if (!fs.existsSync(artifactPath)) {
        // Try to compile first?
        console.log("⚠️  Artifact not found. You might need to run 'npx hardhat compile' first.");
        throw new Error(`Artifact not found at ${artifactPath}`);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    console.log("⏳ Deploying SoulboundCertificate contract...");
    // Constructor args: admin, minter (both set to deployer for now)
    const contract = await factory.deploy(wallet.address, wallet.address);

    console.log(`✅ Transaction sent: ${contract.deploymentTransaction().hash}`);
    console.log("⏳ Waiting for confirmation...");

    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log("\n" + "=".repeat(50));
    console.log(`🎉 Contract Deployed Successfully!`);
    console.log(`📍 Address: ${address}`);
    console.log("=".repeat(50) + "\n");

    // Save address
    const deployData = {
        address: address,
        network: "sepolia",
        chainId: 11155111,
        deployedAt: new Date().toISOString()
    };

    fs.writeFileSync(path.join(__dirname, "../deployed_address_sepolia.json"), JSON.stringify(deployData, null, 2));
    console.log("💾 Address saved to deployed_address_sepolia.json");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
