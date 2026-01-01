import hre from "hardhat";

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";  // Replace with your deployed address
  const studentAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";  // Replace with the student's address

  const connection = await hre.network.connect();

  if (connection.viem) {
    const contract = await connection.viem.getContractAt("Certificate", contractAddress);
    const result = await contract.read.verifyCertificate([studentAddress]);
    const [issued, name, degree, date] = result;
    if (issued) {
      console.log(`Certificate verified: Name: ${name}, Degree: ${degree}, Date: ${date}`);
    } else {
      console.log("No certificate found for this student.");
    }
    return;
  }

  if (connection.ethers) {
    const Certificate = await connection.ethers.getContractAt("Certificate", contractAddress);
    const [issued, name, degree, date] = await Certificate.verifyCertificate(studentAddress);
    if (issued) {
      console.log(`Certificate verified: Name: ${name}, Degree: ${degree}, Date: ${date}`);
    } else {
      console.log("No certificate found for this student.");
    }
    return;
  }

  throw new Error("Neither viem nor ethers available on Hardhat connection. Check plugins.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });