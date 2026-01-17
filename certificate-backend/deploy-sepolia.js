const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const RPC_URLS = [
    process.env.BLOCKCHAIN_RPC_URL,
    "https://ethereum-sepolia.publicnode.com",
    "https://eth-sepolia.g.alchemy.com/v2/KyNXzvXZgjtUpnFf7D340",
    "https://1rpc.io/sepolia",
    "https://rpc.sepolia.org",
    "https://sepolia.drpc.org"
].filter(Boolean);

async function getProvider() {
    for (const url of RPC_URLS) {
        console.log(`🌐 Trying RPC: ${url}...`);
        try {
            const provider = new ethers.JsonRpcProvider(url);
            await provider.getNetwork();
            console.log("   ✅ Connected!");
            return provider;
        } catch (e) {
            console.log(`   ❌ Failed: ${e.message}`);
        }
    }
    throw new Error("All RPCs failed.");
}

async function main() {
    const PRIVATE_KEY = process.env.BLOCKCHAIN_ADMIN_PRIVATE_KEY;
    if (!PRIVATE_KEY) throw new Error("BLOCKCHAIN_ADMIN_PRIVATE_KEY is missing.");

    const provider = await getProvider();
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`👛 Account: ${wallet.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

    if (balance === 0n) throw new Error("Insufficient funds.");

    // Load Artifact
    const artifactPath = path.join(__dirname, "artifacts", "SoulboundCertificate.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    console.log("🚀 Deploying SoulboundCertificate...");
    // Pass wallet.address as both defaultAdmin and minter
    const contract = await factory.deploy(wallet.address, wallet.address);

    console.log(`⏳ Pending: ${contract.deploymentTransaction().hash}`);
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`🎉 Deployed to: ${address}`);

    // Save
    const savePath = path.join(__dirname, "artifacts", "deployed_address.json");
    fs.writeFileSync(savePath, JSON.stringify({ address }, null, 2));
    console.log(`💾 Saved to ${savePath}`);
}

main().catch(console.error);
