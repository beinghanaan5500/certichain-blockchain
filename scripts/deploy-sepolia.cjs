/**
 * scripts/deploy-sepolia.cjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Autonomous deployment script for Ethereum Sepolia testnet.
 * Includes pre-flight safety checks (private key presence, balance check,
 * faucet links if empty, artifact verification, and deployment.json update).
 * ─────────────────────────────────────────────────────────────────────────────
 */

require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n========================================================");
  console.log("🌐  CertiChain — Ethereum Sepolia Deployment");
  console.log("========================================================\n");

  // 1. Verify Private Key
  const privateKey = process.env.PRIVATE_KEY || process.env.SEPOLIA_PRIVATE_KEY;
  if (!privateKey || privateKey.includes("your_sepolia_wallet_private_key")) {
    console.error("❌ ERROR: No deployer PRIVATE_KEY found in .env or environment variables!");
    console.error("\nTo deploy to Sepolia:");
    console.error("1. Create a .env file in the project root (see .env.example)");
    console.error("2. Add PRIVATE_KEY=0x... (from your MetaMask test wallet)");
    console.error("3. Add SEPOLIA_RPC_URL=https://rpc.sepolia.org (or Alchemy/Infura URL)");
    console.error("4. Ensure your wallet has Sepolia testnet ETH\n");
    process.exit(1);
  }

  // 2. Check Signer & Balance
  const [deployer] = await ethers.getSigners();
  console.log(`📋 Deployer Address : ${deployer.address}`);

  const network = await ethers.provider.getNetwork();
  console.log(`🔗 Network Chain ID : ${network.chainId} (Sepolia)`);

  const balance = await ethers.provider.getBalance(deployer.address);
  const ethBalance = parseFloat(ethers.formatEther(balance));
  console.log(`💰 Deployer Balance : ${ethBalance.toFixed(5)} SepoliaETH\n`);

  if (ethBalance < 0.005) {
    console.error("⚠️  WARNING: Deployer balance is critically low or zero!");
    console.error("Deploying CertiChain requires approx 0.005 - 0.02 SepoliaETH for gas.\n");
    console.error("Please get free Sepolia testnet ETH from any of these faucets:");
    console.error("  • Google Cloud Web3 Faucet : https://cloud.google.com/application/web3/faucet/ethereum/sepolia");
    console.error("  • Alchemy Sepolia Faucet   : https://sepoliafaucet.com/");
    console.error("  • Chainlink Faucets        : https://faucets.chain.link/sepolia");
    console.error("  • Infura Sepolia Faucet    : https://www.infura.io/faucet/sepolia\n");
    if (ethBalance === 0) {
      console.error("❌ Cannot proceed with 0 ETH balance. Aborting deployment.");
      process.exit(1);
    }
  }

  // 3. Compile and Deploy
  console.log("⏳ Deploying CertiChain smart contract to Sepolia...");
  const CertiChain = await ethers.getContractFactory("CertiChain");
  const certichain = await CertiChain.deploy();
  await certichain.waitForDeployment();

  const contractAddress = await certichain.getAddress();
  console.log(`\n🎉 CertiChain successfully deployed at: ${contractAddress}`);
  console.log(`🔍 Sepolia Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);

  // 4. Update src/config/deployment.json
  const configDir = path.join(__dirname, "..", "src", "config");
  const configPath = path.join(configDir, "deployment.json");
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "CertiChain.sol", "CertiChain.json");

  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifact.abi;
  }

  const deploymentInfo = {
    contractAddress,
    chainId: 11155111,
    networkName: "sepolia",
    deployedAt: new Date().toISOString(),
    deployerAddress: deployer.address,
    abi,
  };

  fs.writeFileSync(configPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Updated frontend config : ${configPath}`);

  // 5. Verify contract state
  const total = await certichain.getTotalCertificates();
  console.log(`📊 Initial certificates on Sepolia: ${total}`);
  console.log(`👑 Contract Owner: ${await certichain.owner()}`);

  console.log("\n========================================================");
  console.log("🚀 NEXT STEPS FOR VERCEL DEPLOYMENT:");
  console.log("1. Add these Environment Variables to your Vercel Project:");
  console.log(`   VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`   VITE_CHAIN_ID=11155111`);
  console.log(`   VITE_NETWORK_NAME="Ethereum Sepolia"`);
  console.log(`   VITE_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com`);
  console.log("2. Run 'npm run build' and push to GitHub or deploy via Vercel CLI");
  console.log("========================================================\n");
}

main().catch((err) => {
  console.error("❌ Sepolia deployment failed:", err.message || err);
  process.exitCode = 1;
});
