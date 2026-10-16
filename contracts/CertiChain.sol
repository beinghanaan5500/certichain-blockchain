// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CertiChain
 * @author CertiChain Development Team
 * @notice Blockchain-Based Student Certificate Verification System
 * @dev Manages issuance and verification of academic certificates on Ethereum
 */
contract CertiChain {
    // ─── Data Structures ─────────────────────────────────────────────────────

    struct Certificate {
        string  certificateId;    // Unique certificate identifier (e.g. CERT-2024-001)
        string  studentName;      // Full name of the student
        string  courseName;       // Name of the course / degree
        string  institutionName;  // Issuing institution name
        string  grade;            // Grade / CGPA / Distinction
        uint256 issueDate;        // Unix timestamp of issue date (off-chain date)
        uint256 registeredAt;     // Block timestamp when registered on-chain
        bytes32 documentHash;     // SHA-256 hash of the certificate document
        address issuedBy;         // Wallet address of the issuer
        bool    isRevoked;        // Revocation flag
        string  revokeReason;     // Reason for revocation (empty if not revoked)
    }

    // ─── State Variables ──────────────────────────────────────────────────────

    address public owner;                               // Contract deployer (admin)
    mapping(address => bool)  public authorizedIssuers; // Authorized issuer whitelist
    mapping(string  => bool)  private _idExists;        // Fast duplicate check
    mapping(string  => Certificate) private _certificates; // Main certificate store
    string[] private _allCertificateIds;                // Index for enumeration

    // ─── Events ───────────────────────────────────────────────────────────────

    event CertificateRegistered(
        string  indexed certificateId,
        string  studentName,
        string  courseName,
        address indexed issuedBy,
        bytes32 documentHash,
        uint256 registeredAt
    );

    event CertificateRevoked(
        string  indexed certificateId,
        address indexed revokedBy,
        string  reason,
        uint256 revokedAt
    );

    event IssuerAuthorized(address indexed issuer, address indexed by);
    event IssuerRevoked(address indexed issuer, address indexed by);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "CertiChain: caller is not the owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedIssuers[msg.sender],
            "CertiChain: caller is not an authorized issuer"
        );
        _;
    }

    modifier certificateExists(string memory certId) {
        require(_idExists[certId], "CertiChain: certificate ID does not exist");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;  // Owner is auto-authorized
        emit IssuerAuthorized(msg.sender, msg.sender);
    }

    // ─── Issuer Management ────────────────────────────────────────────────────

    /**
     * @notice Grant issuer permission to an address
     * @param issuer Address to authorize
     */
    function authorizeIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "CertiChain: invalid address");
        require(!authorizedIssuers[issuer], "CertiChain: already authorized");
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer, msg.sender);
    }

    /**
     * @notice Revoke issuer permission from an address
     * @param issuer Address to deauthorize
     */
    function revokeIssuer(address issuer) external onlyOwner {
        require(issuer != owner, "CertiChain: cannot revoke owner");
        require(authorizedIssuers[issuer], "CertiChain: not an authorized issuer");
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer, msg.sender);
    }

    // ─── Certificate Operations ───────────────────────────────────────────────

    /**
     * @notice Register a new certificate on-chain
     * @param certId        Unique certificate ID string
     * @param studentName   Full name of the student
     * @param courseName    Degree / course name
     * @param institution   Issuing institution
     * @param grade         Grade or CGPA
     * @param issueDate     Unix timestamp of the certificate issue date
     * @param documentHash  SHA-256 hash of the certificate PDF/document
     */
    function registerCertificate(
        string  memory certId,
        string  memory studentName,
        string  memory courseName,
        string  memory institution,
        string  memory grade,
        uint256        issueDate,
        bytes32        documentHash
    ) external onlyAuthorized {
        require(bytes(certId).length > 0,        "CertiChain: empty certificate ID");
        require(bytes(studentName).length > 0,   "CertiChain: empty student name");
        require(bytes(courseName).length > 0,    "CertiChain: empty course name");
        require(bytes(institution).length > 0,   "CertiChain: empty institution");
        require(!_idExists[certId],              "CertiChain: certificate ID already registered");
        require(documentHash != bytes32(0),      "CertiChain: document hash cannot be zero");

        _certificates[certId] = Certificate({
            certificateId:   certId,
            studentName:     studentName,
            courseName:      courseName,
            institutionName: institution,
            grade:           grade,
            issueDate:       issueDate,
            registeredAt:    block.timestamp,
            documentHash:    documentHash,
            issuedBy:        msg.sender,
            isRevoked:       false,
            revokeReason:    ""
        });

        _idExists[certId] = true;
        _allCertificateIds.push(certId);

        emit CertificateRegistered(
            certId,
            studentName,
            courseName,
            msg.sender,
            documentHash,
            block.timestamp
        );
    }

    /**
     * @notice Revoke a previously registered certificate
     * @param certId  Certificate ID to revoke
     * @param reason  Human-readable reason for revocation
     */
    function revokeCertificate(
        string memory certId,
        string memory reason
    ) external onlyAuthorized certificateExists(certId) {
        Certificate storage cert = _certificates[certId];
        require(!cert.isRevoked, "CertiChain: certificate already revoked");
        require(bytes(reason).length > 0, "CertiChain: revocation reason required");

        cert.isRevoked    = true;
        cert.revokeReason = reason;

        emit CertificateRevoked(certId, msg.sender, reason, block.timestamp);
    }

    // ─── Read Functions ───────────────────────────────────────────────────────

    /**
     * @notice Retrieve full certificate details
     * @param certId  Certificate ID to look up
     * @return cert   The Certificate struct
     */
    function getCertificate(string memory certId)
        external
        view
        certificateExists(certId)
        returns (Certificate memory cert)
    {
        return _certificates[certId];
    }

    /**
     * @notice Check whether a certificate ID has been registered
     * @param certId  Certificate ID to check
     */
    function certificateExists_check(string memory certId) external view returns (bool) {
        return _idExists[certId];
    }

    /**
     * @notice Verify a certificate and optionally verify its document hash
     * @param certId       Certificate ID
     * @param documentHash SHA-256 hash of the document to verify (pass bytes32(0) to skip)
     * @return exists           Whether the ID exists
     * @return isRevoked        Whether it has been revoked
     * @return hashMatches      Whether the provided hash matches on-chain hash
     * @return registeredAt     Block timestamp of registration
     */
    function verifyCertificate(string memory certId, bytes32 documentHash)
        external
        view
        returns (
            bool exists,
            bool isRevoked,
            bool hashMatches,
            uint256 registeredAt
        )
    {
        if (!_idExists[certId]) {
            return (false, false, false, 0);
        }
        Certificate storage cert = _certificates[certId];
        bool _hashMatches = (documentHash == bytes32(0))
            ? false
            : (cert.documentHash == documentHash);

        return (true, cert.isRevoked, _hashMatches, cert.registeredAt);
    }

    /**
     * @notice Get total number of certificates registered
     */
    function getTotalCertificates() external view returns (uint256) {
        return _allCertificateIds.length;
    }

    /**
     * @notice Get certificate IDs in a paginated range
     * @param offset  Start index (0-based)
     * @param limit   Number of IDs to return
     */
    function getCertificateIds(uint256 offset, uint256 limit)
        external
        view
        returns (string[] memory ids)
    {
        uint256 total = _allCertificateIds.length;
        if (offset >= total) return new string[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        uint256 size = end - offset;
        ids = new string[](size);
        for (uint256 i = 0; i < size; i++) {
            ids[i] = _allCertificateIds[offset + i];
        }
    }
}
