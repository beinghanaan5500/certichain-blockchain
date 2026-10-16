import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting CertiChain deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`📋 Deployer address : ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance : ${ethers.formatEther(balance)} ETH\n`);

  // Deploy the contract
  const CertiChain = await ethers.getContractFactory("CertiChain");
  const certichain = await CertiChain.deploy();
  await certichain.waitForDeployment();

  const contractAddress = await certichain.getAddress();
  console.log(`✅ CertiChain deployed at: ${contractAddress}`);

  // Retrieve network info
  const network = await ethers.provider.getNetwork();
  console.log(`🔗 Network          : ${network.name} (chainId: ${network.chainId})\n`);

  // Save deployment info to src/config/deployment.json
  const configDir  = path.join(__dirname, "..", "src", "config");
  const configPath = path.join(configDir, "deployment.json");

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Load ABI from artifacts
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "CertiChain.sol",
    "CertiChain.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const deploymentInfo = {
    contractAddress,
    chainId:       Number(network.chainId),
    networkName:   network.name === "unknown" ? "localhost" : network.name,
    deployedAt:    new Date().toISOString(),
    deployerAddress: deployer.address,
    abi:           artifact.abi,
  };

  fs.writeFileSync(configPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment config saved to: ${configPath}`);

  // Verify initial state
  const total = await certichain.getTotalCertificates();
  console.log(`\n📊 Initial certificate count: ${total}`);
  console.log(`👑 Owner: ${await certichain.owner()}`);
  console.log(`\n✨ Deployment complete!\n`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
