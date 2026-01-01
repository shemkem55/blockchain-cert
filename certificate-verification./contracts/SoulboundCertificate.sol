// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract SoulboundCertificate is ERC721, ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 private _nextTokenId;

    event CertificateIssued(uint256 indexed tokenId, address indexed student, string uri);
    event CertificateRevoked(uint256 indexed tokenId);

    constructor(address defaultAdmin, address minter) ERC721("AcademicCertificate", "CERT") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
    }

    function safeMint(address to, string memory uri) public onlyRole(MINTER_ROLE) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit CertificateIssued(tokenId, to, uri);
    }

    function revoke(uint256 tokenId) public onlyRole(MINTER_ROLE) {
        _burn(tokenId);
        emit CertificateRevoked(tokenId);
    }

    // Soulbound Implementation: Block transfers
    function transferFrom(address, address, uint256) public virtual override(ERC721, IERC721) {
        revert("SoulboundCertificate: This certificate is non-transferable");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public virtual override(ERC721, IERC721) {
        revert("SoulboundCertificate: This certificate is non-transferable");
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
