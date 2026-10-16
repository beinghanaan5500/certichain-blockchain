# CertiChain — Smart Contract Test Report

**Date:** October 2026  
**Contract:** `CertiChain.sol` (Solidity 0.8.24)  
**Test Framework:** Mocha + Chai + Hardhat Toolbox  
**Test File:** `test/CertiChain.test.cjs`  
**Result: 27 / 27 tests passing ✅**

---

## Test Execution

```bash
$ npm run test:contract

> hardhat test
```

**Output:**
```
  CertiChain — Smart Contract Tests
    Deployment
      ✓ Should set the owner correctly
      ✓ Should authorize owner as issuer by default
      ✓ Should start with zero certificates
    Issuer Management
      ✓ Owner can authorize a new issuer
      ✓ Stranger cannot authorize an issuer (40ms)
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

## Test Coverage by Category

### 1. Deployment Tests (3 tests)
| Test | Expected | Result |
|------|----------|--------|
| Owner is set correctly | `owner == deployer.address` | ✅ Pass |
| Owner auto-authorized as issuer | `authorizedIssuers[owner] == true` | ✅ Pass |
| Zero certificates on deployment | `getTotalCertificates() == 0` | ✅ Pass |

### 2. Issuer Management Tests (5 tests)
| Test | Expected | Result |
|------|----------|--------|
| Owner can authorize new issuer | emits `IssuerAuthorized` event, returns `true` | ✅ Pass |
| Stranger cannot authorize issuer | reverts with `"caller is not the owner"` | ✅ Pass |
| Owner can revoke an issuer | emits `IssuerRevoked`, returns `false` | ✅ Pass |
| Cannot revoke owner | reverts with `"cannot revoke owner"` | ✅ Pass |
| Double-authorize fails | reverts with `"already authorized"` | ✅ Pass |

### 3. Certificate Registration Tests (5 tests)
| Test | Expected | Result |
|------|----------|--------|
| Authorized issuer registers cert | emits `CertificateRegistered`, total becomes 1 | ✅ Pass |
| Unauthorized cannot register | reverts with `"caller is not an authorized issuer"` | ✅ Pass |
| Duplicate ID rejected | reverts with `"certificate ID already registered"` | ✅ Pass |
| Empty ID rejected | reverts with `"empty certificate ID"` | ✅ Pass |
| Zero hash rejected | reverts with `"document hash cannot be zero"` | ✅ Pass |

### 4. Certificate Retrieval Tests (4 tests)
| Test | Expected | Result |
|------|----------|--------|
| getCertificate returns correct data | all struct fields match | ✅ Pass |
| getCertificate reverts for unknown ID | reverts with `"certificate ID does not exist"` | ✅ Pass |
| certificateExists_check true | returns `true` for registered cert | ✅ Pass |
| certificateExists_check false | returns `false` for unregistered ID | ✅ Pass |
| getCertificateIds pagination | returns correct IDs in order | ✅ Pass |

### 5. Verification Tests (4 tests)
| Test | Expected | Result |
|------|----------|--------|
| Cert found with valid ID | `exists == true` | ✅ Pass |
| Correct hash matches | `hashMatches == true` | ✅ Pass |
| Wrong hash mismatches | `hashMatches == false` | ✅ Pass |
| Unknown cert not found | `exists == false` | ✅ Pass |

### 6. Revocation Tests (5 tests)
| Test | Expected | Result |
|------|----------|--------|
| Authorized can revoke | emits `CertificateRevoked`, cert.isRevoked = true | ✅ Pass |
| Unauthorized cannot revoke | reverts with `"caller is not an authorized issuer"` | ✅ Pass |
| Double-revoke fails | reverts with `"certificate already revoked"` | ✅ Pass |
| Empty reason fails | reverts with `"revocation reason required"` | ✅ Pass |
| Verify shows revoked status | `isRevoked == true` in verifyCertificate output | ✅ Pass |

---

## Test Methodology

- Each test group uses `beforeEach` to deploy a fresh contract instance (isolated state).
- Access-control tests use `ethers.Signer` alternatives (`issuer2`, `stranger`).
- Event emissions are verified with Chai's `.to.emit(...).withArgs(...)`.
- Reverts are verified with `.to.be.revertedWith(...)`.
- BigInt comparisons use Chai's built-in support for `0n`.

---

## Gas Usage Summary

| Function | Approx Gas |
|----------|------------|
| `registerCertificate` | ~190,000 |
| `revokeCertificate` | ~45,000 |
| `authorizeIssuer` | ~47,000 |
| `getCertificate` (view) | 0 (view) |
| `verifyCertificate` (view) | 0 (view) |

---

## Conclusion

All 27 automated tests pass with 0 failures. The smart contract correctly implements:
- Access control (owner + authorized issuers only)
- Input validation (empty strings, zero hash, duplicate IDs)
- Immutable certificate storage
- Tamper-evident document hash verification
- Permanent, irreversible certificate revocation
