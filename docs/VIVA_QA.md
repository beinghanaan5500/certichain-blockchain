# CertiChain — Viva Questions & Answers

Prepared for the final-year project viva examination.

---

## Section 1: Blockchain & Ethereum Fundamentals

**Q1. What is blockchain and why is it suitable for certificate verification?**

Blockchain is a distributed, append-only ledger where data is stored in cryptographically linked blocks. It is suitable for certificate verification because:
- **Immutability**: Once a certificate is recorded, it cannot be altered or deleted.
- **Transparency**: Anyone can verify the data without contacting the issuing institution.
- **Decentralization**: No single point of failure; no trusted third party is needed.
- **Audit trail**: Every transaction is timestamped and permanently recorded.

---

**Q2. What is Ethereum and how does it differ from Bitcoin?**

Ethereum is a programmable blockchain platform. Unlike Bitcoin which is primarily a cryptocurrency ledger, Ethereum supports **smart contracts** — self-executing programs stored on-chain. This allows developers to build decentralized applications (DApps) like CertiChain that execute arbitrary logic transparently and trustlessly.

---

**Q3. What is a smart contract?**

A smart contract is a program stored on the blockchain that executes automatically when predefined conditions are met. It is:
- **Deterministic**: Always produces the same output for the same input.
- **Immutable**: Once deployed, the code cannot change.
- **Transparent**: Anyone can read the contract's code and state.
- **Trustless**: Executes without needing to trust any party.

In CertiChain, the smart contract manages certificate registration, retrieval, and revocation.

---

**Q4. What is Gas in Ethereum?**

Gas is the unit of computational effort required to execute operations on Ethereum. Every transaction costs gas, paid in ETH (or wei). It prevents spam and incentivizes miners/validators. In CertiChain, registering a certificate costs approximately 190,000 gas; verification (a view function) costs 0 gas since it doesn't change state.

---

**Q5. What is the difference between a transaction and a call in Ethereum?**

| Aspect | Transaction | Call (view/pure) |
|--------|-------------|------------------|
| Changes state | Yes | No |
| Costs gas | Yes | No (free) |
| Requires signing | Yes | No |
| Confirmed on-chain | Yes | No |

In CertiChain, `registerCertificate` and `revokeCertificate` are transactions; `getCertificate` and `verifyCertificate` are calls.

---

## Section 2: Smart Contract (Solidity)

**Q6. Why did you choose Solidity 0.8.24?**

Version 0.8.x introduced built-in overflow/underflow checking (replacing the need for SafeMath), improved error messages, and better gas optimization. 0.8.24 is a stable, recent release with good tooling support.

---

**Q7. Explain the Certificate struct in your contract.**

```solidity
struct Certificate {
    string  certificateId;    // Unique ID like CERT-2024-001
    string  studentName;
    string  courseName;
    string  institutionName;
    string  grade;
    uint256 issueDate;        // Unix timestamp of certificate issue
    uint256 registeredAt;     // Block timestamp when stored on-chain
    bytes32 documentHash;     // SHA-256 of the certificate PDF
    address issuedBy;         // Wallet that registered it
    bool    isRevoked;
    string  revokeReason;
}
```

---

**Q8. How does your contract prevent duplicate certificate IDs?**

We maintain a separate mapping `mapping(string => bool) private _idExists`. Before registering, we check:
```solidity
require(!_idExists[certId], "CertiChain: certificate ID already registered");
```
Using a separate boolean mapping instead of checking the struct is more gas-efficient.

---

**Q9. Why is the document hash stored as `bytes32` instead of `string`?**

SHA-256 always produces a 256-bit (32-byte) output. Storing it as `bytes32`:
- Uses exactly 32 bytes — one EVM storage slot (optimal gas usage)
- Is natively comparable with `==` on-chain
- Is more gas-efficient than a dynamic-length `string`

---

**Q10. What is the difference between `view` and `pure` functions in Solidity?**

| Type | Reads state | Modifies state |
|------|-------------|----------------|
| `view` | ✅ Yes | ❌ No |
| `pure` | ❌ No | ❌ No |

`getCertificate` is `view` because it reads contract state. A function that only computes a hash from input parameters would be `pure`.

---

**Q11. What are modifiers in Solidity? Explain your modifiers.**

Modifiers are reusable conditions that can be attached to functions. CertiChain has three:

```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "not the owner");
    _;
}

modifier onlyAuthorized() {
    require(msg.sender == owner || authorizedIssuers[msg.sender], "not authorized");
    _;
}

modifier certificateExists(string memory certId) {
    require(_idExists[certId], "ID does not exist");
    _;
}
```

The `_;` placeholder marks where the actual function body executes.

---

**Q12. What events does your contract emit? Why are events important?**

Events emitted:
- `CertificateRegistered(id, name, course, issuer, hash, timestamp)`
- `CertificateRevoked(id, revokedBy, reason, timestamp)`
- `IssuerAuthorized(issuer, by)`
- `IssuerRevoked(issuer, by)`

Events are important because:
- They provide an efficient way to log on-chain activity
- Frontend applications can listen to them in real-time
- They are stored in transaction logs (not state), making them cheaper than storage

---

**Q13. Can a revoked certificate be un-revoked? Why?**

No. The `revokeCertificate` function sets `cert.isRevoked = true` but there is no function to set it back to `false`. This is by design — revocation is **permanent and irreversible**, just like revoking a physical certificate in the real world. The immutability also provides a clear audit trail.

---

**Q14. How does pagination work in your `getCertificateIds` function?**

```solidity
function getCertificateIds(uint256 offset, uint256 limit) external view returns (string[] memory) {
    uint256 end = offset + limit > total ? total : offset + limit;
    // returns IDs from index 'offset' to 'end'
}
```

This allows the frontend to fetch certificates in batches rather than all at once, which would fail for large datasets.

---

## Section 3: Frontend & Ethers.js

**Q15. How does the frontend connect to the Ethereum smart contract?**

1. On startup, `AppContext` loads `deployment.json` which contains the contract address and ABI.
2. It checks if MetaMask is available via `window.ethereum`.
3. `ethers.BrowserProvider(window.ethereum)` wraps MetaMask as an Ethers.js provider.
4. `new ethers.Contract(address, abi, provider)` creates a typed contract instance.
5. For write operations, `provider.getSigner()` is called first, then the contract is re-wrapped with the signer.

---

**Q16. What is ABI and why is it needed?**

ABI (Application Binary Interface) is a JSON description of all public functions and events in a smart contract. It specifies:
- Function names, parameter types, return types
- Event signatures

Ethers.js uses the ABI to encode function calls into EVM bytecode and decode responses. Without it, the frontend cannot call the contract.

---

**Q17. How does the SHA-256 hash computation work in the browser?**

```typescript
const buffer = await file.arrayBuffer();
const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
return '0x' + hashHex; // bytes32-compatible hex string
```

The Web Crypto API (`crypto.subtle`) is built into modern browsers. No external library is needed.

---

**Q18. What happens if the Hardhat node is not running when the user opens the app?**

The `refreshContract()` function in `AppContext` tries to fetch from the deployed contract. If it fails:
- `contract.isDeployed` is set to `false`
- The UI shows a yellow warning banner: "Contract Not Deployed"
- Read/write operations show appropriate error messages
- The app still loads — it degrades gracefully

---

**Q19. Why did you use React Context instead of Redux for state management?**

CertiChain has simple, two-level shared state: wallet connection and contract status. React Context with `useReducer` or `useState` is sufficient for this complexity level. Redux would add unnecessary boilerplate for a project this size. The `AppContext` provides the state to all components without prop drilling.

---

## Section 4: Security & Design

**Q20. What happens if an attacker tries to register a certificate with an existing ID?**

The contract checks `require(!_idExists[certId], "certificate ID already registered")`. This will revert the transaction, costing the attacker only gas. The existing certificate is protected.

---

**Q21. Could someone register a certificate without authorization if they know the contract address?**

No. The `registerCertificate` function has the `onlyAuthorized` modifier:
```solidity
require(msg.sender == owner || authorizedIssuers[msg.sender], "not authorized");
```
Ethereum's cryptographic signature verification ensures `msg.sender` cannot be faked.

---

**Q22. What is the difference between `block.timestamp` and `issueDate`?**

- `issueDate` is the **certificate date** — the date printed on the certificate (e.g., graduation day), supplied by the issuer as a parameter.
- `block.timestamp` (stored as `registeredAt`) is the **blockchain registration timestamp** — the exact time the transaction was mined. This creates an immutable proof of *when* the registration occurred.

---

**Q23. What is the 51% attack and does it affect CertiChain?**

A 51% attack occurs when a single entity controls more than half of the network's mining/validation power, potentially allowing them to rewrite recent blocks. On the main Ethereum network (post-Merge, Proof-of-Stake), this is economically infeasible. On CertiChain's local Hardhat node, this is irrelevant since it's a trusted development environment. On mainnet deployment, CertiChain would benefit from Ethereum's full security guarantees.

---

**Q24. Why store only the hash of the document instead of the document itself?**

1. **Cost**: Storing data on-chain is extremely expensive (~20,000 gas per 32 bytes). A PDF could be megabytes in size.
2. **Privacy**: The document itself may contain personally identifiable information.
3. **Sufficiency**: The hash cryptographically proves the document's content without storing it. If you have the original document and the stored hash matches, you can be 100% certain the document has not been modified.

---

**Q25. What would you do differently to make CertiChain production-ready?**

1. Deploy to Ethereum Sepolia testnet (or mainnet) for real persistence and public access.
2. Use IPFS to store the actual certificate document (referenced by its content hash).
3. Add multi-signature control for revocations (prevent a single compromised key from revoking all certs).
4. Implement an ERC-721 NFT for each certificate (portable, wallet-stored credentials).
5. Add a proper certificate expiration system.
6. Add server-side indexing of blockchain events for fast search across large datasets.
7. Use ENS (Ethereum Name Service) for human-readable institution addresses.
8. Conduct a formal third-party security audit.

---

*End of Viva Q&A — CertiChain*
