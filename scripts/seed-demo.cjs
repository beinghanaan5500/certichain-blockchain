/**
 * scripts/seed-demo.cjs
 * ─────────────────────────────────────────────────────
 * Seeds the deployed CertiChain contract with demo certificates.
 * Run AFTER deploying the contract:
 *
 *   npx hardhat run scripts/seed-demo.cjs --network localhost
 *
 * Includes valid, and revoked certificate examples.
 */

const { ethers } = require("hardhat");
const fs          = require("fs");
const path        = require("path");

// ── Helper: fake SHA-256 bytes32 from a string ───────────────────────────────
function fakeHash(seed) {
  return ethers.keccak256(ethers.toUtf8Bytes("certichain-demo-doc:" + seed));
}

// ── Demo certificate data ─────────────────────────────────────────────────────
const DEMO_CERTS = [
  {
    certId:      "CERT-2024-0001",
    studentName: "Rahul Sharma",
    courseName:  "B.Tech Computer Science & Engineering (AI/ML)",
    institution: "National Institute of Technology, Trichy",
    grade:       "9.2 CGPA",
    issueDate:   new Date("2024-05-15").getTime() / 1000,
    revoke:      false,
  },
  {
    certId:      "CERT-2024-0002",
    studentName: "Priya Singh",
    courseName:  "M.Tech Data Science & Machine Learning",
    institution: "Indian Institute of Technology, Delhi",
    grade:       "8.7 CGPA",
    issueDate:   new Date("2024-06-01").getTime() / 1000,
    revoke:      false,
  },
  {
    certId:      "CERT-2023-0101",
    studentName: "Aditya Kumar",
    courseName:  "B.Sc. Cybersecurity & Ethical Hacking",
    institution: "Delhi University",
    grade:       "A+ (Distinction)",
    issueDate:   new Date("2023-11-20").getTime() / 1000,
    revoke:      false,
  },
  {
    certId:      "CERT-2023-0202",
    studentName: "Sneha Patel",
    courseName:  "MBA Business Analytics",
    institution: "IIM Ahmedabad",
    grade:       "3.9 / 4.0 GPA",
    issueDate:   new Date("2023-04-30").getTime() / 1000,
    revoke:      false,
  },
  {
    certId:      "CERT-2022-0055",
    studentName: "Mohammed Al-Hassan",
    courseName:  "B.E. Electronics & Communication Engineering",
    institution: "Anna University, Chennai",
    grade:       "8.1 CGPA",
    issueDate:   new Date("2022-07-10").getTime() / 1000,
    revoke:      true,  // This one will be revoked
    revokeReason: "Certificate found to contain falsified grade records",
  },
  {
    certId:      "CERT-2024-0099",
    studentName: "Anjali Mehta",
    courseName:  "B.Com Accounting & Finance",
    institution: "Symbiosis International University",
    grade:       "First Class with Distinction",
    issueDate:   new Date("2024-03-22").getTime() / 1000,
    revoke:      false,
  },
  {
    certId:      "CERT-2024-1234",
    studentName: "Abdul Hanaan",
    courseName:  "B.Tech Information Technology (Blockchain & DApps)",
    institution: "Jawaharlal Nehru Technological University",
    grade:       "9.5 CGPA",
    issueDate:   new Date("2024-10-15").getTime() / 1000,
    revoke:      false,
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Starting CertiChain demo data seeding...\n");

  // Load deployment config to get contract address
  const configPath = path.join(__dirname, "..", "src", "config", "deployment.json");
  if (!fs.existsSync(configPath)) {
    throw new Error(
      "deployment.json not found. Run `npm run deploy` first before seeding."
    );
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (!config.contractAddress) {
    throw new Error(
      "No contract address in deployment.json. Deploy the contract first."
    );
  }

  console.log(`📌 Contract address : ${config.contractAddress}`);

  // Load the ABI from artifacts
  const artifactPath = path.join(
    __dirname, "..", "artifacts", "contracts", "CertiChain.sol", "CertiChain.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const [deployer, issuer2] = await ethers.getSigners();
  console.log(`👤 Deployer / owner : ${deployer.address}`);
  console.log(`👤 Issuer 2         : ${issuer2.address}\n`);

  // Attach to the deployed contract
  const certichain = new ethers.Contract(config.contractAddress, artifact.abi, deployer);

  // Authorize issuer2 so some certs are issued by a different signer
  try {
    const alreadyAuth = await certichain.authorizedIssuers(issuer2.address);
    if (!alreadyAuth) {
      const tx = await certichain.authorizeIssuer(issuer2.address);
      await tx.wait();
      console.log(`✅ Authorized issuer2 (${issuer2.address})`);
    } else {
      console.log(`ℹ️  issuer2 already authorized`);
    }
  } catch (e) {
    console.log(`⚠️  Could not authorize issuer2: ${e.message}`);
  }

  console.log("\n📄 Registering demo certificates:\n");

  for (let i = 0; i < DEMO_CERTS.length; i++) {
    const cert = DEMO_CERTS[i];

    // Alternate the signer between owner and issuer2
    const signer = i % 3 === 0 ? issuer2 : deployer;
    const contract = certichain.connect(signer);

    // Check if already registered (idempotent)
    const exists = await certichain.certificateExists_check(cert.certId);
    if (exists) {
      console.log(`  ⏭  ${cert.certId} — already registered, skipping`);
      continue;
    }

    const docHash = fakeHash(cert.certId);

    try {
      const tx = await contract.registerCertificate(
        cert.certId,
        cert.studentName,
        cert.courseName,
        cert.institution,
        cert.grade,
        BigInt(Math.floor(cert.issueDate)),
        docHash
      );
      await tx.wait();
      console.log(`  ✅ Registered : ${cert.certId} — ${cert.studentName}`);
    } catch (err) {
      console.error(`  ❌ Failed     : ${cert.certId} — ${err.message}`);
      continue;
    }

    // Revoke if flagged
    if (cert.revoke) {
      try {
        const tx2 = await certichain.revokeCertificate(cert.certId, cert.revokeReason);
        await tx2.wait();
        console.log(`     🚫 Revoked  : ${cert.certId} — "${cert.revokeReason}"`);
      } catch (err) {
        console.error(`     ⚠️  Could not revoke ${cert.certId}: ${err.message}`);
      }
    }
  }

  const total = await certichain.getTotalCertificates();
  console.log(`\n📊 Total certificates on-chain : ${total}`);
  console.log("\n✨ Demo seeding complete!\n");
  console.log("Demo certificate IDs to try in the Verify page:");
  DEMO_CERTS.forEach(c => {
    console.log(`  • ${c.certId}${c.revoke ? " [REVOKED]" : ""}`);
  });
  console.log('\nA non-existent ID to test "Not Found": CERT-9999-XXXX');
}

main().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exitCode = 1;
});
