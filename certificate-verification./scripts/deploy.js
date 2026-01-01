
import hre from "hardhat";

async function main() {
  const publicClient = await hre.viem.getPublicClient();
  const [deployer] = await hre.viem.getWalletClients();

  console.log("Deploying contracts with the account:", deployer.account.address);

  // Deploy SoulboundCertificate
  // Constructor arguments: (address defaultAdmin, address minter)
  const cert = await hre.viem.deployContract("SoulboundCertificate", [deployer.account.address, deployer.account.address]);

  console.log("SoulboundCertificate deployed to:", cert.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});