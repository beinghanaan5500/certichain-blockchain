import { describe, it, expect } from 'vitest';
import {
  formatAddress,
  formatHash,
  formatDate,
  formatTimestamp,
  isCorrectNetwork,
  validateCertificateId,
  validateGrade,
  parseContractError,
  SUPPORTED_NETWORKS,
} from '../src/utils/contract';

describe('CertiChain Frontend Utilities & Validation', () => {
  // ── Address & Hash Formatting ──────────────────────────────────────────────
  describe('Formatting Utilities', () => {
    it('formatAddress shortens 42-char EVM addresses properly', () => {
      const addr = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      expect(formatAddress(addr)).toBe('0xf39F...2266');
    });

    it('formatAddress handles empty or short input gracefully', () => {
      expect(formatAddress('')).toBe('');
      expect(formatAddress('0x123')).toBe('0x123');
    });

    it('formatHash shortens 66-char bytes32 hashes properly', () => {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(formatHash(hash)).toBe('0x12345678...90abcdef');
    });

    it('formatDate formats valid timestamps into human-readable strings', () => {
      const timestamp = 1715731200; // May 15, 2024
      const formatted = formatDate(timestamp);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('May');
    });

    it('formatDate handles BigInt timestamps', () => {
      const timestamp = 1715731200n;
      expect(formatDate(timestamp)).toContain('2024');
    });

    it('formatTimestamp formats date and time', () => {
      const timestamp = 1715731200;
      const formatted = formatTimestamp(timestamp);
      expect(formatted).toContain('2024');
    });
  });

  // ── Network Definitions & Matching ─────────────────────────────────────────
  describe('Network Configuration & Detection', () => {
    it('includes configurations for Sepolia and Localhost', () => {
      expect(SUPPORTED_NETWORKS[11155111]).toBeDefined();
      expect(SUPPORTED_NETWORKS[11155111].chainName).toBe('Ethereum Sepolia');
      expect(SUPPORTED_NETWORKS[31337]).toBeDefined();
      expect(SUPPORTED_NETWORKS[31337].chainIdHex).toBe('0x7a69');
    });

    it('isCorrectNetwork returns false for null or undefined chainId', () => {
      expect(isCorrectNetwork(null)).toBe(false);
    });
  });

  // ── Certificate ID Validation ──────────────────────────────────────────────
  describe('Input Validation: Certificate ID', () => {
    it('accepts valid alphanumeric ID formats with hyphens and slashes', () => {
      expect(validateCertificateId('CERT-2024-001')).toBeNull();
      expect(validateCertificateId('NIT/CSE/2024/99')).toBeNull();
      expect(validateCertificateId('IITD_DEG_12345')).toBeNull();
    });

    it('rejects empty Certificate IDs', () => {
      expect(validateCertificateId('')).toBe('Certificate ID is required.');
      expect(validateCertificateId('   ')).toBe('Certificate ID is required.');
    });

    it('rejects Certificate IDs that are too short', () => {
      expect(validateCertificateId('AB')).toBe('Certificate ID must be at least 3 characters.');
    });

    it('rejects Certificate IDs with invalid characters', () => {
      expect(validateCertificateId('CERT 2024')).toBe(
        'Certificate ID can only contain letters, numbers, hyphens, slashes, and periods.'
      );
      expect(validateCertificateId('CERT<script>')).toBe(
        'Certificate ID can only contain letters, numbers, hyphens, slashes, and periods.'
      );
    });
  });

  // ── Grade Validation ───────────────────────────────────────────────────────
  describe('Input Validation: Grade / CGPA', () => {
    it('accepts valid grades and CGPA strings', () => {
      expect(validateGrade('9.2 CGPA')).toBeNull();
      expect(validateGrade('First Class with Distinction')).toBeNull();
      expect(validateGrade('A+')).toBeNull();
    });

    it('rejects empty grade input', () => {
      expect(validateGrade('')).toBe('Grade or CGPA is required.');
      expect(validateGrade('   ')).toBe('Grade or CGPA is required.');
    });
  });

  // ── Contract Error Parser ──────────────────────────────────────────────────
  describe('parseContractError', () => {
    it('translates unauthorized issuer revert to friendly message', () => {
      const err = { message: 'execution reverted: CertiChain: caller is not an authorized issuer' };
      const parsed = parseContractError(err);
      expect(parsed).toContain('Unauthorized: Your connected wallet is not an authorized academic issuer');
    });

    it('translates duplicate certificate ID revert to friendly message', () => {
      const err = { reason: 'CertiChain: certificate ID already registered' };
      const parsed = parseContractError(err);
      expect(parsed).toContain('Duplicate ID: This Certificate ID is already registered');
    });

    it('translates user rejection to clear message', () => {
      const err = { code: 4001, message: 'User rejected the request' };
      const parsed = parseContractError(err);
      expect(parsed).toContain('Transaction rejected in your wallet');
    });

    it('translates pending request to clear message', () => {
      const err = { code: -32002, message: 'Request already pending' };
      const parsed = parseContractError(err);
      expect(parsed).toContain('already pending');
    });
  });

  // ── Demo Mode Data & Utilities ─────────────────────────────────────────────
  describe('Demo Mode Data & Persistence Helpers', () => {
    // Import dynamically or test static structures
    it('provides at least 5 realistic fictional demo certificates', async () => {
      const { INITIAL_DEMO_CERTIFICATES, DEMO_PRESETS } = await import('../src/utils/demoData');
      expect(INITIAL_DEMO_CERTIFICATES.length).toBeGreaterThanOrEqual(5);

      // Verify required scenarios are covered
      const validCerts = INITIAL_DEMO_CERTIFICATES.filter(c => !c.isRevoked);
      const revokedCerts = INITIAL_DEMO_CERTIFICATES.filter(c => c.isRevoked);
      expect(validCerts.length).toBeGreaterThanOrEqual(2);
      expect(revokedCerts.length).toBeGreaterThanOrEqual(1);

      // Verify presets have all 5 presentation cases
      expect(DEMO_PRESETS.length).toBe(5);
      const scenarios = DEMO_PRESETS.map(p => p.scenario);
      expect(scenarios).toContain('valid-1');
      expect(scenarios).toContain('valid-2');
      expect(scenarios).toContain('revoked');
      expect(scenarios).toContain('not-found');
      expect(scenarios).toContain('hash-mismatch');
    });

    it('retrieves demo certificate by ID and returns null for unknown ID', async () => {
      const { getDemoCertificate } = await import('../src/utils/demoData');
      const cert1 = getDemoCertificate('DEMO-CERT-2024-001');
      expect(cert1).toBeDefined();
      expect(cert1?.studentName).toBe('Aarav Sharma');
      expect(cert1?.isDemo).toBe(true);

      const unknown = getDemoCertificate('UNKNOWN-NON-EXISTENT-999');
      expect(unknown).toBeNull();
    });

    it('registers a new demo certificate and prevents duplicates', async () => {
      const { registerDemoCertificate } = await import('../src/utils/demoData');
      const newCert = {
        certificateId: 'DEMO-NEW-TEST-001',
        studentName: 'Test Student',
        courseName: 'Test Course',
        institutionName: 'Test University',
        grade: '10.0 CGPA',
        issueDate: 1715731200n,
        documentHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        issuedBy: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      };

      const created = registerDemoCertificate(newCert);
      expect(created.certificateId).toBe('DEMO-NEW-TEST-001');
      expect(created.studentName).toBe('Test Student');

      // Duplicate registration attempt must throw
      expect(() => registerDemoCertificate(newCert)).toThrow('Duplicate ID');
    });

    it('revokes an existing demo certificate with reason', async () => {
      const { revokeDemoCertificate, getDemoCertificate } = await import('../src/utils/demoData');
      const res = revokeDemoCertificate('DEMO-CERT-2024-001', 'Administrative error during test');
      expect(res).toBe(true);

      const updated = getDemoCertificate('DEMO-CERT-2024-001');
      expect(updated?.isRevoked).toBe(true);
      expect(updated?.revokeReason).toBe('Administrative error during test');
    });
  });
});

