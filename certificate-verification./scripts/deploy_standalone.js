
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    // Account #0 from hardhat node (admin)
    // Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
    const wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

    console.log("Deploying with account:", wallet.address);

    const artifactPath = path.join(__dirname, "../artifacts/contracts/SoulboundCertificate.sol/SoulboundCertificate.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    const contract = await factory.deploy(wallet.address, wallet.address);
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log("SoulboundCertificate deployed to:", address);

    // Write address to a file for backend to read
    fs.writeFileSync(path.join(__dirname, "../deployed_address.json"), JSON.stringify({ address }));
}

main().catch(console.error);
