# CertiChain — Deployment & Network Integration Status

**Date:** October 19, 2026  
**Repository:** [https://github.com/beinghanaan5500/certichain-blockchain](https://github.com/beinghanaan5500/certichain-blockchain)  
**Production Frontend URL:** [https://certichain-blockchain-zeta.vercel.app](https://certichain-blockchain-zeta.vercel.app)

---

## 1. Current Network Architectures

CertiChain supports two operational modes:

### Mode A: Local Hardhat Development Node (Chain ID 31337)
- **Use Case:** Local offline development, demonstration, testing, and rapid contract updates on the developer machine.
- **RPC URL:** `http://127.0.0.1:8545`
- **Contract Address:** `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Deployer / Owner Account:** Hardhat Account #0 (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
- **Status:** Fully functional locally via `npm run start` or `npm run chain`.

### Mode B: Ethereum Sepolia Public Testnet (Chain ID 11155111)
- **Use Case:** Public Vercel demonstration accessible to any visitor worldwide without requiring a local blockchain process.
- **Verified RPC URLs (Live Audit):**
  - `https://ethereum-sepolia-rpc.publicnode.com` (✅ ONLINE, ~528ms, Block ~11,943,458)
  - `https://sepolia.drpc.org` (✅ ONLINE)
  - `https://gateway.tenderly.co/public/sepolia` (✅ ONLINE)
  - `https://1rpc.io/sepolia` (❌ **QUOTA EXHAUSTED**: HTTP 429 Too Many Requests)
  - `https://rpc.sepolia.org` (❌ **TIMEOUT**: Public endpoint unresponsive)
- **Block Explorer:** [https://sepolia.etherscan.io](https://sepolia.etherscan.io)
- **Security & Phishing Audit:** Resolved. Production HTTPS auto-defaults to Sepolia, preventing MetaMask localhost warnings and mixed content. Strict Content-Security-Policy header active on Vercel.
- **Status:** Deployment automation prepared via `scripts/deploy-sepolia.cjs`. Frontend build and tests clean (27/27 contract, 18/18 frontend). Live bundle on Vercel: `index-BP13w7Aj.js`.

---

## 2. Public Sepolia Deployment Guide

> [!IMPORTANT]
> A frontend deployment on Vercel hosts the web UI, but **does not deploy the Solidity smart contract**. For public visitors to interact with a live blockchain on the web, `CertiChain.sol` must be deployed to the Ethereum Sepolia Testnet.

### Step 1: Fund a Dedicated Development Wallet with SepoliaETH
1. Open MetaMask and create/select a dedicated development account.
2. Ensure you have at least `0.01 SepoliaETH` from any official faucet:
   - Google Cloud Web3 Faucet: [cloud.google.com/application/web3/faucet/ethereum/sepolia](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
   - Alchemy Sepolia Faucet: [sepoliafaucet.com](https://sepoliafaucet.com)
   - Chainlink Sepolia Faucet: [faucets.chain.link/sepolia](https://faucets.chain.link/sepolia)

### Step 2: Configure Local `.env`
Create a `.env` file in the project root:
```ini
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=your_development_wallet_private_key_without_quotes
ETHERSCAN_API_KEY=your_optional_etherscan_api_key
```

### Step 3: Run the Autonomous Sepolia Deployment Script
```bash
npm run deploy:sepolia
```
*What this script does:*
1. Compiles `contracts/CertiChain.sol`.
2. Deploys the contract to Ethereum Sepolia.
3. Automatically writes the deployed contract address, ABI, and Chain ID (`11155111`) to `src/config/deployment.json`.
4. Outputs the Sepolia Etherscan verification link.

### Step 4: Seed Demo Records (Optional)
```bash
npx hardhat run scripts/seed-demo.cjs --network sepolia
```

### Step 5: Configure Vercel Production Environment Variables
In the [Vercel Project Dashboard](https://vercel.com/dashboard) (`Settings` -> `Environment Variables`), configure:

| Variable Name | Production Value | Purpose |
|---|---|---|
| `VITE_CONTRACT_ADDRESS` | `0x<Your_Deployed_Sepolia_Address>` | Directs frontend to Sepolia contract |
| `VITE_CHAIN_ID` | `11155111` | Targets Ethereum Sepolia Testnet |
| `VITE_NETWORK_NAME` | `"Ethereum Sepolia"` | Displays network name in UI |
| `VITE_RPC_URL` | `https://ethereum-sepolia-rpc.publicnode.com` | Enables public read-only verification |

*Once configured, click **Redeploy** in Vercel to publish the live build.*
