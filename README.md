# CertiChain — Blockchain-Based Student Certificate Verification System

<p align="center">
  <img src="public/favicon.svg" width="60" alt="CertiChain Logo" />
</p>

<p align="center">
  <strong>A decentralized application (DApp) for issuing and verifying academic certificates on the Ethereum blockchain</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Solidity-0.8.24-blue?logo=solidity" />
  <img src="https://img.shields.io/badge/Hardhat-2.29-yellow?logo=ethereum" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/Ethers.js-6-purple" />
  <img src="https://img.shields.io/badge/Tests-27%2F27%20passing-brightgreen" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Smart Contract Features](#smart-contract-features)
- [Frontend Features](#frontend-features)
- [Quick Start](#quick-start)
- [Full Setup Guide](#full-setup-guide)
- [Demo Data](#demo-data)
- [Running Tests](#running-tests)
- [Available Scripts](#available-scripts)
- [Architecture](#architecture)
- [Known Limitations](#known-limitations)

---

## Overview

CertiChain is a college final-year project demonstrating how blockchain technology can replace paper-based and easily-forged academic certificates. Every certificate is stored **immutably** on an Ethereum smart contract. Verification is instant, trustless, and tamper-proof — no central authority is needed.

**Key features:**
- Issue certificates with a document SHA-256 hash (tamper-evident)
- Verify any certificate by ID in seconds
- Revoke fraudulent certificates with an on-chain reason
- Access-controlled issuance (only authorized wallet addresses can register)
- Full audit trail via Ethereum events

---

## Technology Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.24 |
| Local Blockchain | Hardhat 2.29 (Hardhat Network) |
| Contract Testing | Mocha + Chai + Hardhat Toolbox |
| Frontend Framework | React 19 + TypeScript 6 |
| Build Tool | Vite 8 |
| CSS / Styling | Tailwind CSS v4 |
| Blockchain Client | Ethers.js v6 |
| Wallet Integration | MetaMask |
| Router | React Router v7 |
| Icons | Lucide React |

---

## Project Structure

```
blockchain pro/
├── contracts/
│   └── CertiChain.sol          # Solidity smart contract
├── scripts/
│   ├── deploy.cjs              # Contract deployment script
│   └── seed-demo.cjs           # Demo certificate seeding script
├── test/
│   └── CertiChain.test.cjs     # 27 automated smart contract tests
├── artifacts/                  # Compiled contract artifacts (auto-generated)
├── cache/                      # Hardhat build cache (auto-generated)
├── src/
│   ├── components/
│   │   └── layout/
│   │       └── Sidebar.tsx     # Navigation sidebar with wallet status
│   ├── config/
│   │   └── deployment.json     # Auto-populated after deployment
│   ├── context/
│   │   └── AppContext.tsx      # Global wallet + contract state
│   ├── pages/
│   │   ├── Dashboard.tsx       # Overview + recent certificates
│   │   ├── RegisterCertificate.tsx  # Issue new certificates
│   │   ├── VerifyCertificate.tsx    # Look up + verify certificates
│   │   ├── Records.tsx         # All certificates with search/filter
│   │   ├── CertificateDetail.tsx    # Individual cert with revoke option
│   │   ├── AboutProject.tsx    # Project documentation page
│   │   └── NotFound.tsx        # 404 page
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   ├── utils/
│   │   └── contract.ts         # Ethers.js helpers (provider, hash, format)
│   ├── App.tsx                 # Router + layout
│   ├── main.tsx                # React entry point
│   └── index.css               # Global styles (Tailwind + custom)
├── docs/
│   ├── ARCHITECTURE.md         # System architecture
│   ├── TEST_REPORT.md          # Test results and coverage
│   ├── PROJECT_REPORT.md       # College project report
│   └── VIVA_QA.md              # Viva questions & answers
├── hardhat.config.cjs          # Hardhat configuration
├── vite.config.ts              # Vite build configuration
├── package.json
└── README.md
```

---

## Smart Contract Features

The `CertiChain.sol` contract provides:

| Function | Access | Description |
|---|---|---|
| `registerCertificate(...)` | Authorized issuers | Register a new certificate with all metadata + document hash |
| `getCertificate(certId)` | Anyone (view) | Retrieve full certificate struct |
| `verifyCertificate(certId, hash)` | Anyone (view) | Check existence, revocation, and hash match |
| `revokeCertificate(certId, reason)` | Authorized issuers | Permanently mark certificate as revoked |
| `authorizeIssuer(address)` | Owner only | Grant issuing rights to a wallet |
| `revokeIssuer(address)` | Owner only | Remove issuing rights |
| `getTotalCertificates()` | Anyone (view) | Total count |
| `getCertificateIds(offset, limit)` | Anyone (view) | Paginated list of IDs |
| `certificateExists_check(certId)` | Anyone (view) | Boolean existence check |

**Protections built in:**
- Duplicate ID rejection
- Empty field validation
- Zero-hash rejection
- Owner cannot be deauthorized
- Already-revoked cannot be re-revoked
- Revocation requires a non-empty reason

---

## Frontend Features

| Page | Route | Features |
|---|---|---|
| Dashboard | `/` | Live stats, recent certs table, blockchain + wallet status |
| Register | `/register` | Form with file upload, SHA-256 hashing, on-chain submission |
| Verify | `/verify` | ID lookup + document integrity check |
| Records | `/records` | Full paginated list with search, filter by status |
| Detail | `/records/:id` | Full certificate view + revocation panel |
| About | `/about` | System overview, tech stack, how it works |

---

## Quick Start

> **Prerequisites:** Node.js 18+, MetaMask browser extension

### Terminal 1 — Start local blockchain
```bash
npm run chain
```

### Terminal 2 — Deploy contract + seed demo data + start frontend
```bash
npm run deploy
npm run seed:demo
npm run dev
```

Open **http://localhost:5173** in your browser.

### MetaMask setup
1. Add network: **Localhost 8545**, Chain ID **31337**
2. Import a test account using one of the private keys printed by the Hardhat node
3. Connect wallet in the CertiChain sidebar

---

## Full Setup Guide

### 1. Install dependencies
```bash
npm install
```

### 2. Compile the smart contract
```bash
npm run compile
```

### 3. Run smart contract tests
```bash
npm run test:contract
# Expected: 27 passing
```

### 4. Start the local Ethereum node (keep this running)
```bash
npm run chain
```

### 5. Deploy the contract (in a new terminal)
```bash
npm run deploy
```
This writes the contract address and ABI to `src/config/deployment.json`.

### 6. Seed demo certificates (optional but recommended)
```bash
npm run seed:demo
```
Registers 7 demo certificates (including 1 revoked) on the local blockchain.

### 7. Start the frontend dev server
```bash
npm run dev
```
Visit: **http://localhost:5173**

---

## Demo Data

After running `npm run seed:demo`, the following certificate IDs are available:

| Certificate ID | Student | Status |
|---|---|---|
| CERT-2024-0001 | Rahul Sharma | ✅ Valid |
| CERT-2024-0002 | Priya Singh | ✅ Valid |
| CERT-2023-0101 | Aditya Kumar | ✅ Valid |
| CERT-2023-0202 | Sneha Patel | ✅ Valid |
| CERT-2022-0055 | Mohammed Al-Hassan | 🚫 Revoked |
| CERT-2024-0099 | Anjali Mehta | ✅ Valid |
| CERT-2024-1234 | Abdul Hanaan | ✅ Valid |

**Non-existent ID for testing:** `CERT-9999-XXXX`

---

## Running Tests

```bash
npm run test:contract
```

```
CertiChain — Smart Contract Tests
  Deployment
    ✓ Should set the owner correctly
    ✓ Should authorize owner as issuer by default
    ✓ Should start with zero certificates
  Issuer Management
    ✓ Owner can authorize a new issuer
    ✓ Stranger cannot authorize an issuer
    ✓ Owner can revoke an issuer
    ✓ Cannot revoke the owner
    ✓ Authorizing already-authorized issuer reverts
  Certificate Registration
    ✓ Authorized issuer can register a certificate
    ✓ Unauthorized address cannot register a certificate
    ✓ Duplicate certificate ID is rejected
    ✓ Empty certificate ID is rejected
    ✓ Zero document hash is rejected
  Certificate Retrieval
    ✓ getCertificate returns correct data
    ✓ getCertificate reverts for non-existent ID
    ✓ certificateExists_check returns true for registered cert
    ✓ certificateExists_check returns false for unregistered cert
    ✓ getCertificateIds returns paginated results
  Certificate Verification
    ✓ verifyCertificate returns exists=true for valid cert
    ✓ Correct document hash matches
    ✓ Incorrect document hash does not match
    ✓ verifyCertificate returns exists=false for unknown cert
  Certificate Revocation
    ✓ Authorized issuer can revoke a certificate
    ✓ Unauthorized address cannot revoke a certificate
    ✓ Revoking an already-revoked certificate fails
    ✓ Revoking without reason fails
    ✓ Revoked certificate shows isRevoked=true in verifyCertificate

27 passing (2s)
```

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| Dev server | `npm run dev` | Start Vite frontend dev server |
| Build | `npm run build` | TypeScript check + production build |
| Preview | `npm run preview` | Preview production build |
| Compile | `npm run compile` | Compile Solidity contract |
| Test | `npm run test:contract` | Run 27 Hardhat/Mocha tests |
| Chain | `npm run chain` | Start local Hardhat node |
| Deploy | `npm run deploy` | Deploy to localhost:8545 |
| Seed | `npm run seed:demo` | Seed 7 demo certificates |
| All-in-one | `npm run start` | Run chain + deploy + frontend concurrently |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (MetaMask)                │
│                                                     │
│   React + TypeScript + Vite + Tailwind CSS          │
│   ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│   │Dashboard │  │Register  │  │Verify Certificate│ │
│   └──────────┘  └──────────┘  └──────────────────┘ │
│         │              │                │           │
│         └──────────────┴────────────────┘           │
│                     Ethers.js v6                    │
└─────────────────────────────┬───────────────────────┘
                              │ JSON-RPC (localhost:8545)
                              │
┌─────────────────────────────▼───────────────────────┐
│           Hardhat Network (Chain ID: 31337)          │
│                                                     │
│        CertiChain.sol Smart Contract                │
│        0x5FbDB2315678afecb367f032d93F642f64180aa3   │
│                                                     │
│   • Certificate registration (write)                │
│   • Certificate retrieval (read)                    │
│   • Verification with hash check (read)             │
│   • Revocation (write)                              │
│   • Access control (owner + authorized issuers)     │
└─────────────────────────────────────────────────────┘
```

---

## Known Limitations

1. **Local blockchain only** — the Hardhat node is in-memory; certificates are lost if the node is restarted. For persistence, use a testnet (Sepolia) with a real RPC URL.
2. **MetaMask required** — the app requires MetaMask for write operations. Read operations work with a direct JSON-RPC connection to the Hardhat node.
3. **No IPFS** — document files are not stored on-chain or on IPFS; only the SHA-256 hash is stored.
4. **No pagination in contract events** — the app fetches all IDs and then batch-loads them; for very large datasets this would be slow.
