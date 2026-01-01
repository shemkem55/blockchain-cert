
import { describe, it, beforeEach } from "node:test";
import { expect } from "chai";
import hre from "hardhat";

describe("SoulboundCertificate", function () {
    let cert;
    let owner;
    let student;
    let otherAccount;

    beforeEach(async function () {
        const connection = await hre.network.connect();

        if (!connection.ethers) {
            throw new Error("Hardhat Ethers plugin not found on connection object");
        }

        // Access ethers from connection
        const ethers = connection.ethers;

        [owner, student, otherAccount] = await ethers.getSigners();
        const SoulboundCertificateFactory = await ethers.getContractFactory("SoulboundCertificate");
        cert = await SoulboundCertificateFactory.deploy(owner.address, owner.address);
        // deployed() is v5, waitForDeployment() is v6. 
        // If it's v6, waitForDeployment exists.
        if (cert.waitForDeployment) {
            await cert.waitForDeployment();
        } else {
            await cert.deployed();
        }
    });

    it("Should mint a certificate", async function () {
        await cert.safeMint(student.address, "ipfs://test");
        expect(await cert.ownerOf(0)).to.equal(student.address);
        expect(await cert.tokenURI(0)).to.equal("ipfs://test");
    });

    it("Should fail if non-minter tries to mint", async function () {
        let error;
        try {
            await cert.connect(student).safeMint(student.address, "ipfs://test");
        } catch (err) {
            error = err;
        }
        expect(error).to.exist;
        // expect(error.message).to.include("AccessControl"); // Optional specific check
    });

    it("Should fail to transfer (Soulbound)", async function () {
        await cert.safeMint(student.address, "ipfs://test");
        let error;
        try {
            await cert.connect(student).transferFrom(student.address, otherAccount.address, 0);
        } catch (err) {
            error = err;
        }
        expect(error).to.exist;
        expect(error.message).to.include("SoulboundCertificate");
    });

    it("Should allowing revoking", async function () {
        await cert.safeMint(student.address, "ipfs://test");
        await cert.revoke(0);

        // Check ownership fails (burned)
        let error;
        try {
            await cert.ownerOf(0);
        } catch (err) {
            error = err;
        }
        expect(error).to.exist;
    });
});
