import { Certificate } from '../types';

/**
 * Demo certificate data model with presentation metadata.
 * Clearly marked as FICTIONAL DEMO RECORDS for academic presentation.
 */
export interface DemoCertificate extends Certificate {
  isDemo: true;
  expectedResult: 'valid' | 'revoked';
  demoNotes?: string;
  demoIssuerName?: string;
}

export interface DemoPreset {
  scenario: 'valid-1' | 'valid-2' | 'revoked' | 'not-found' | 'hash-mismatch';
  id: string;
  label: string;
  expected: string;
  notes: string;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    scenario: 'valid-1',
    id: 'DEMO-CERT-2024-001',
    label: 'Valid 1: DEMO-CERT-2024-001 (Aarav Sharma)',
    expected: 'Valid',
    notes: 'B.Tech AI/ML - NIT Surathkal (9.4 CGPA)',
  },
  {
    scenario: 'valid-2',
    id: 'DEMO-CERT-2024-002',
    label: 'Valid 2: DEMO-CERT-2024-002 (Diya Nair)',
    expected: 'Valid',
    notes: 'M.Tech Data Science - IISc Bangalore (9.8 CGPA)',
  },
  {
    scenario: 'revoked',
    id: 'DEMO-CERT-2023-REVOKED',
    label: 'Revoked: DEMO-CERT-2023-REVOKED (Rohan Verma)',
    expected: 'Revoked',
    notes: 'B.Sc Cybersecurity - DTU Delhi (Falsified documents)',
  },
  {
    scenario: 'hash-mismatch',
    id: 'DEMO-CERT-2024-TAMPER-TEST',
    label: 'Tamper Test: DEMO-CERT-2024-TAMPER-TEST (Kavya Krishnan)',
    expected: 'Hash Mismatch',
    notes: 'Anna Univ - Tests cryptographic tamper detection',
  },
  {
    scenario: 'not-found',
    id: 'DEMO-UNKNOWN-404',
    label: 'Not Found: DEMO-UNKNOWN-404',
    expected: 'Not Found',
    notes: 'Non-existent certificate ID',
  },
];

const STORAGE_KEY = 'certichain_demo_certificates_v1';
const DEMO_MODE_STORAGE_KEY = 'certichain_demo_mode_active';

/**
 * Canonical 5+ realistic DEMO certificates for college presentation.
 * All identities, institutions, grades, and hashes are fictional sample data.
 */
export const INITIAL_DEMO_CERTIFICATES: DemoCertificate[] = [
  {
    certificateId:   'DEMO-CERT-2024-001',
    studentName:     'Aarav Sharma',
    courseName:      'B.Tech Computer Science & Engineering (Artificial Intelligence)',
    institutionName: 'National Institute of Technology (NIT) Karnataka, Surathkal',
    grade:           '9.4 CGPA (Distinction)',
    issueDate:       1715731200n, // May 15, 2024
    registeredAt:    1715734800n,
    documentHash:    '0xa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    issuedBy:        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    demoIssuerName:  'Office of the Academic Registrar (NITK)',
    isRevoked:       false,
    revokeReason:    '',
    isDemo:          true,
    expectedResult:  'valid',
    demoNotes:       'Demo Sample 1: Authentic, valid engineering degree credential.',
  },
  {
    certificateId:   'DEMO-CERT-2024-002',
    studentName:     'Diya Nair',
    courseName:      'M.Tech Data Science & Autonomous Systems',
    institutionName: 'Indian Institute of Science (IISc), Bangalore',
    grade:           '9.8 CGPA (First Class with Distinction)',
    issueDate:       1719532800n, // June 28, 2024
    registeredAt:    1719536400n,
    documentHash:    '0xb2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01',
    issuedBy:        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    demoIssuerName:  'Dean of Graduate Studies (IISc)',
    isRevoked:       false,
    revokeReason:    '',
    isDemo:          true,
    expectedResult:  'valid',
    demoNotes:       'Demo Sample 2: Second valid master of technology degree credential.',
  },
  {
    certificateId:   'DEMO-CERT-2023-REVOKED',
    studentName:     'Rohan Verma',
    courseName:      'B.Sc. Cybersecurity & Digital Forensics',
    institutionName: 'Delhi Technological University (DTU), Delhi',
    grade:           '8.2 CGPA',
    issueDate:       1702339200n, // Dec 12, 2023
    registeredAt:    1702342800n,
    documentHash:    '0xc3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef012',
    issuedBy:        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    demoIssuerName:  'Examination Disciplinary Committee (DTU)',
    isRevoked:       true,
    revokeReason:    '[DEMO AUDIT] Credential officially revoked due to falsified prerequisite examination transcripts discovered during post-graduation audit.',
    isDemo:          true,
    expectedResult:  'revoked',
    demoNotes:       'Demo Sample 3: Revoked credential demonstrating institutional tamper detection.',
  },
  {
    certificateId:   'DEMO-CERT-2024-004',
    studentName:     'Ananya Deshmukh',
    courseName:      'MBA Financial Engineering & Analytics',
    institutionName: 'Indian Institute of Management (IIM) Ahmedabad',
    grade:           '3.92 / 4.00 GPA',
    issueDate:       1712707200n, // April 10, 2024
    registeredAt:    1712710800n,
    documentHash:    '0xd4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0123',
    issuedBy:        '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    demoIssuerName:  'Postgraduate Admissions & Registrar (IIMA)',
    isRevoked:       false,
    revokeReason:    '',
    isDemo:          true,
    expectedResult:  'valid',
    demoNotes:       'Demo Sample 4: Valid business management post-graduate credential.',
  },
  {
    certificateId:   'DEMO-CERT-2024-TAMPER-TEST',
    studentName:     'Kavya Krishnan',
    courseName:      'B.E. Electronics & Communication Engineering',
    institutionName: 'College of Engineering, Guindy (Anna University)',
    grade:           '8.8 CGPA',
    issueDate:       1721433600n, // July 20, 2024
    registeredAt:    1721437200n,
    documentHash:    '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    issuedBy:        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    demoIssuerName:  'Controller of Examinations (Anna Univ)',
    isRevoked:       false,
    revokeReason:    '',
    isDemo:          true,
    expectedResult:  'valid',
    demoNotes:       'Demo Sample 5: Dedicated test case for cryptographic document hash verification & mismatch detection.',
  },
];

// Helper to serialize BigInt for localStorage
function serializeDemo(certs: DemoCertificate[]): string {
  return JSON.stringify(certs, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
}

// Helper to deserialize BigInt from localStorage
function deserializeDemo(json: string): DemoCertificate[] {
  return JSON.parse(json, (key, value) => {
    if (key === 'issueDate' || key === 'registeredAt') {
      return BigInt(value);
    }
    return value;
  });
}

let memoryDemoCertificates: DemoCertificate[] = [...INITIAL_DEMO_CERTIFICATES];

/**
 * Load demo certificates from localStorage, initializing defaults if needed.
 */
export function getDemoCertificates(): DemoCertificate[] {
  if (typeof window === 'undefined') return memoryDemoCertificates;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, serializeDemo(INITIAL_DEMO_CERTIFICATES));
      return INITIAL_DEMO_CERTIFICATES;
    }
    return deserializeDemo(raw);
  } catch (err) {
    console.warn('Failed reading demo certificates from storage:', err);
    return memoryDemoCertificates;
  }
}

/**
 * Query a specific demo certificate by ID.
 */
export function getDemoCertificate(id: string): DemoCertificate | null {
  const certs = getDemoCertificates();
  const clean = id.trim().toLowerCase();
  return certs.find(c => c.certificateId.toLowerCase() === clean) || null;
}

/**
 * Register a new demo certificate into localStorage.
 */
export function registerDemoCertificate(certData: {
  certificateId: string;
  studentName: string;
  courseName: string;
  institutionName: string;
  grade: string;
  issueDate: bigint | number;
  documentHash: string;
  issuedBy?: string;
}): DemoCertificate {
  const certs = getDemoCertificates();
  const exists = certs.some(
    c => c.certificateId.toLowerCase() === certData.certificateId.trim().toLowerCase()
  );
  if (exists) {
    throw new Error('Duplicate ID: This Certificate ID already exists in demo records.');
  }

  const newCert: DemoCertificate = {
    certificateId:   certData.certificateId.trim(),
    studentName:     certData.studentName.trim(),
    courseName:      certData.courseName.trim(),
    institutionName: certData.institutionName.trim(),
    grade:           certData.grade.trim(),
    issueDate:       typeof certData.issueDate === 'bigint' ? certData.issueDate : BigInt(certData.issueDate),
    registeredAt:    BigInt(Math.floor(Date.now() / 1000)),
    documentHash:    certData.documentHash,
    issuedBy:        certData.issuedBy || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    demoIssuerName:  'Demo Presentation Issuer Account',
    isRevoked:       false,
    revokeReason:    '',
    isDemo:          true,
    expectedResult:  'valid',
    demoNotes:       'Registered during live user demonstration session (persisted in localStorage).',
  };

  const updated = [newCert, ...certs];
  memoryDemoCertificates = updated;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, serializeDemo(updated));
  }
  return newCert;
}

/**
 * Revoke a demo certificate in localStorage.
 */
export function revokeDemoCertificate(id: string, reason: string): boolean {
  const certs = getDemoCertificates();
  const index = certs.findIndex(c => c.certificateId.toLowerCase() === id.trim().toLowerCase());
  if (index === -1) return false;

  certs[index].isRevoked = true;
  certs[index].revokeReason = reason.trim();
  certs[index].expectedResult = 'revoked';

  memoryDemoCertificates = [...certs];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, serializeDemo(certs));
  }
  return true;
}

/**
 * Reset demo certificates back to initial defaults.
 */
export function resetDemoCertificates(): DemoCertificate[] {
  memoryDemoCertificates = [...INITIAL_DEMO_CERTIFICATES];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, serializeDemo(INITIAL_DEMO_CERTIFICATES));
  }
  return INITIAL_DEMO_CERTIFICATES;
}

/**
 * Check if DEMO MODE preference is explicitly saved or active.
 */
export function getSavedDemoModePreference(): boolean | null {
  if (typeof window === 'undefined') return null;
  const item = localStorage.getItem(DEMO_MODE_STORAGE_KEY);
  if (item === null) return null;
  return item === 'true';
}

/**
 * Save user toggle for DEMO MODE.
 */
export function setSavedDemoModePreference(active: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, String(active));
  }
}
