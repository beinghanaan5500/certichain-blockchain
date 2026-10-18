# CertiChain — Quality Assurance & Testing Report

**Date:** October 19, 2026  
**QA Lead:** Senior Full-Stack & Blockchain QA Engineer  
**Status:** ALL 45 AUTOMATED TESTS PASSING (27 Contract + 18 Frontend)  
**Production Build:** Clean exit code 0 (1.27s build time)

---

## 1. Test Execution Summary

| Test Category | Framework | Tests Executed | Passed | Failed | Status |
|---|---|---|---|---|---|
| **Smart Contract Logic** | Hardhat / Mocha / Chai | 27 | 27 | 0 | **PASSED** |
| **Frontend Unit & Utils** | Vitest | 18 | 18 | 0 | **PASSED** |
| **TypeScript Compilation** | tsc (tsconfig.app.json) | Full Workspace | Complete | 0 | **PASSED** |
| **Production Bundle** | Vite 8 (Rollup) | 2,088 modules | Complete | 0 | **PASSED** |

---

## 2. Smart Contract Test Coverage (27 / 27 Passing)

Command: `npm run test:contract`

### A. Deployment Suite
- `Should set the owner correctly` (PASS)
- `Should authorize owner as issuer by default` (PASS)
- `Should start with zero certificates` (PASS)

### B. Issuer Management Suite
- `Owner can authorize a new issuer` (PASS)
- `Stranger cannot authorize an issuer` (PASS)
- `Owner can revoke an issuer` (PASS)
- `Cannot revoke the owner` (PASS)
- `Authorizing already-authorized issuer reverts` (PASS)

### C. Certificate Registration Suite
- `Authorized issuer can register a certificate` (PASS)
- `Unauthorized address cannot register a certificate` (PASS)
- `Duplicate certificate ID is rejected` (PASS)
- `Empty certificate ID is rejected` (PASS)
- `Zero document hash is rejected` (PASS)

### D. Certificate Retrieval Suite
- `getCertificate returns correct data` (PASS)
- `getCertificate reverts for non-existent ID` (PASS)
- `certificateExists_check returns true for registered cert` (PASS)
- `certificateExists_check returns false for unregistered cert` (PASS)
- `getCertificateIds returns paginated results` (PASS)

### E. Certificate Verification Suite
- `verifyCertificate returns exists=true for valid cert` (PASS)
- `Correct document hash matches` (PASS)
- `Incorrect document hash does not match` (PASS)
- `verifyCertificate returns exists=false for unknown cert` (PASS)

### F. Certificate Revocation Suite
- `Authorized issuer can revoke a certificate` (PASS)
- `Unauthorized address cannot revoke a certificate` (PASS)
- `Revoking an already-revoked certificate fails` (PASS)
- `Revoking without reason fails` (PASS)
- `Revoked certificate shows isRevoked=true in verifyCertificate` (PASS)

---

## 3. Frontend Unit & Utilities Test Coverage (18 / 18 Passing)

Command: `npm run test:unit`

### A. Formatting Utilities
- `formatAddress shortens 42-char EVM addresses properly` (PASS)
- `formatAddress handles empty or short input gracefully` (PASS)
- `formatHash shortens 66-char bytes32 hashes properly` (PASS)
- `formatDate formats valid timestamps into human-readable strings` (PASS)
- `formatDate handles BigInt timestamps` (PASS)
- `formatTimestamp formats date and time` (PASS)

### B. Network Configuration & Detection
- `includes configurations for Sepolia and Localhost` (PASS)
- `isCorrectNetwork returns false for null or undefined chainId` (PASS)

### C. Input Validation: Certificate ID
- `accepts valid alphanumeric ID formats with hyphens and slashes` (PASS)
- `rejects empty Certificate IDs` (PASS)
- `rejects Certificate IDs that are too short` (PASS)
- `rejects Certificate IDs with invalid characters` (PASS)

### D. Input Validation: Grade / CGPA
- `accepts valid grades and CGPA strings` (PASS)
- `rejects empty grade input` (PASS)

### E. Contract Error Parser
- `translates unauthorized issuer revert to friendly message` (PASS)
- `translates duplicate certificate ID revert to friendly message` (PASS)
- `translates user rejection to clear message` (PASS)
- `translates pending request to clear message` (PASS)

---

## 4. Manual QA Verification Checklist

| Scenario | Expected Behavior | Observed Result |
|---|---|---|
| **No MetaMask Installed** | Opens Web3 Wallet Assistant modal with download link; no raw alert | Confirmed |
| **Form Continuous Typing** | Typing in Student Name, Degree, Institution preserves input focus | Confirmed (component unmounting bug eliminated) |
| **Duplicate ID Pre-check** | Blur on Certificate ID checks on-chain presence before submit | Confirmed |
| **Wrong Network Connection** | Displays warning with one-click "Switch to Target" button | Confirmed |
| **Document Hashing** | Drops PDF/image and produces 64-char SHA-256 hash client-side | Confirmed |
| **Document Hash Comparison** | Highlights exact match (green) or altered file (red) | Confirmed |
| **CSV Export** | Exports all filtered ledger records as clean CSV | Confirmed |
| **Revocation Safeguards** | Only authorized issuers can view/trigger revocation confirmation | Confirmed |
| **Mobile Drawer Navigation** | Top navigation bar and responsive hamburger drawer work smoothly | Confirmed |
