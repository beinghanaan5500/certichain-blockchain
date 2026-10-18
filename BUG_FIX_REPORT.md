# CertiChain — Bug Fix & Engineering Audit Report

**Date:** October 19, 2026  
**Auditor / Engineer:** Senior Full-Stack & Blockchain Engineer  
**Repository:** [beinghanaan5500/certichain-blockchain](https://github.com/beinghanaan5500/certichain-blockchain)  
**Target Live Deployment:** [https://certichain-blockchain-zeta.vercel.app](https://certichain-blockchain-zeta.vercel.app)

---

## 1. Executive Summary

A comprehensive engineering pass was performed across the CertiChain application. The audit addressed the root causes of the live issues, including the MetaMask detection error, focus loss during certificate input, lack of programmatic network switching, miscalculated dashboard statistics, and production RPC connectivity.

---

## 2. Issues Identified and Resolved

### Bug 1: Abrasive "MetaMask not found" Browser Alert
* **Symptom:** When clicking "Register Certificate" or "Connect MetaMask" in browsers without pre-injected wallets, the app fired an unformatted native browser `alert('MetaMask not found. Please install MetaMask to use this app.')`.
* **Root Cause:** In [`src/context/AppContext.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/context/AppContext.tsx), `connectWallet()` directly checked `(window as any).ethereum` and called `alert()`.
* **Fix:** Replaced with a non-blocking `WalletModal` dialog. The modal detects missing extensions, explains Web3 requirements, and provides direct install links for desktop (`https://metamask.io/download/`) and mobile in-app browser instructions.

### Bug 2: Focus Loss / Single-Character Typing Bug on Form Input
* **Symptom:** Typing into any field in the Certificate Registration form caused the input to lose focus after every single character.
* **Root Cause:** In [`src/pages/RegisterCertificate.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/RegisterCertificate.tsx), the `Field` input component was declared **inside** the body of `RegisterCertificate()`. On every state update (`setForm`), React treated `Field` as an entirely new component type, completely unmounting and remounting the input DOM node.
* **Fix:** Extracted `InputField` outside the page component with typed props. Continuous typing is now smooth and focus is strictly preserved.

### Bug 3: Missing Programmatic Network Switching
* **Symptom:** Connecting a wallet on the wrong chain (e.g. Mainnet, Polygon, or Arbitrum instead of Ethereum Sepolia/Localhost) displayed a passive warning text without offering a way to switch.
* **Root Cause:** No calls to `wallet_switchEthereumChain` or `wallet_addEthereumChain` existed in the codebase.
* **Fix:** Implemented `switchOrAddNetwork(targetChainId)` in [`src/utils/contract.ts`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/utils/contract.ts). When invoked, it prompts MetaMask to switch to the target chain and automatically adds network metadata if error `4902` is returned. Interactive "Switch Network" buttons were integrated into the Sidebar, Dashboard, and Register pages.

### Bug 4: Misleading Dashboard Active & Revoked Counts
* **Symptom:** In [`src/pages/Dashboard.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/Dashboard.tsx), the "Active Certs" and "Revoked Certs" KPI cards calculated stats solely from `recentCerts` (which only sliced the last 5 certificates).
* **Root Cause:** `recentCerts.filter(c => !c.isRevoked).length` was used instead of querying all registered certificates.
* **Fix:** Updated `loadDashboardData()` to enumerate all registered certificates up to the total count, accurately tabulating active and revoked credentials.

### Bug 5: Missing Issuer Authorization Warning Upfront
* **Symptom:** Any connected wallet (including guest verifiers) could fill out the registration form and click submit, only to experience an unhandled smart contract revert or gas estimation failure.
* **Root Cause:** No check against `authorizedIssuers(wallet.address)` or contract `owner()` existed before initiating the transaction.
* **Fix:** Added `isAuthorizedIssuer` and `isOwner` to `WalletState`. The registration page now inspects issuer status and shows a role banner, preventing unauthorized users from submitting gas-wasting transactions.

### Bug 6: Insecure Injected Provider Multi-Wallet Conflict
* **Symptom:** In browsers with multiple Web3 extensions (MetaMask, Coinbase, Phantom, Rabby), `window.ethereum` could point to a non-MetaMask provider or fail to expose event listeners.
* **Root Cause:** Direct unverified reference to `(window as any).ethereum`.
* **Fix:** Created `getInjectedProvider()` in [`src/utils/contract.ts`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/utils/contract.ts) which safely parses `window.ethereum.providers` array and selects the MetaMask provider if present.

### Bug 7: Hardcoded "Hardhat node" Error Messaging in Production
* **Symptom:** Public visitors on Vercel were told "Start the Hardhat node" even when targeted at Sepolia or public testnets.
* **Fix:** Made all diagnostic and error strings network-aware via `getTargetNetworkName()`, displaying clear instructions relevant to the active chain.

---

## 3. Files Modified and Created

| File | Status | Description |
|---|---|---|
| [`src/types/index.ts`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/types/index.ts) | Modified | Added `isAuthorizedIssuer`, `isOwner`, `WalletError`, and `NetworkConfig` types. |
| [`src/utils/contract.ts`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/utils/contract.ts) | Modified | Added multi-wallet detection, programmatic network switching, error parser, and validation utilities. |
| [`src/context/AppContext.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/context/AppContext.tsx) | Modified | Removed `alert()`, added `WalletModal` control, issuer role checks, and error clearing. |
| [`src/components/ui/WalletModal.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/components/ui/WalletModal.tsx) | Created | Web3 wallet assistant modal with installation guidance and network switcher. |
| [`src/components/layout/Sidebar.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/components/layout/Sidebar.tsx) | Modified | Academic branding, interactive network switcher, responsive mobile drawer. |
| [`src/pages/RegisterCertificate.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/RegisterCertificate.tsx) | Modified | Fixed typing bug, pre-check duplicate ID, role verification, transaction status. |
| [`src/pages/VerifyCertificate.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/VerifyCertificate.tsx) | Modified | URL query parameter lookup, document hash comparison, valid/revoked badges. |
| [`src/pages/CertificateDetail.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/CertificateDetail.tsx) | Modified | Role-enforced revocation workflow, cryptographic hash checker, explorer links. |
| [`src/pages/Records.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/Records.tsx) | Modified | Search across multiple fields, sorting, CSV export, responsive card layout. |
| [`src/pages/Dashboard.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/Dashboard.tsx) | Modified | Accurate statistics, quick actions, zero-state handling, diagnostic alerts. |
| [`src/pages/AboutProject.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/AboutProject.tsx) | Modified | Responsive layout, dual network descriptions. |
| [`src/pages/NotFound.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/NotFound.tsx) | Modified | High-contrast accessible typography. |
| [`src/index.css`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/index.css) | Modified | Responsive media queries for mobile top navigation bar. |
| [`src/App.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/App.tsx) | Modified | Added top-level `WalletModal`. |
| [`package.json`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/package.json) | Modified | Added `vitest` dependency and test scripts (`test:unit`, `test`). |
| [`test/frontend.test.ts`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/test/frontend.test.ts) | Created | 18 automated unit tests for validation, formatting, error parsing, and networks. |
