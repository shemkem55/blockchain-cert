
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SoulboundCertificateModule = buildModule("SoulboundCertificateModule", (m) => {
    // Use the deployer account (first account) for both admin and minter initially
    const deployer = m.getAccount(0);

    const cert = m.contract("SoulboundCertificate", [deployer, deployer]);

    return { cert };
});

export default SoulboundCertificateModule;
