# CertiChain — UI/UX Design System & Changelog

**Version:** 2.0.0 (Engineering Pass)  
**Lead Designer / Engineer:** Senior Product UI/UX Engineer  
**Aesthetic Direction:** Trustworthy, Modern Academic Web3 Verification Platform

---

## 1. Design System Philosophy

The redesigned interface moves away from generic, cartoonish crypto aesthetics (overused floating blobs, emoji icons, garish neon gradients) towards a refined, institutional-grade product appearance suitable for university engineering demonstrations and real academic bodies.

### Visual Foundations:
- **Background Palette:** High-depth layered slate obsidian (`#050d1a`, `#080f1d`, `#0e1726`).
- **Brand Primary Accent:** Academic Royal Blue (`#3b82f6` / `#4f6ef7`) paired with Cryptographic Cyan (`#06b6d4` / `#2dd4bf`).
- **Semantic Accents:**
  - Verified / Valid: Emerald Green (`#10b981` / `#34d399`).
  - Warning / Attention: Amber (`#f59e0b` / `#fbbf24`).
  - Revoked / Critical: Crimson (`#ef4444` / `#f87171`).
- **Typography:** Crisp system sans-serif hierarchy with balanced tracking and monospace representations for hex addresses and hashes.
- **Glassmorphism:** Restrained backdrop blur (`blur(12px)`) with subtle hairline borders (`rgba(255, 255, 255, 0.08)`) and controlled box shadows.

---

## 2. Component & Layout Changelog

### 1. Navigation & Sidebar
- **Brand Identity:** Replaced generic emoji with a custom Lucide `ShieldCheck` emblem in a smooth gradient tile with an official version tag (`v1.0`).
- **Navigation Pills:** Added subtle active indicator pills with route matching and role badges (`Issuer`, `Public`).
- **Network Status Tile:** Integrated real-time network target card displaying contract address and total certificate count.
- **Wallet Connection Card:** Displays shortened address, balance, issuer role, one-click address copy button, and interactive **"Switch Network"** button when on the wrong chain.
- **Mobile Experience:** Implemented fixed top navigation bar with hamburger menu trigger, touch-friendly drawer, and blur backdrop.

### 2. Web3 Wallet Assistant (`WalletModal.tsx`)
- Created an institutional Web3 onboarding dialog.
- Clear step-by-step guidance for desktop extensions (MetaMask, Coinbase Wallet) and mobile Web3 browsers.
- Account manager with 1-click address copy, direct Etherscan explorer link, and disconnect controls.

### 3. Certificate Registration (`RegisterCertificate.tsx`)
- **Resolved Focus Loss Bug:** Separated input rendering from parent component body, enabling smooth continuous typing.
- **Pre-Flight Duplicate ID Check:** Verifies ID availability on blur before submitting.
- **Role Verification Banner:** Alerts guest users upfront if their connected wallet lacks academic issuer privileges.
- **Drag-and-Drop Zone:** Enhanced dropzone with instant client-side SHA-256 computation, progress spinner, and one-click hash copying.
- **Transaction Receipt:** Prominent confirmed receipt showing transaction hash and direct link to record details.

### 4. Certificate Verification (`VerifyCertificate.tsx`)
- **Deep-Link URL Query Support:** Accepts `?id=CERT-2024-0001` to instantly trigger verification from shared links.
- **Status Badges:** Distinct visual hierarchy for valid certificates (Emerald), revoked certificates (Crimson), and not-found records.
- **Document Integrity Comparison:** Side-by-side verification comparing an uploaded PDF against the on-chain SHA-256 fingerprint.

### 5. Certificate Records Ledger (`Records.tsx`)
- **Multi-Field Real-Time Search:** Filters across ID, student name, program, and institution simultaneously.
- **Status Filter Pills:** Toggle between All, Valid, and Revoked records.
- **Sorting Controls:** Sort by newest registered, oldest, or student name alphabetically.
- **Data Export:** Integrated one-click CSV export utility generating formatted academic ledger reports.

### 6. Dashboard (`Dashboard.tsx`)
- Replaced miscalculated stats with live on-chain queries.
- Clean KPI cards with subtle icon backdrops.
- Actionable zero-state cards when the ledger is empty.
- Quick navigation shortcuts for issuing, verifying, and auditing certificates.
