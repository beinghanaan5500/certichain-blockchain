import React from 'react';
import {
  BookOpen, Target, Cpu, GitBranch, CheckCircle2, AlertTriangle,
  TrendingUp, Layers, Code2, Shield, Database, Globe
} from 'lucide-react';

const TECH_STACK = [
  { label: 'Solidity 0.8.24',      desc: 'Smart contract language',   color: '#627EEA' },
  { label: 'Hardhat 2.x',          desc: 'Ethereum development env',   color: '#FFF100' },
  { label: 'Ethers.js 6.x',        desc: 'Ethereum JS library',        color: '#2535A8' },
  { label: 'React 18 + TypeScript', desc: 'Frontend framework',        color: '#61DAFB' },
  { label: 'Vite 8',               desc: 'Build tool',                 color: '#646CFF' },
  { label: 'Tailwind CSS v4',       desc: 'Utility-first styling',      color: '#06B6D4' },
  { label: 'MetaMask',              desc: 'Wallet / key management',    color: '#F6851B' },
  { label: 'SHA-256',               desc: 'Document hash algorithm',    color: '#10b981' },
];

const WORKFLOW = [
  { step: 1, title: 'Institution Deploys Contract',   desc: 'CertiChain.sol is deployed to the Ethereum network. The deployer becomes the owner and first authorized issuer.' },
  { step: 2, title: 'Issuer Registers Certificate',   desc: 'The authorized issuer fills in student details, uploads the certificate document, and submits a MetaMask-signed transaction.' },
  { step: 3, title: 'Document Hash Stored On-Chain',  desc: 'The SHA-256 hash of the document and all certificate metadata are stored immutably in the smart contract.' },
  { step: 4, title: 'Verifier Looks Up Certificate',  desc: 'Anyone can search by Certificate ID to retrieve the on-chain record without any wallet or permission.' },
  { step: 5, title: 'Optional Document Integrity Check', desc: 'The verifier uploads the certificate document. The DApp computes its SHA-256 hash and compares it with the on-chain hash.' },
  { step: 6, title: 'Result Displayed',              desc: 'Clear feedback: valid, revoked, not found, hash matched, or hash mismatched.' },
];

const ADVANTAGES = [
  'Tamper-proof — blockchain records cannot be altered after registration',
  'Decentralized — no single point of failure or control',
  'Transparent — all records publicly auditable',
  'Cryptographically secure — SHA-256 document integrity verification',
  'Instant verification — no manual approval required',
  'Low cost — only gas fees for writing; reading is free',
  'Permissionless reading — anyone can verify without wallet',
  'Access-controlled writing — only authorized issuers can register',
];

const LIMITATIONS = [
  'Requires MetaMask (or compatible wallet) for issuer operations',
  'Local demonstration requires Hardhat node running continuously',
  'Gas cost is paid in ETH (free on local testnet; real on mainnet)',
  'Private key management is the issuer\'s responsibility',
  'Blockchain data is public — only hashes are stored, not documents',
  'On-chain storage of large data would be expensive (only hashes stored)',
];

const FUTURE = [
  'IPFS integration for decentralized document storage',
  'ZK-SNARKs for privacy-preserving certificate verification',
  'Multi-chain support (Polygon, Base, Arbitrum)',
  'QR code generation for physical certificate verification',
  'Institution DAO for decentralized governance of authorized issuers',
  'NFT-based certificates (ERC-721 tokens)',
  'Integration with university ERP systems via API',
];

const VIVA = [
  { q: 'What is a blockchain?', a: 'A distributed ledger where records are stored in cryptographically linked blocks, making it tamper-proof and transparent.' },
  { q: 'What is a smart contract?', a: 'Self-executing code deployed on a blockchain that automatically enforces the rules and logic defined in it without any intermediary.' },
  { q: 'What is Ethereum?', a: 'A public blockchain platform that supports smart contracts and decentralized applications (DApps) using the EVM.' },
  { q: 'Why is SHA-256 used here?', a: 'SHA-256 produces a unique 256-bit fingerprint of a document. Storing this fingerprint on-chain lets anyone verify whether a document has been altered.' },
  { q: 'What is MetaMask?', a: 'A browser extension wallet that manages Ethereum private keys and allows users to sign and submit transactions to the blockchain.' },
  { q: 'What is a DApp?', a: 'A Decentralized Application with its business logic running as a smart contract on a blockchain instead of a centralized server.' },
  { q: 'How does document verification work?', a: 'The issuer hashes the document file (SHA-256) and stores the hash on-chain. To verify, the verifier hashes their copy and compares it with the stored hash.' },
  { q: 'What is gas in Ethereum?', a: 'A unit measuring the computational effort required to execute operations. Gas fees are paid in ETH to compensate miners/validators.' },
  { q: 'What is Hardhat?', a: 'A development environment for Ethereum that provides a local blockchain node, contract compilation, deployment, and automated testing.' },
  { q: 'What is Ethers.js?', a: 'A JavaScript library for interacting with Ethereum: connecting to wallets, reading contract data, and sending transactions.' },
];

export default function AboutProject() {
  return (
    <div style={{ padding: '32px', maxWidth: 1000 }}>
      <div className="page-header">
        <h1 className="page-title gradient-text">About CertiChain</h1>
        <p className="page-subtitle">Experiment No. 9 — Mini Project: DApps Using Ethereum Smart Contracts</p>
      </div>

      {/* Abstract */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <BookOpen size={16} color="#7b93fa" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Abstract</span>
        </div>
        <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8 }}>
          CertiChain is a Blockchain-Based Student Certificate Verification System built on the Ethereum platform using
          Solidity smart contracts. The system allows authorized academic institutions to register student certificates
          on an immutable decentralized ledger and enables any third party to instantly verify certificate authenticity
          and document integrity without relying on a centralized authority. The system uses SHA-256 cryptographic
          hashing for document integrity verification and MetaMask for secure, wallet-based transaction authorization.
        </p>
      </div>

      {/* Objectives */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Target size={16} color="#7b93fa" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Objectives</span>
        </div>
        {[
          'Design and deploy a Solidity smart contract on the Ethereum blockchain for certificate management',
          'Implement access-controlled certificate registration for authorized institutional issuers',
          'Enable tamper-proof document hash storage using SHA-256 cryptographic hashing',
          'Provide a public, permissionless certificate verification interface',
          'Support certificate revocation with on-chain audit trail',
          'Build a professional React-based DApp frontend connected to the deployed contract via Ethers.js',
          'Demonstrate the practical use of blockchain technology in solving real-world institutional problems',
        ].map((obj, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #4f6ef7, #2dd4bf)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: 'white',
            }}>{i + 1}</div>
            <span style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{obj}</span>
          </div>
        ))}
      </div>

      {/* Technology Stack */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Cpu size={16} color="#7b93fa" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Technology Stack</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {TECH_STACK.map(({ label, desc, color }) => (
            <div key={label} style={{
              padding: '14px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderLeft: `3px solid ${color}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{label}</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Layers size={16} color="#7b93fa" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Architecture</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { icon: Globe, title: 'Presentation Layer', desc: 'React 18 + TypeScript\nVite build tool\nTailwind CSS v4\nLucide Icons', color: '#4f6ef7' },
            { icon: Code2, title: 'Integration Layer',  desc: 'Ethers.js v6\nMetaMask browser extension\nJSON-RPC provider\nABI interface', color: '#2dd4bf' },
            { icon: Database, title: 'Blockchain Layer', desc: 'Solidity 0.8.24 contract\nHardhat local network\nEVM execution\nEvent logs', color: '#f59e0b' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} style={{
              padding: 20, borderRadius: 14, textAlign: 'center',
              background: `rgba(${color === '#4f6ef7' ? '79,110,247' : color === '#2dd4bf' ? '45,212,191' : '245,158,11'},0.06)`,
              border: `1px solid ${color}30`,
            }}>
              <Icon size={28} color={color} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 11, color: '#475569', whiteSpace: 'pre-line', lineHeight: 1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <GitBranch size={16} color="#7b93fa" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Workflow</span>
        </div>
        <div style={{ position: 'relative' }}>
          {WORKFLOW.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, marginBottom: i < WORKFLOW.length - 1 ? 24 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #4f6ef7, #2dd4bf)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: 'white',
                }}>{item.step}</div>
                {i < WORKFLOW.length - 1 && (
                  <div style={{ width: 1, flex: 1, minHeight: 20, background: 'rgba(79,110,247,0.2)', margin: '4px 0' }} />
                )}
              </div>
              <div style={{ paddingTop: 6, paddingBottom: i < WORKFLOW.length - 1 ? 0 : 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advantages & Limitations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <CheckCircle2 size={15} color="#10b981" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Advantages</span>
          </div>
          {ADVANTAGES.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <CheckCircle2 size={12} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <AlertTriangle size={15} color="#f59e0b" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Limitations</span>
          </div>
          {LIMITATIONS.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <AlertTriangle size={12} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Future Scope */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <TrendingUp size={15} color="#7b93fa" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Future Scope</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 10 }}>
          {FUTURE.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'rgba(79,110,247,0.05)', borderRadius: 10, border: '1px solid rgba(79,110,247,0.1)' }}>
              <TrendingUp size={12} color="#4f6ef7" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12, color: '#64748b' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Viva Q&A */}
      <div className="glass-card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <BookOpen size={15} color="#7b93fa" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Viva Preparation — Expected Questions</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {VIVA.map(({ q, a }, i) => (
            <div key={i} style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#7b93fa', marginBottom: 6 }}>Q{i+1}: {q}</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
