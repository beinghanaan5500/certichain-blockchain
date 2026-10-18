import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FilePlus, Upload, Hash, Calendar, User, BookOpen, Building2,
  Star, AlertTriangle, CheckCircle2, Loader2, Info, X, ExternalLink,
  ShieldCheck, RefreshCw, Copy, Check, FileCheck, ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getContract,
  hashFile,
  getTargetNetworkName,
  getTargetChainId,
  formatHash,
  getExplorerUrl,
  validateCertificateId,
  validateGrade,
  parseContractError,
} from '../utils/contract';
import { TxState } from '../types';

interface FormData {
  certificateId:   string;
  studentName:     string;
  courseName:      string;
  institutionName: string;
  grade:           string;
  issueDate:       string;
}

const INITIAL_FORM: FormData = {
  certificateId:   '',
  studentName:     '',
  courseName:      '',
  institutionName: 'National Institute of Technology',
  grade:           '',
  issueDate:       new Date().toISOString().split('T')[0],
};

function generateId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CERT-${year}-${rand}`;
}

// ── Reusable Input Field (Declared outside to ensure continuous typing focus) ──
interface InputFieldProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
  type?: string;
  placeholder?: string;
  value: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function InputField({
  id,
  label,
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  error,
  disabled,
  required,
  onChange,
}: InputFieldProps) {
  return (
    <div>
      <label className="form-label" htmlFor={id}>
        <Icon size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
        {label} {required && <span style={{ color: '#f87171' }}>*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoComplete="off"
      />
      {error && (
        <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle size={11} />
          {error}
        </div>
      )}
    </div>
  );
}

export default function RegisterCertificate() {
  const {
    wallet,
    contract,
    connectWallet,
    switchNetwork,
    refreshContract,
    isDemoMode,
    addDemoCertificate,
    demoCertificates,
    toggleDemoMode,
  } = useApp();

  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const [hashingFile, setHashingFile] = useState(false);
  const [duplicateChecked, setDuplicateChecked] = useState<boolean | null>(null);
  const [tx, setTx] = useState<TxState>({ isLoading: false, hash: null, error: null, success: false });
  const [txStage, setTxStage] = useState<'idle' | 'signing' | 'confirming' | 'confirmed'>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetName = getTargetNetworkName();
  const targetChainId = getTargetChainId();

  // ── Pre-check if ID already exists ──────────────────────────────────────────
  const checkDuplicateId = useCallback(async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed || trimmed.length < 3) {
      setDuplicateChecked(null);
      return;
    }

    if (isDemoMode) {
      const exists = demoCertificates.some(c => c.certificateId.toLowerCase() === trimmed.toLowerCase());
      setDuplicateChecked(exists);
      if (exists) {
        setErrors(prev => ({ ...prev, certificateId: 'This Certificate ID is already registered in demo records.' }));
      } else {
        setErrors(prev => {
          const next = { ...prev };
          delete next.certificateId;
          return next;
        });
      }
      return;
    }

    try {
      const c = await getContract();
      if (!c) return;
      const exists = await c.certificateExists_check(trimmed);
      setDuplicateChecked(exists);
      if (exists) {
        setErrors(prev => ({ ...prev, certificateId: 'This Certificate ID is already registered on-chain.' }));
      } else {
        setErrors(prev => {
          const next = { ...prev };
          delete next.certificateId;
          return next;
        });
      }
    } catch {
      setDuplicateChecked(null);
    }
  }, [isDemoMode, demoCertificates]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (field === 'certificateId') {
      setDuplicateChecked(null);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};

    const idErr = validateCertificateId(form.certificateId);
    if (idErr) newErrors.certificateId = idErr;
    if (duplicateChecked === true) newErrors.certificateId = 'Certificate ID already taken on-chain.';

    if (!form.studentName.trim()) newErrors.studentName = 'Student name is required.';
    else if (form.studentName.trim().length < 2) newErrors.studentName = 'Student name must be at least 2 characters.';

    if (!form.courseName.trim()) newErrors.courseName = 'Course or degree name is required.';
    if (!form.institutionName.trim()) newErrors.institutionName = 'Institution name is required.';

    const gradeErr = validateGrade(form.grade);
    if (gradeErr) newErrors.grade = gradeErr;

    if (!form.issueDate) newErrors.issueDate = 'Issue date is required.';

    if (!file || !fileHash) {
      setTx(prev => ({
        ...prev,
        error: 'Please upload the digital certificate document (PDF/Image) to generate its cryptographic SHA-256 hash.',
      }));
      setErrors(newErrors);
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setHashingFile(true);
    setTx(prev => ({ ...prev, error: null }));
    try {
      const hash = await hashFile(selectedFile);
      setFileHash(hash);
    } catch (err) {
      console.error('File hashing failed:', err);
      setFileHash('');
      setTx(prev => ({ ...prev, error: 'Could not generate document hash. Please try another file.' }));
    } finally {
      setHashingFile(false);
    }
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const handleCopyHash = () => {
    if (fileHash) {
      navigator.clipboard.writeText(fileHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // In Demo Mode, issue without wallet
    if (isDemoMode) {
      setTx({ isLoading: true, hash: null, error: null, success: false });
      setTxStage('confirming');

      try {
        const issueDateUnix = Math.floor(new Date(form.issueDate).getTime() / 1000);
        addDemoCertificate({
          certificateId:   form.certificateId.trim(),
          studentName:     form.studentName.trim(),
          courseName:      form.courseName.trim(),
          institutionName: form.institutionName.trim(),
          grade:           form.grade.trim(),
          issueDate:       issueDateUnix,
          documentHash:    fileHash,
          issuedBy:        wallet.address || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        });

        // Simulated demo transaction hash
        const demoTxHash = '0x9f4a8b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a';
        setTxStage('confirmed');
        setTx({ isLoading: false, hash: demoTxHash, error: null, success: true });
      } catch (err: any) {
        console.error('Demo registration error:', err);
        setTxStage('idle');
        setTx({ isLoading: false, hash: null, error: err.message || 'Demo registration failed.', success: false });
      }
      return;
    }

    if (!wallet.isConnected) {
      connectWallet();
      return;
    }

    if (!wallet.isCorrectNetwork) {
      await switchNetwork(targetChainId);
      return;
    }

    setTx({ isLoading: true, hash: null, error: null, success: false });
    setTxStage('signing');

    try {
      const c = await getContract(true);
      if (!c) throw new Error('Contract not available. Please verify your blockchain network connection.');

      const issueDateUnix = Math.floor(new Date(form.issueDate).getTime() / 1000);
      const docHashBytes32 = fileHash as `0x${string}`;

      // Prompt signature
      const response = await c.registerCertificate(
        form.certificateId.trim(),
        form.studentName.trim(),
        form.courseName.trim(),
        form.institutionName.trim(),
        form.grade.trim(),
        issueDateUnix,
        docHashBytes32
      );

      setTxStage('confirming');
      setTx({ isLoading: true, hash: response.hash, error: null, success: false });

      await response.wait();

      setTxStage('confirmed');
      setTx({ isLoading: false, hash: response.hash, error: null, success: true });
      await refreshContract();
    } catch (err: any) {
      console.error('Registration error:', err);
      setTxStage('idle');
      setTx({
        isLoading: false,
        hash: null,
        error: parseContractError(err),
        success: false,
      });
    }
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setFile(null);
    setFileHash('');
    setDuplicateChecked(null);
    setErrors({});
    setTx({ isLoading: false, hash: null, error: null, success: false });
    setTxStage('idle');
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1040, margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1 className="page-title gradient-text">Register Certificate</h1>
        <p className="page-subtitle">
          Anchor student credential metadata and cryptographic document proofs onto the Ethereum blockchain.
        </p>
      </div>

      {/* Network Alert / Wallet Requirements */}
      {isDemoMode ? (
        <div className="alert alert-info" style={{ marginBottom: 24, background: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.25)' }}>
          <Info size={18} style={{ flexShrink: 0, marginTop: 2, color: '#60a5fa' }} />
          <div style={{ flex: 1, fontSize: '13px', color: '#93c5fd' }}>
            <strong>Demo Mode Active:</strong> You can issue simulated student credentials and compute local SHA-256 digests. Records are stored in demo storage without gas or wallet requirements and survive page refreshes.
          </div>
          <button
            type="button"
            onClick={() => toggleDemoMode(false)}
            className="btn-secondary"
            style={{ fontSize: '11px', padding: '4px 10px', flexShrink: 0 }}
          >
            Switch to On-Chain
          </button>
        </div>
      ) : !wallet.isConnected ? (
        <div className="alert alert-info" style={{ marginBottom: 24 }}>
          <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <strong>Web3 Wallet Required for Registration</strong> — Connect your MetaMask wallet to register certificates on{' '}
            <strong>{targetName}</strong>. Public verification and record exploration do not require a wallet.
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={connectWallet}
            style={{ padding: '6px 14px', fontSize: '12px', flexShrink: 0 }}
          >
            Connect Wallet
          </button>
        </div>
      ) : !wallet.isCorrectNetwork ? (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <strong>Wrong Network</strong> — Your wallet is currently connected to Chain ID{' '}
            <code>{wallet.chainId ?? 'unknown'}</code>. Switch to <strong>{targetName}</strong> (Chain ID: <code>{targetChainId}</code>).
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => switchNetwork(targetChainId)}
            style={{ padding: '6px 14px', fontSize: '12px', flexShrink: 0 }}
          >
            Switch to {targetName.replace(/\(.*\)/, '')}
          </button>
        </div>
      ) : !wallet.isAuthorizedIssuer ? (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Guest Account Connected ({wallet.address?.slice(0, 8)}...)</strong> — This wallet address is not an authorized academic issuer on the smart contract. Transactions submitted by unauthorized addresses will be reverted by the contract. Connect the contract deployer/owner account or ask the institution admin to whitelist your address via <code>authorizeIssuer</code>.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 600 }}>
              Authorized Issuer Verified
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              ({wallet.isOwner ? 'Contract Owner' : 'Whitelisted Institution'})
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Target: {targetName}
          </span>
        </div>
      )}

      {/* Success Receipt Card */}
      {tx.success && (
        <div
          className="glass-card"
          style={{
            padding: 28,
            marginBottom: 28,
            border: '1px solid rgba(16, 185, 129, 0.3)',
            background: 'rgba(16, 185, 129, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#34d399', marginBottom: 4 }}>
                Certificate Registered Successfully!
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: 16 }}>
                The certificate record and document SHA-256 fingerprint have been permanently etched into the blockchain ledger.
              </p>

              {tx.hash && (
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    marginBottom: 16,
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Tx Hash: {tx.hash}</span>
                  {getExplorerUrl(tx.hash, 'tx') && (
                    <a
                      href={getExplorerUrl(tx.hash, 'tx')!}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                    >
                      View on Etherscan <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <Link to={`/records/${form.certificateId || ''}`} className="btn-primary" style={{ fontSize: '13px' }}>
                  View in Records
                  <ArrowRight size={14} />
                </Link>
                <button type="button" onClick={resetForm} className="btn-secondary" style={{ fontSize: '13px' }}>
                  Register Another Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleRegister}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
          {/* Column 1: Academic & Student Information */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Academic & Student Information
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Certificate ID with Generator & Duplicate Check */}
              <div>
                <label className="form-label" htmlFor="certificateId">
                  <Hash size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                  Certificate ID <span style={{ color: '#f87171' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="certificateId"
                    name="certificateId"
                    className="form-input"
                    placeholder="CERT-2024-0001"
                    value={form.certificateId}
                    onChange={e => handleInputChange('certificateId', e.target.value)}
                    onBlur={() => checkDuplicateId(form.certificateId)}
                    disabled={tx.isLoading}
                    style={{ flex: 1 }}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      const id = generateId();
                      handleInputChange('certificateId', id);
                      checkDuplicateId(id);
                    }}
                    disabled={tx.isLoading}
                    style={{ flexShrink: 0, fontSize: '12px', padding: '8px 12px' }}
                  >
                    Generate
                  </button>
                </div>
                {errors.certificateId && (
                  <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={11} />
                    {errors.certificateId}
                  </div>
                )}
                {duplicateChecked === false && form.certificateId.trim().length >= 3 && (
                  <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={11} />
                    Certificate ID is available on-chain
                  </div>
                )}
              </div>

              <InputField
                id="studentName"
                label="Student Full Name"
                icon={User}
                placeholder="e.g. Abdul Hanaan"
                value={form.studentName}
                error={errors.studentName}
                disabled={tx.isLoading}
                required
                onChange={e => handleInputChange('studentName', e.target.value)}
              />

              <InputField
                id="courseName"
                label="Degree / Course Name"
                icon={BookOpen}
                placeholder="e.g. B.Tech Computer Science & Engineering"
                value={form.courseName}
                error={errors.courseName}
                disabled={tx.isLoading}
                required
                onChange={e => handleInputChange('courseName', e.target.value)}
              />

              <InputField
                id="institutionName"
                label="Issuing Academic Institution"
                icon={Building2}
                placeholder="e.g. National Institute of Technology"
                value={form.institutionName}
                error={errors.institutionName}
                disabled={tx.isLoading}
                required
                onChange={e => handleInputChange('institutionName', e.target.value)}
              />

              <InputField
                id="grade"
                label="Grade / Distinction / CGPA"
                icon={Star}
                placeholder="e.g. 9.4 CGPA / First Class with Distinction"
                value={form.grade}
                error={errors.grade}
                disabled={tx.isLoading}
                required
                onChange={e => handleInputChange('grade', e.target.value)}
              />

              <InputField
                id="issueDate"
                label="Official Issue Date"
                icon={Calendar}
                type="date"
                value={form.issueDate}
                error={errors.issueDate}
                disabled={tx.isLoading}
                required
                onChange={e => handleInputChange('issueDate', e.target.value)}
              />
            </div>
          </div>

          {/* Column 2: Document Upload & Cryptographic Hashing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Cryptographic Document Integrity (SHA-256)
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: 16 }}>
                Upload the student's digital certificate (PDF, PNG, or JPEG). A cryptographic SHA-256 digest will be generated locally in your browser. Only the 256-bit fingerprint is written on-chain to protect student privacy.
              </p>

              {/* Upload Dropzone */}
              <div
                className={`upload-zone ${dragOver ? 'dragover' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                style={{
                  border: '2px dashed rgba(79, 110, 247, 0.3)',
                  borderRadius: '12px',
                  padding: '28px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragOver ? 'rgba(79, 110, 247, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.15s ease',
                  marginBottom: 16,
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={e => {
                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
                  }}
                />

                {hashingFile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div className="spinner" style={{ width: 24, height: 24 }} />
                    <span style={{ fontSize: '13px', color: '#7b93fa' }}>Computing SHA-256 fingerprint...</span>
                  </div>
                ) : file ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#10b981',
                        flexShrink: 0,
                      }}
                    >
                      <FileCheck size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {(file.size / 1024).toFixed(1)} KB · Click or drop to replace
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setFile(null);
                        setFileHash('');
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload size={28} color="#7b93fa" style={{ margin: '0 auto 8px', display: 'block' }} />
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>
                      Choose certificate document or drag & drop
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Supports PDF, PNG, JPG (Processed strictly client-side)
                    </div>
                  </div>
                )}
              </div>

              {/* Computed SHA-256 Hash Display */}
              {fileHash && (
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      ✓ SHA-256 Digest Ready
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyHash}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedHash ? '#34d399' : '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {copiedHash ? <Check size={12} /> : <Copy size={12} />}
                      {copiedHash ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: '#94a3b8',
                      wordBreak: 'break-all',
                      lineHeight: 1.5,
                    }}
                  >
                    {fileHash}
                  </div>
                </div>
              )}
            </div>

            {/* Error Message if tx failed */}
            {tx.error && (
              <div className="alert alert-error">
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '13px' }}>{tx.error}</div>
              </div>
            )}

            {/* Submit Action Box */}
            <div className="glass-card" style={{ padding: 20 }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={tx.isLoading || hashingFile}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '13px',
                  fontSize: '14px',
                }}
              >
                {tx.isLoading ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    {txStage === 'signing'
                      ? 'Confirm in MetaMask...'
                      : txStage === 'confirming'
                      ? 'Mining Block Confirmation...'
                      : 'Processing...'}
                  </>
                ) : (
                  <>
                    <FilePlus size={16} />
                    {isDemoMode ? 'Issue Certificate (Demo Mode)' : 'Register Certificate on Blockchain'}
                  </>
                )}
              </button>

              <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: 10 }}>
                {isDemoMode
                  ? 'Demo record will be persisted locally · Presentation Simulation'
                  : `Transaction will be broadcast to ${targetName} · Gas fees apply`}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
