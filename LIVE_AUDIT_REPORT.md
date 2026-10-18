# CertiChain — Live Audit & QA Engineering Report
**Document ID:** `LIVE_AUDIT_REPORT.md`  
**Audit Date:** October 19, 2026  
**Auditor:** Senior Blockchain QA Engineer  
**Repository:** [beinghanaan5500/certichain-blockchain](https://github.com/beinghanaan5500/certichain-blockchain)  
**Live Target:** [https://certichain-blockchain-zeta.vercel.app](https://certichain-blockchain-zeta.vercel.app)

---

## 1. Executive Summary & Audit Scope

This audit evaluated the complete **CertiChain** codebase and its live Vercel deployment to verify public operational readiness, determine blockers preventing third-party access, and outline prerequisites for transitioning from a local Hardhat environment (Chain ID `31337`) to the Ethereum Sepolia Testnet (Chain ID `11155111`).

### Scope of Inspection:
- **Smart Contracts:** [`contracts/CertiChain.sol`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/contracts/CertiChain.sol)
- **Deployment Scripts & Automation:** [`scripts/deploy.cjs`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/scripts/deploy.cjs), [`scripts/deploy-sepolia.cjs`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/scripts/deploy-sepolia.cjs), [`scripts/seed-demo.cjs`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/scripts/seed-demo.cjs)
- **Tooling Configuration:** [`hardhat.config.cjs`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/hardhat.config.cjs), [`vercel.json`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/vercel.json), [`package.json`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/package.json), `.env.example`
- **Frontend Core & State:** [`src/context/AppContext.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/context/AppContext.tsx), [`src/utils/contract.ts`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/utils/contract.ts), [`src/config/deployment.json`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/config/deployment.json)
- **Frontend Pages & Components:** [`src/pages/Dashboard.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/Dashboard.tsx), [`src/pages/RegisterCertificate.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/RegisterCertificate.tsx), [`src/pages/VerifyCertificate.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/VerifyCertificate.tsx), [`src/pages/Records.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/Records.tsx), [`src/pages/CertificateDetail.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/CertificateDetail.tsx), [`src/components/layout/Sidebar.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/components/layout/Sidebar.tsx)
- **Live Production Assets:** `https://certichain-blockchain-zeta.vercel.app/assets/index-CvFCWqh1.js`

---

## 2. Features Verified as Working

All items in this section have been **empirically executed and validated** in the current audit session:

### A. Smart Contract Logic (27 / 27 Tests Passing)
Execution command: `npx hardhat test`  
Result: **27 passing (2.0s), 0 failing**

1. **Deployment & Access Initialization:**
   - Contract deployer correctly set as `owner`.
   - Contract deployer automatically added to `authorizedIssuers` mapping.
   - Initial total certificates counter starts at exactly `0`.
2. **Issuer Authorization Management:**
   - Contract owner can authorize secondary issuers (`authorizeIssuer`) and emits `IssuerAuthorized`.
   - Non-owner addresses are strictly reverted (`"CertiChain: caller is not the owner"`).
   - Duplicate authorizations are rejected (`"CertiChain: already authorized"`).
   - Owner can revoke authorized issuers (`revokeIssuer`) and emits `IssuerRevoked`.
   - Contract owner cannot be revoked (`"CertiChain: cannot revoke owner"`).
3. **Certificate Registration Integrity:**
   - Authorized issuers can register certificates with metadata and `bytes32` document hashes. Emits `CertificateRegistered`.
   - Unwhitelisted addresses are reverted with `"CertiChain: caller is not an authorized issuer"`.
   - Duplicate certificate IDs are blocked (`"CertiChain: certificate ID already registered"`).
   - Empty certificate IDs, empty student names, empty course names, and empty institution strings are rejected with custom revert messages.
   - Zero document hash (`bytes32(0)`) is explicitly rejected (`"CertiChain: document hash cannot be zero"`).
4. **Certificate Lookup & Pagination:**
   - `getCertificate` returns exact on-chain struct fields matching input data.
   - `getCertificate` reverts with `"CertiChain: certificate ID does not exist"` for non-existent IDs.
   - `certificateExists_check` correctly returns boolean `true`/`false`.
   - `getCertificateIds(offset, limit)` accurately handles slicing and boundary limits.
5. **Certificate Verification & Cryptographic Matching:**
   - `verifyCertificate(certId, documentHash)` returns `exists=true`, `isRevoked`, `hashMatches`, and `registeredAt`.
   - Matching `bytes32` hash returns `hashMatches = true`.
   - Altered hash returns `hashMatches = false`.
   - Non-existent ID returns `exists = false`.
6. **Certificate Revocation Lifecycle:**
   - Authorized issuers can revoke existing certificates with a non-empty human-readable reason. Emits `CertificateRevoked`.
   - Unauthorized revocation attempts revert.
   - Double revocation of an already revoked certificate reverts (`"CertiChain: certificate already revoked"`).
   - Revocation without a reason string reverts (`"CertiChain: revocation reason required"`).
   - Subsequent verification accurately reflects `isRevoked = true`.

### B. Production Build Compilation & Asset Bundling
Execution command: `npm run build` (`tsc -p tsconfig.app.json && vite build`)  
Result: **Clean exit code 0 in 2.15s**
- TypeScript type check passed without errors.
- Output artifacts generated:
  - `dist/index.html` (1.39 kB)
  - `dist/assets/index-DnCUCDho.css` (13.75 kB)
  - `dist/assets/index-CvFCWqh1.js` (606.14 kB)
- Note: The generated bundle hash `index-CvFCWqh1.js` is identical to the one currently live on Vercel.

### C. Client-Side Cryptographic Document Hashing
- Tested implementation: `hashFile` in [`src/utils/contract.ts`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/utils/contract.ts#L129-L135).
- Uses standard W3C Web Cryptography API (`crypto.subtle.digest('SHA-256', buffer)`).
- Produces clean `0x`-prefixed 64-character hexadecimal `bytes32` representation compatible with EVM storage.

---

## 3. Features That Fail on Live Deployment

The live website at `https://certichain-blockchain-zeta.vercel.app` is currently **non-functional for all external users**. The failures are detailed below:

| Feature | Live Status | Exact Manifestation |
| :--- | :--- | :--- |
| **Public Dashboard (Read-Only)** | **FAIL** | Displays 0 certificates, "Block Number: —", and empty recent certificates table. |
| **MetaMask Wallet Connection** | **BLOCKED** | Connecting wallet displays persistent banner: `⚠ Wrong network — switch to Localhost 8545 (Chain ID: 31337)`. |
| **Certificate Verification** | **FAIL** | Entering any certificate ID returns error banner: `"Cannot connect to the blockchain. Ensure the Hardhat node is running."` |
| **All Records Exploration** | **FAIL** | Table remains empty indefinitely; displays `"Contract not deployed. Run the Hardhat node and deploy first."` |
| **Certificate Registration** | **BLOCKED** | Submission disabled with: `"Wrong network. Switch MetaMask to Localhost 8545 (Chain ID: 31337)"`. |
| **Certificate Revocation** | **BLOCKED** | Cannot load certificate details or submit revocation transactions. |

---

## 4. Features Not Yet Tested

Due to the absence of a deployed testnet contract and funded testnet wallet in the local environment, the following could not be verified on a public chain:
1. **Live Ethereum Sepolia Transaction Confirmation:** Actual block mining and transaction receipt handling via an external RPC.
2. **MetaMask Transaction Signing on Public Testnet:** Gas estimation and signature approval prompts for `registerCertificate` and `revokeCertificate` on Chain ID `11155111`.
3. **Etherscan Automated Verification on Sepolia:** Verifying Solidity source code on `sepolia.etherscan.io` using the Hardhat Etherscan plugin.

---

## 5. Exact Errors and Their Technical Causes

### Blocker 1: Live Frontend Bundle Has Hardcoded Hardhat Localhost Settings
- **Location:** [`src/config/deployment.json`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/config/deployment.json#L1-L6) and [`dist/assets/index-CvFCWqh1.js`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/dist/assets/index-CvFCWqh1.js).
- **Cause:** Vite resolves `import.meta.env.*` variables at build time. When Vercel built the project, no environment variables (`VITE_CONTRACT_ADDRESS`, `VITE_CHAIN_ID`, `VITE_RPC_URL`, `VITE_NETWORK_NAME`) were configured in the Vercel dashboard. Consequently, the build fell back to [`src/config/deployment.json`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/config/deployment.json).
- **Proof:** Ripgrep inspection of the deployed bundle (`index-CvFCWqh1.js`) confirms the presence of:
  - Chain ID: `31337`
  - Contract Address: `0x5FbDB2315678afecb367f032d93F642f64180aa3` (Hardhat Account #0 default deployment)
  - RPC URL: `http://127.0.0.1:8545`

### Blocker 2: Mixed Content & Private Network Access Failure
- **Location:** [`src/utils/contract.ts:72-102`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/utils/contract.ts#L72-L102) (`getReadOnlyProvider`).
- **Cause:** When an external user visits the HTTPS site, `contract.ts` detects `targetChainId === 31337` and populates `candidateUrls` with `['http://127.0.0.1:8545', 'http://localhost:8545']`.
- **Errors Triggered:**
  1. **Mixed Content Security Violation:** Modern browsers block insecure HTTP requests initiated from secure HTTPS origins.
  2. **Connection Refusal (`ERR_CONNECTION_REFUSED`):** Visitors do not run a local EVM node on port 8545, causing immediate socket rejection.
- **Consequence:** `getReadOnlyProvider()` returns `null`. The application is completely severed from any blockchain data source.

### Blocker 3: Network Check Enforces Hardhat Localhost
- **Location:** [`src/utils/contract.ts:49-56`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/utils/contract.ts#L49-L56) (`isCorrectNetwork`).
- **Cause:** `getTargetChainId()` returns `31337`. If a user connects MetaMask on Sepolia (`11155111`) or Mainnet (`1`), `isCorrectNetwork` returns `false`.
- **Consequence:** The UI displays wrong network warnings and aborts transactions before submitting them.

### Blocker 4: Missing Programmatic Network Switching
- **Location:** [`src/context/AppContext.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/context/AppContext.tsx) & [`src/components/layout/Sidebar.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/components/layout/Sidebar.tsx).
- **Cause:** The frontend lacks calls to `wallet_switchEthereumChain` and `wallet_addEthereumChain`.
- **Consequence:** Users are not prompted to switch networks automatically. They must manually configure and switch networks inside MetaMask.

### Blocker 5: Hardcoded "Hardhat node" Error Text in Production UI
- **Location:**
  - [`src/pages/VerifyCertificate.tsx:44`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/VerifyCertificate.tsx#L44): `"Cannot connect to the blockchain. Ensure the Hardhat node is running."`
  - [`src/pages/VerifyCertificate.tsx:113`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/VerifyCertificate.tsx#L113): `"Start the Hardhat node and deploy the contract first."`
  - [`src/pages/Records.tsx:94`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/Records.tsx#L94): `"Contract not deployed. Run the Hardhat node and deploy first."`
  - [`src/pages/AboutProject.tsx:40`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/AboutProject.tsx#L40): `"Local demonstration requires Hardhat node running continuously"`

---

## 6. Files That Need Changes

| File | Target Lines / Section | Required Modification |
| :--- | :--- | :--- |
| [`src/config/deployment.json`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/config/deployment.json) | Lines 2–6 | Update `contractAddress`, `chainId` (`11155111`), `networkName` (`"sepolia"`), and `deployerAddress` once deployed on Sepolia. |
| [`src/utils/contract.ts`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/utils/contract.ts) | Lines 72–102, 168–178 | Add programmatic network switching (`switchOrAddNetwork`) using `wallet_switchEthereumChain` and `wallet_addEthereumChain`. Ensure read-only provider cleanly falls back to reliable Sepolia RPC endpoints. |
| [`src/context/AppContext.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/context/AppContext.tsx) | Lines 8–16, 82–104 | Expose `switchNetwork` function to allow one-click network switching from the UI. |
| [`src/components/layout/Sidebar.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/components/layout/Sidebar.tsx) | Lines 100–105 | Replace static text warning with an interactive **"Switch to Sepolia"** button. |
| [`src/pages/Dashboard.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/Dashboard.tsx) | Lines 113–120 | Add interactive **"Switch Network"** action inside the alert banner. |
| [`src/pages/VerifyCertificate.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/VerifyCertificate.tsx) | Lines 44, 113 | Update error messages from "Ensure Hardhat node is running" to network-aware messages (e.g. "Connecting to Ethereum Sepolia..."). |
| [`src/pages/Records.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/Records.tsx) | Line 94 | Update generic un-deployed warning to network-aware copy. |
| [`src/pages/RegisterCertificate.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/RegisterCertificate.tsx) | Lines 88–96 | Provide one-click network switch prompt before registration. |
| [`hardhat.config.cjs`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/hardhat.config.cjs) | Lines 27–32, 33–35 | Verify Sepolia gas settings and confirm Etherscan API configuration format. |

---

## 7. Recommended Fixes in Priority Order

### Priority 1: Deploy CertiChain to Ethereum Sepolia Testnet
- Obtain a dedicated deployer wallet with at least `0.01 SepoliaETH` from a faucet.
- Run the existing script: `npx hardhat run scripts/deploy-sepolia.cjs --network sepolia`.
- This script automatically updates [`src/config/deployment.json`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/config/deployment.json) with the real Sepolia address, chain ID `11155111`, and ABI.

### Priority 2: Configure Vercel Production Environment Variables
In the Vercel Project Dashboard (`Settings` -> `Environment Variables`), configure:
- `VITE_CONTRACT_ADDRESS` = `0x<Deployed_Sepolia_Contract_Address>`
- `VITE_CHAIN_ID` = `11155111`
- `VITE_NETWORK_NAME` = `"Ethereum Sepolia"`
- `VITE_RPC_URL` = `https://ethereum-sepolia-rpc.publicnode.com`

*Trigger a redeployment on Vercel so Vite bakes these production variables into the build.*

### Priority 3: Implement Seamless MetaMask Network Switch / Add
Implement `switchOrAddNetwork` using `window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] })`. If error code `4902` (chain not added) is returned, call `wallet_addEthereumChain` with Sepolia testnet parameters. Add a "Switch to Sepolia" button directly in [`Sidebar.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/components/layout/Sidebar.tsx) and [`Dashboard.tsx`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/pages/Dashboard.tsx).

### Priority 4: Modernize UI Copy
Replace Hardhat-specific references ("Hardhat node is running") with dynamic network messaging referencing the active network name (`getTargetNetworkName()`).

---

## 8. Steps Required to Deploy and Test on Sepolia

> [!IMPORTANT]
> Never commit private keys to GitHub or expose them in shared chat prompts. Always place private keys in a local `.env` file that is listed in `.gitignore`.

### Step 1: Pre-Flight Wallet Setup
1. Create a dedicated development account in MetaMask (do not use a personal mainnet account).
2. Export the private key: `Account Details -> Show Private Key`.
3. Fund the account with free SepoliaETH from any of these faucets:
   - Google Cloud Web3 Faucet: `https://cloud.google.com/application/web3/faucet/ethereum/sepolia`
   - Alchemy Sepolia Faucet: `https://sepoliafaucet.com`
   - Chainlink Sepolia Faucet: `https://faucets.chain.link/sepolia`
   - Infura Sepolia Faucet: `https://www.infura.io/faucet/sepolia`

### Step 2: Configure Local `.env`
Create a `.env` file in the project root:
```ini
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=0x<your_64_hex_character_private_key>
ETHERSCAN_API_KEY=<optional_etherscan_api_key>
```

### Step 3: Execute Deployment
Run the deployment script:
```bash
npm run deploy:sepolia
```
*Expected script behavior:*
1. Checks wallet balance (requires ≥ 0.005 SepoliaETH).
2. Deploys `CertiChain.sol` to Sepolia.
3. Automatically overwrites [`src/config/deployment.json`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/config/deployment.json) with:
   - Real Sepolia contract address
   - `chainId: 11155111`
   - `networkName: "sepolia"`
   - Contract ABI
4. Outputs the contract Etherscan link: `https://sepolia.etherscan.io/address/<CONTRACT_ADDRESS>`

### Step 4: Seed Initial Records (Optional)
To seed initial demo certificates on Sepolia for demonstration:
```bash
npx hardhat run scripts/seed-demo.cjs --network sepolia
```

### Step 5: Verify Contract Source on Etherscan (Optional)
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Step 6: Deploy to Vercel
1. Set the 4 environment variables in the Vercel dashboard.
2. Commit and push the updated [`src/config/deployment.json`](file:///c:/Users/Abdul%20Hanaan/OneDrive/Desktop/blockchain%20pro/src/config/deployment.json).
3. Vercel builds and publishes the production bundle.
4. Open the live URL on any browser without Hardhat running:
   - Dashboard loads total certificate count and block number via public Sepolia RPC.
   - Verifying any seeded certificate ID immediately displays the record and integrity status.
   - Connecting MetaMask on Sepolia allows immediate registration of new student certificates.

---

*Report compiled and certified by Senior Blockchain QA Engineer.*
