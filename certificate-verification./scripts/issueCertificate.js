import hre from "hardhat";

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";  // Replace with your deployed address
  const studentAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";  // Replace with a student's address

  // Ensure plugins attach to the connection
  const connection = await hre.network.connect();

  if (connection.viem) {
    const contract = await connection.viem.getContractAt("Certificate", contractAddress);
    const [wallet] = await connection.viem.getWalletClients();
    const hash = await contract.write.issueCertificate(
      [studentAddress, "John Doe", "Bachelor of Science", "2023-01-01"],
      { account: wallet.account }
    );
    const publicClient = await connection.viem.getPublicClient();
    await publicClient.waitForTransactionReceipt({ hash });
    console.log("Certificate issued successfully with viem!");
    return;
  }

  if (connection.ethers) {
    const Certificate = await connection.ethers.getContractAt("Certificate", contractAddress);
    const [owner] = await connection.ethers.getSigners();
    const tx = await Certificate.connect(owner).issueCertificate(
      studentAddress,
      "John Doe",
      "Bachelor of Science",
      "2023-01-01"
    );
    await tx.wait();
    console.log("Certificate issued successfully with ethers!");
    return;
  }

  throw new Error("Neither ethers nor viem available on Hardhat connection. Check plugins.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });