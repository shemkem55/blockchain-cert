// contracts/Certificate.sol
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Certificate is Ownable {
    struct CertificateData {
        string studentName; // e.g., "John Doe"
        string degree; // e.g., "Bachelor of Science"
        string issueDate; // e.g., "2023-01-01"
        bool issued; // Flag to check if certificate is issued
    }

    mapping(address => CertificateData) public certificates; // Maps student address to their certificate data

    event CertificateIssued(
        address indexed student,
        string studentName,
        string degree,
        string issueDate
    );

    constructor() Ownable(msg.sender) {}

    // Function for the university (owner) to issue a certificate
    function issueCertificate(
        address student,
        string memory studentName,
        string memory degree,
        string memory issueDate
    ) public onlyOwner {
        require(
            !certificates[student].issued,
            "Certificate already issued for this student"
        );
        certificates[student] = CertificateData(
            studentName,
            degree,
            issueDate,
            true
        );
        emit CertificateIssued(student, studentName, degree, issueDate);
    }

    // Function for anyone (e.g., employers) to verify a certificate
    function verifyCertificate(
        address student
    ) public view returns (bool, string memory, string memory, string memory) {
        CertificateData memory cert = certificates[student];
        if (cert.issued) {
            return (true, cert.studentName, cert.degree, cert.issueDate);
        } else {
            return (false, "", "", ""); // Certificate not found
        }
    }
}
