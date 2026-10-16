# CertiChain — Blockchain-Based Student Certificate Verification System
## College Project Report

---

## 1. Introduction

### 1.1 Problem Statement

Academic certificate fraud is a widespread and growing problem globally. Employers, universities, and professional bodies routinely encounter forged degrees, tampered transcripts, and counterfeit certificates. Traditional paper-based certificates are easy to forge, time-consuming to verify, and rely on the issuing institution's availability to confirm authenticity.

### 1.2 Proposed Solution

CertiChain is a decentralized application (DApp) that stores academic certificate records on an Ethereum blockchain. Once a certificate is registered on-chain:
- Its data **cannot be altered**
- Its authenticity can be **verified instantly by anyone**
- Its document hash proves the **exact document** was registered
- Fraudulent certificates can be **revoked on-chain** with a recorded reason

No central server or trusted third party is required for verification.

---

## 2. Objectives

1. Design and implement a Solidity smart contract to store, retrieve, and revoke academic certificates.
2. Build an access-controlled issuance system (only authorized institutions can register).
3. Implement SHA-256 document hash storage for tamper-evident verification.
4. Build a professional React + TypeScript frontend that integrates with the contract via Ethers.js.
5. Write comprehensive automated tests (27 tests, 100% passing).
6. Demonstrate the system with realistic demo data on a local Ethereum network.

---

## 3. Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Smart Contract Language | Solidity | 0.8.24 | Smart contract development |
| Blockchain Development | Hardhat | 2.29 | Local Ethereum node + testing |
| Contract Testing | Mocha + Chai | Latest | Automated contract tests |
| Frontend Framework | React | 19 | UI component system |
| Type Safety | TypeScript | 6 | Static typing for frontend |
| Build Tool | Vite | 8 | Fast frontend bundler |
| Styling | Tailwind CSS | v4 | Utility-first CSS framework |
| Blockchain Client | Ethers.js | v6 | Ethereum interaction library |
| Wallet Integration | MetaMask | - | Browser wallet for signing transactions |
| Routing | React Router | v7 | Client-side navigation |
| Icons | Lucide React | Latest | SVG icon library |

---

## 4. System Design

### 4.1 Smart Contract Design

The `CertiChain.sol` contract uses three main mappings:
- `mapping(string => Certificate) _certificates` — stores the complete certificate struct indexed by ID
- `mapping(string => bool) _idExists` — O(1) duplicate ID check
- `mapping(address => bool) authorizedIssuers` — access control whitelist

The `Certificate` struct stores:
```solidity
struct Certificate {
    string  certificateId;
    string  studentName;
    string  courseName;
    string  institutionName;
    string  grade;
    uint256 issueDate;        // Unix timestamp (off-chain date)
    uint256 registeredAt;     // Block timestamp (on-chain registration time)
    bytes32 documentHash;     // SHA-256 of the certificate document
    address issuedBy;         // Wallet address of the issuer
    bool    isRevoked;
    string  revokeReason;
}
```

### 4.2 Access Control

- Contract deployer becomes the **owner** and is automatically an **authorized issuer**.
- Owner can add or remove other authorized issuers (`authorizeIssuer`, `revokeIssuer`).
- Only authorized issuers can call `registerCertificate` and `revokeCertificate`.
- Read functions (`getCertificate`, `verifyCertificate`) are public — anyone can verify.

### 4.3 Document Hash Verification

When a certificate is registered, the SHA-256 hash of the original document is stored as `bytes32 documentHash`. During verification:

1. User uploads the original document.
2. Browser computes SHA-256 using the Web Crypto API.
3. Computed hash is compared with the on-chain hash.
4. If they match, the document is authentic and unchanged.

This guarantees that even if someone copies the certificate ID, the underlying document cannot be forged — the hash will not match.

---

## 5. Frontend Implementation

### 5.1 Pages

| Page | Purpose |
|------|---------|
| Dashboard | System overview with live blockchain statistics |
| Register Certificate | Form to issue a new certificate on-chain with file upload |
| Verify Certificate | Look up a certificate by ID and optionally verify document hash |
| All Records | Paginated list of all certificates with search and status filter |
| Certificate Detail | Full certificate view with revocation panel for authorized users |
| About Project | Project documentation and how-to guide |

### 5.2 Wallet Integration

The app uses MetaMask via `window.ethereum`. The `AppContext` manages:
- Wallet connection state (address, balance, chain ID)
- Contract deployment state (address, total certificates, block number)
- Auto-reconnection when MetaMask is already authorized
- Network change detection (requires Chain ID 31337)

### 5.3 UI/UX Design

The UI features:
- Dark theme with navy background and glassmorphism cards
- Gradient accent colors (indigo #4f6ef7 + teal #2dd4bf)
- Subtle micro-animations (fade-in, pulse dot, spinner)
- Responsive layout with mobile sidebar
- Color-coded status badges (green = valid, red = revoked, yellow = warning)

---

## 6. Blockchain Integration

### 6.1 Deployment Flow

1. Compile: `npx hardhat compile` → generates ABI + bytecode in `artifacts/`
2. Deploy: `npx hardhat run scripts/deploy.cjs --network localhost`
3. Script saves contract address + ABI to `src/config/deployment.json`
4. Frontend loads this config at startup to construct the `ethers.Contract` instance

### 6.2 Transaction Flow

For write operations (register, revoke):
- `ethers.BrowserProvider` + `signer.sendTransaction` → MetaMask popup → user confirms → transaction mined → frontend updates

For read operations (verify, get):
- Direct `contract.callStatic` or view function → no MetaMask popup → instant response

---

## 7. Testing

### 7.1 Test Results

**27 / 27 tests passing** (see `docs/TEST_REPORT.md` for full details)

### 7.2 Test Categories

- Deployment (3 tests): constructor state validation
- Issuer Management (5 tests): access control
- Certificate Registration (5 tests): input validation + access control
- Certificate Retrieval (4 tests): data integrity
- Verification (4 tests): hash matching and existence checking
- Revocation (5 tests): revocation logic and state transitions

---

## 8. Results and Demo

After running the demo seeding script, 7 certificates are on-chain:
- 6 valid certificates from different students and institutions
- 1 revoked certificate (demonstrating the revocation feature)

Verification use cases demonstrated:
- ✅ Valid certificate lookup by ID
- 🚫 Revoked certificate lookup
- ❌ Non-existent certificate ID (returns "Not Found")
- 🔒 Document hash match (authentic document)
- ⚠️ Document hash mismatch (tampered/wrong document)

---

## 9. Limitations and Future Work

### Current Limitations
1. **Local blockchain only** — data is lost when the Hardhat node restarts.
2. **No IPFS storage** — only the hash of the document is stored, not the document itself.
3. **MetaMask required** for write operations.
4. **Single contract owner** — no multi-sig or DAO governance.

### Future Enhancements
1. Deploy to Ethereum Sepolia testnet for persistent public access.
2. IPFS integration — store and retrieve the actual certificate document.
3. QR code generation — embed the certificate ID in a scannable code.
4. Batch registration — allow bulk certificate uploads via CSV.
5. Email notifications — notify students when a certificate is registered.
6. Multi-signature governance — require multiple signers for revocations.
7. NFT certificates — mint each certificate as an ERC-721 token.

---

## 10. Conclusion

CertiChain successfully demonstrates how blockchain technology can solve the academic certificate fraud problem. The system provides:
- **Immutability** — once registered, a certificate record cannot be altered
- **Transparency** — anyone can verify any certificate without contacting the institution
- **Tamper-evidence** — the document hash proves the original document has not been modified
- **Decentralization** — no single point of failure or trusted intermediary

The project was implemented with a complete full-stack approach: a robust Solidity smart contract (27/27 automated tests passing), a professional React TypeScript frontend, and comprehensive documentation.

---

## 11. References

1. Nakamoto, S. (2008). *Bitcoin: A Peer-to-Peer Electronic Cash System.*
2. Ethereum Foundation. (2024). *Ethereum Documentation.* https://ethereum.org/
3. Hardhat Documentation. https://hardhat.org/docs
4. Ethers.js v6 Documentation. https://docs.ethers.org/v6/
5. Solidity Language Documentation. https://docs.soliditylang.org/
6. NIST FIPS 180-4. *Secure Hash Standard (SHA-256).*
