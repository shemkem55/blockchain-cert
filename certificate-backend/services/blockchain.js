const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

let contract = null;
let adminWallet = null;
let blockchainReady = false;
let blockchainInitInProgress = false;
let blockchainLastError = null;
let blockchainLastAttemptAt = null;
let blockchainRpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
let blockchainContractAddress = null;
let blockchainNetwork = null;
let blockchainRetryHandle = null;
const blockchainRetryIntervalMs = Number.parseInt(process.env.BLOCKCHAIN_RETRY_MS || "15000", 10);

function startBlockchainRetry() {
    if (blockchainRetryHandle) return;
    blockchainRetryHandle = setInterval(() => {
        void initBlockchain();
    }, Number.isFinite(blockchainRetryIntervalMs) && blockchainRetryIntervalMs > 0 ? blockchainRetryIntervalMs : 15000);
}

function stopBlockchainRetry() {
    if (!blockchainRetryHandle) return;
    clearInterval(blockchainRetryHandle);
    blockchainRetryHandle = null;
}

async function initBlockchain() {
    if (blockchainInitInProgress) return;
    blockchainInitInProgress = true;
    try {
        blockchainLastAttemptAt = new Date().toISOString();
        blockchainLastError = null;

        const addressPath = path.join(__dirname, "../artifacts/deployed_address.json");
        if (!fs.existsSync(addressPath)) {
            const devPath = path.join(__dirname, "../../certificate-verification./deployed_address.json");
            if (fs.existsSync(devPath)) {
                fs.copyFileSync(devPath, addressPath);
            } else {
                blockchainReady = false;
                blockchainLastError = "deployed_address.json not found";
                startBlockchainRetry();
                return;
            }
        }
        const { address } = JSON.parse(fs.readFileSync(addressPath, "utf8"));
        blockchainContractAddress = address;

        const artifactPath = path.join(__dirname, "../artifacts/SoulboundCertificate.json");
        if (!fs.existsSync(artifactPath)) {
            const devArtifactPath = path.join(__dirname, "../../certificate-verification./artifacts/contracts/SoulboundCertificate.sol/SoulboundCertificate.json");
            if (fs.existsSync(devArtifactPath)) {
                fs.copyFileSync(devArtifactPath, artifactPath);
            } else {
                blockchainReady = false;
                blockchainLastError = "artifact not found";
                startBlockchainRetry();
                return;
            }
        }
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

        const provider = new ethers.JsonRpcProvider(blockchainRpcUrl);
        const network = await provider.getNetwork().catch(() => null);
        if (!network) {
            blockchainReady = false;
            blockchainLastError = `RPC not reachable: ${blockchainRpcUrl}`;
            startBlockchainRetry();
            return;
        }
        blockchainNetwork = { name: network.name, chainId: network.chainId?.toString?.() ?? String(network.chainId) };

        const adminPrivateKey = process.env.BLOCKCHAIN_ADMIN_PRIVATE_KEY;
        const devFallbackKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        adminWallet = new ethers.Wallet(adminPrivateKey || devFallbackKey, provider);

        const code = await provider.getCode(address).catch(() => null);
        if (!code || code === "0x") {
            blockchainReady = false;
            blockchainLastError = `No contract deployed at ${address}`;
            startBlockchainRetry();
            return;
        }

        contract = new ethers.Contract(address, artifact.abi, adminWallet);
        blockchainReady = true;
        stopBlockchainRetry();
        logger.info(`✅ Blockchain connected. Contract at: ${address}. Network: ${network.name}`);

    } catch (error) {
        blockchainReady = false;
        blockchainLastError = error?.message || String(error);
        startBlockchainRetry();
        logger.error("❌ Blockchain Init Error:", error);
    } finally {
        blockchainInitInProgress = false;
    }
}

module.exports = {
    initBlockchain,
    getContract: () => contract,
    getAdminWallet: () => adminWallet,
    getBlockchainStatus: () => ({
        ready: blockchainReady,
        rpcUrl: blockchainRpcUrl,
        contractAddress: blockchainContractAddress,
        network: blockchainNetwork,
        lastAttemptAt: blockchainLastAttemptAt,
        lastError: blockchainLastError
    })
};
