import { expect } from "chai";
import { ethers } from "hardhat";
import { CertiChain } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ZeroHash } from "ethers";

describe("CertiChain — Smart Contract Tests", () => {
  let certichain: CertiChain;
  let owner: SignerWithAddress;
  let issuer2: SignerWithAddress;
  let stranger: SignerWithAddress;

  const CERT_ID   = "CERT-2024-001";
  const DOC_HASH  = ethers.keccak256(ethers.toUtf8Bytes("sample-document-content"));
  const ISSUE_DATE = Math.floor(Date.now() / 1000);

  const SAMPLE = {
    certId:      CERT_ID,
    studentName: "Rahul Sharma",
    courseName:  "B.Tech Computer Science & Engineering (AI/ML)",
    institution: "National Institute of Technology",
    grade:       "9.2 CGPA",
    issueDate:   ISSUE_DATE,
    documentHash: DOC_HASH as unknown as string,
  };

  beforeEach(async () => {
    [owner, issuer2, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CertiChain");
    certichain    = await Factory.deploy();
    await certichain.waitForDeployment();
  });

  // ─── Deployment ─────────────────────────────────────────────────────────────
  describe("Deployment", () => {
    it("Should set the owner correctly", async () => {
      expect(await certichain.owner()).to.equal(owner.address);
    });

    it("Should authorize owner as issuer by default", async () => {
      expect(await certichain.authorizedIssuers(owner.address)).to.be.true;
    });

    it("Should start with zero certificates", async () => {
      expect(await certichain.getTotalCertificates()).to.equal(0n);
    });
  });

  // ─── Issuer Management ───────────────────────────────────────────────────────
  describe("Issuer Management", () => {
    it("Owner can authorize a new issuer", async () => {
      await expect(certichain.authorizeIssuer(issuer2.address))
        .to.emit(certichain, "IssuerAuthorized")
        .withArgs(issuer2.address, owner.address);
      expect(await certichain.authorizedIssuers(issuer2.address)).to.be.true;
    });

    it("Stranger cannot authorize an issuer", async () => {
      await expect(certichain.connect(stranger).authorizeIssuer(issuer2.address))
        .to.be.revertedWith("CertiChain: caller is not the owner");
    });

    it("Owner can revoke an issuer", async () => {
      await certichain.authorizeIssuer(issuer2.address);
      await expect(certichain.revokeIssuer(issuer2.address))
        .to.emit(certichain, "IssuerRevoked")
        .withArgs(issuer2.address, owner.address);
      expect(await certichain.authorizedIssuers(issuer2.address)).to.be.false;
    });

    it("Cannot revoke the owner", async () => {
      await expect(certichain.revokeIssuer(owner.address))
        .to.be.revertedWith("CertiChain: cannot revoke owner");
    });

    it("Authorizing already-authorized issuer reverts", async () => {
      await certichain.authorizeIssuer(issuer2.address);
      await expect(certichain.authorizeIssuer(issuer2.address))
        .to.be.revertedWith("CertiChain: already authorized");
    });
  });

  // ─── Certificate Registration ────────────────────────────────────────────────
  describe("Certificate Registration", () => {
    it("Authorized issuer can register a certificate", async () => {
      await expect(
        certichain.registerCertificate(
          SAMPLE.certId, SAMPLE.studentName, SAMPLE.courseName,
          SAMPLE.institution, SAMPLE.grade, SAMPLE.issueDate, SAMPLE.documentHash
        )
      )
        .to.emit(certichain, "CertificateRegistered")
        .withArgs(
          SAMPLE.certId, SAMPLE.studentName, SAMPLE.courseName,
          owner.address, SAMPLE.documentHash, (v: bigint) => v > 0n
        );

      expect(await certichain.getTotalCertificates()).to.equal(1n);
    });

    it("Second authorized issuer can register a certificate", async () => {
      await certichain.authorizeIssuer(issuer2.address);
      await certichain.connect(issuer2).registerCertificate(
        "CERT-2024-002", SAMPLE.studentName, SAMPLE.courseName,
        SAMPLE.institution, SAMPLE.grade, SAMPLE.issueDate, SAMPLE.documentHash
      );
      expect(await certichain.getTotalCertificates()).to.equal(1n);
    });

    it("Unauthorized address cannot register a certificate", async () => {
      await expect(
        certichain.connect(stranger).registerCertificate(
          SAMPLE.certId, SAMPLE.studentName, SAMPLE.courseName,
          SAMPLE.institution, SAMPLE.grade, SAMPLE.issueDate, SAMPLE.documentHash
        )
      ).to.be.revertedWith("CertiChain: caller is not an authorized issuer");
    });

    it("Duplicate certificate ID is rejected", async () => {
      await certichain.registerCertificate(
        SAMPLE.certId, SAMPLE.studentName, SAMPLE.courseName,
        SAMPLE.institution, SAMPLE.grade, SAMPLE.issueDate, SAMPLE.documentHash
      );
      await expect(
        certichain.registerCertificate(
          SAMPLE.certId, "Another Student", SAMPLE.courseName,
          SAMPLE.institution, SAMPLE.grade, SAMPLE.issueDate, SAMPLE.documentHash
        )
      ).to.be.revertedWith("CertiChain: certificate ID already registered");
    });

    it("Empty certificate ID is rejected", async () => {
      await expect(
        certichain.registerCertificate(
          "", SAMPLE.studentName, SAMPLE.courseName,
          SAMPLE.institution, SAMPLE.grade, SAMPLE.issueDate, SAMPLE.documentHash
        )
      ).to.be.revertedWith("CertiChain: empty certificate ID");
    });

    it("Zero document hash is rejected", async () => {
      await expect(
        certichain.registerCertificate(
          SAMPLE.certId, SAMPLE.studentName, SAMPLE.courseName,
          SAMPLE.institution, SAMPLE.grade, SAMPLE.issueDate, ZeroHash
        )
      ).to.be.revertedWith("CertiChain: document hash cannot be zero");
    });
  });

  // ─── Certificate Retrieval ───────────────────────────────────────────────────
  describe("Certificate Retrieval", () => {
    beforeEach(async () => {
      await certichain.registerCertificate(
        SAMPLE.certId, SAMPLE.studentName, SAMPLE.courseName,
        SAMPLE.institution, SAMPLE.grade, SAMPLE.issueDate, SAMPLE.documentHash
      );
    });

    it("getCertificate returns correct data", async () => {
      const cert = await certichain.getCertificate(SAMPLE.certId);
      expect(cert.certificateId).to.equal(SAMPLE.certId);
      expect(cert.studentName).to.equal(SAMPLE.studentName);
      expect(cert.courseName).to.equal(SAMPLE.courseName);
      expect(cert.documentHash).to.equal(SAMPLE.documentHash);
      expect(cert.isRevoked).to.be.false;
      expect(cert.issuedBy).to.equal(owner.address);
    });

    it("getCertificate reverts for non-existent ID", async () => {
      await expect(certichain.getCertificate("CERT-9999"))
        .to.be.revertedWith("CertiChain: certificate ID does not exist");
    });

    it("certificateExists_check returns true for registered cert", async () => {
      expect(await certichain.certificateExists_check(SAMPLE.certId)).to.be.true;
    });

    it("certificateExists_check returns false for unregistered cert", async () => {
      expect(await certichain.certificateExists_check("CERT-9999")).to.be.false;
    });

    it("getCertificateIds returns paginated results", async () => {
      // Register a second
      await certichain.registerCertificate(
        "CERT-2024-002", "Priya Singh", SAMPLE.courseName,
        SAMPLE.institution, SAMPLE.grade, SAMPLE.issueDate, SAMPLE.documentHash
      );
      const ids = await certichain.getCertificateIds(0n, 10n);
      expect(ids.length).to.equal(2);
      expect(ids[0]).to.equal(SAMPLE.certId);
      expect(ids[1]).to.equal("CERT-2024-002");
    });
  });

  // ─── Verification ────────────────────────────────────────────────────────────
  describe("Certificate Verification", () => {
    beforeEach(async () => {
      await certichain.registerCertificate(
        SAMPLE.certId, SAMPLE.studentName, SAMPLE.courseName,
        SAMPLE.institution, SAMPLE.grade, SAMPLE.issueDate, SAMPLE.documentHash
      );
    });

    it("verifyCertificate returns exists=true for valid cert", async () => {
      const [exists] = await certichain.verifyCertificate(SAMPLE.certId, ZeroHash);
      expect(exists).to.be.true;
    });

    it("Correct document hash matches", async () => {
      const [, , hashMatches] = await certichain.verifyCertificate(
        SAMPLE.certId, SAMPLE.documentHash
      );
      expect(hashMatches).to.be.true;
    });

    it("Incorrect document hash does not match", async () => {
      const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("wrong-document"));
      const [, , hashMatches] = await certichain.verifyCertificate(
        SAMPLE.certId, wrongHash
      );
      expect(hashMatches).to.be.false;
    });

    it("verifyCertificate returns exists=false for unknown cert", async () => {
      const [exists] = await certichain.verifyCertificate("CERT-9999", ZeroHash);
      expect(exists).to.be.false;
    });
  });

  // ─── Revocation ──────────────────────────────────────────────────────────────
  describe("Certificate Revocation", () => {
    beforeEach(async () => {
      await certichain.registerCertificate(
        SAMPLE.certId, SAMPLE.studentName, SAMPLE.courseName,
        SAMPLE.institution, SAMPLE.grade, SAMPLE.issueDate, SAMPLE.documentHash
      );
    });

    it("Authorized issuer can revoke a certificate", async () => {
      await expect(
        certichain.revokeCertificate(SAMPLE.certId, "Document found to be forged")
      )
        .to.emit(certichain, "CertificateRevoked")
        .withArgs(
          SAMPLE.certId, owner.address,
          "Document found to be forged", (v: bigint) => v > 0n
        );

      const cert = await certichain.getCertificate(SAMPLE.certId);
      expect(cert.isRevoked).to.be.true;
      expect(cert.revokeReason).to.equal("Document found to be forged");
    });

    it("Unauthorized address cannot revoke a certificate", async () => {
      await expect(
        certichain.connect(stranger).revokeCertificate(SAMPLE.certId, "some reason")
      ).to.be.revertedWith("CertiChain: caller is not an authorized issuer");
    });

    it("Revoking an already-revoked certificate fails", async () => {
      await certichain.revokeCertificate(SAMPLE.certId, "Forged");
      await expect(
        certichain.revokeCertificate(SAMPLE.certId, "Again")
      ).to.be.revertedWith("CertiChain: certificate already revoked");
    });

    it("Revoking without reason fails", async () => {
      await expect(
        certichain.revokeCertificate(SAMPLE.certId, "")
      ).to.be.revertedWith("CertiChain: revocation reason required");
    });

    it("Revoked certificate shows isRevoked=true in verifyCertificate", async () => {
      await certichain.revokeCertificate(SAMPLE.certId, "Forged");
      const [exists, isRevoked] = await certichain.verifyCertificate(
        SAMPLE.certId, SAMPLE.documentHash
      );
      expect(exists).to.be.true;
      expect(isRevoked).to.be.true;
    });
  });
});
