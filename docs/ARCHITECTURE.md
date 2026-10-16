# CertiChain — System Architecture

## High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                                 │
│                                                                    │
│  ┌────────────┐    ┌────────────────┐    ┌──────────────────────┐ │
│  │  Dashboard  │    │ Register Cert  │    │  Verify Certificate   │ │
│  └────────────┘    └────────────────┘    └──────────────────────┘ │
│  ┌────────────┐    ┌────────────────┐    ┌──────────────────────┐ │
│  │  Records   │    │  Cert Detail   │    │   About Project       │ │
│  └────────────┘    └────────────────┘    └──────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                 React + TypeScript + Vite                     │ │
│  │  AppContext (wallet state) │ Ethers.js v6 │ React Router v7  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                               │                                    │
│                    MetaMask (window.ethereum)                      │
└───────────────────────────────┼────────────────────────────────────┘
                                │ JSON-RPC over HTTP
                                │
┌───────────────────────────────▼────────────────────────────────────┐
│              Hardhat Network (localhost:8545, Chain ID 31337)       │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  CertiChain Smart Contract                    │ │
│  │                (Solidity 0.8.24, EVM)                        │ │
│  │                                                              │ │
│  │  State:                                                      │ │
│  │   owner                  address                            │ │
│  │   authorizedIssuers      mapping(address => bool)           │ │
│  │   _certificates          mapping(string => Certificate)     │ │
│  │   _allCertificateIds     string[]                           │ │
│  │   _idExists              mapping(string => bool)            │ │
│  │                                                              │ │
│  │  Events:                                                     │ │
│  │   CertificateRegistered(id, name, course, issuer, hash, ts) │ │
│  │   CertificateRevoked(id, revokedBy, reason, ts)             │ │
│  │   IssuerAuthorized(issuer, by)                              │ │
│  │   IssuerRevoked(issuer, by)                                 │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
App.tsx
 └── AppProvider (Context)
      ├── BrowserRouter
      │    ├── Sidebar (wallet connect, nav, contract status)
      │    └── main
      │         ├── /              → Dashboard.tsx
      │         ├── /register      → RegisterCertificate.tsx
      │         ├── /verify        → VerifyCertificate.tsx
      │         ├── /records       → Records.tsx
      │         ├── /records/:id   → CertificateDetail.tsx
      │         ├── /about         → AboutProject.tsx
      │         └── *              → NotFound.tsx
      └── AppContext
           ├── wallet state (address, chainId, balance, isCorrectNetwork)
           ├── contract state (isDeployed, address, totalCerts, blockNumber)
           ├── connectWallet()
           ├── disconnectWallet()
           └── refreshContract()
```

---

## Data Flow — Certificate Registration

```
User fills form
      │
      ▼
File uploaded → SHA-256 computed (Web Crypto API)
      │
      ▼
validate() — checks all required fields
      │
      ▼
getContract(withSigner=true)
  → getSigner() → MetaMask approval popup
      │
      ▼
contract.registerCertificate(
   certId, studentName, courseName,
   institution, grade, issueDate, documentHash
)
      │
      ▼
MetaMask confirms transaction
      │
      ▼
Smart contract checks:
  - caller is authorized issuer?
  - certId not empty?
  - certId not already registered?
  - documentHash != bytes32(0)?
  → stores Certificate struct
  → emits CertificateRegistered event
      │
      ▼
tx.wait() — wait for mining
      │
      ▼
refreshContract() → update totalCertificates
      │
      ▼
Success state shown to user
```

---

## Data Flow — Certificate Verification

```
User enters Certificate ID
      │
      ▼
getContract(withSigner=false)
  → read-only via MetaMask provider OR direct RPC
      │
      ▼
contract.certificateExists_check(certId) → bool
      │
   ┌──┴──┐
false    true
  │        │
  ▼        ▼
"Not   contract.getCertificate(certId)
Found"  → Certificate struct returned
            │
            ├── isRevoked=true → show "REVOKED" banner
            └── isRevoked=false → show "VALID" banner
                    │
         (Optional) User uploads document
                    │
                    ▼
          SHA-256 hash computed from file
                    │
                    ▼
          compare with cert.documentHash
                    │
              ┌─────┴──────┐
            match        mismatch
              │              │
              ▼              ▼
         "Authentic"    "Tampered / Wrong file"
```

---

## Smart Contract State Machine

```
Certificate States:
┌──────────────────────────────────────────────┐
│                                              │
│   [Does Not Exist]                           │
│        │                                     │
│        │ registerCertificate()               │
│        ▼                                     │
│   [VALID / Active]                           │
│        │                                     │
│        │ revokeCertificate()                 │
│        ▼                                     │
│   [REVOKED] ← permanent, cannot be undone   │
│                                              │
└──────────────────────────────────────────────┘

Issuer Authorization States:
┌──────────────────────────────────────────────┐
│                                              │
│   [Unauthorized]                             │
│        │                                     │
│        │ authorizeIssuer() — owner only      │
│        ▼                                     │
│   [Authorized Issuer]                        │
│        │                                     │
│        │ revokeIssuer() — owner only         │
│        │ (owner cannot be revoked)           │
│        ▼                                     │
│   [Unauthorized]                             │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Security Model

| Threat | Mitigation |
|--------|-----------|
| Fake certificate registration | `onlyAuthorized` modifier — only whitelisted wallets can write |
| Certificate forgery | SHA-256 document hash stored on-chain; cannot be changed post-registration |
| Duplicate IDs | `_idExists` mapping checked before every registration |
| Unauthorized revocation | `onlyAuthorized` modifier on `revokeCertificate` |
| Reverting owner access | `revokeIssuer` checks `issuer != owner` before removing |
| Front-end spoofing | All critical reads come directly from the Ethereum node, not from the server |

---

## Deployment Configuration

After running `npm run deploy`, the file `src/config/deployment.json` is auto-populated:

```json
{
  "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "chainId": 31337,
  "networkName": "localhost",
  "deployedAt": "2026-10-17T...",
  "deployerAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "abi": [ ... ]
}
```

This file is imported by `src/utils/contract.ts` to construct the `ethers.Contract` instance.
