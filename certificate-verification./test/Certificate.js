import { describe, it } from "node:test";
import { expect } from "chai";
import hre from "hardhat";

describe("Certificate", function () {
  it("Should issue a certificate", async function () {
    const connection = await hre.network.connect();

    if (connection.viem) {
      const { address } = await connection.viem.deployContract("Certificate");
      const contract = await connection.viem.getContractAt("Certificate", address);
      const [wallet] = await connection.viem.getWalletClients();
      await contract.write.issueCertificate(
        [wallet.account.address, "Test", "Test Degree", "2023"],
        { account: wallet.account }
      );
      const [issued] = await contract.read.verifyCertificate([wallet.account.address]);
      expect(issued).to.equal(true);
      return;
    }

    if (connection.ethers) {
      const Certificate = await connection.ethers.getContractFactory("Certificate");
      const certificate = await Certificate.deploy();
      await certificate.deployed();
      const [owner] = await connection.ethers.getSigners();
      await certificate.connect(owner).issueCertificate(owner.address, "Test", "Test Degree", "2023");
      const [issued] = await certificate.verifyCertificate(owner.address);
      expect(issued).to.equal(true);
      return;
    }

    throw new Error("Neither viem nor ethers available on Hardhat connection.");
  });
});