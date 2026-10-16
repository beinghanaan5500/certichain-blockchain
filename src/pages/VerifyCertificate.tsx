import React, { useState, useRef, useCallback } from 'react';
import {
  Search, Upload, CheckCircle2, XCircle, AlertTriangle, Hash,
  Shield, ShieldOff, FileQuestion, Info, X, RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getContract, hashFile, formatAddress, formatTimestamp, formatDate } from '../utils/contract';
import { Certificate, VerificationResult } from '../types';

type VerifyStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'error';

const RESULT_MESSAGES = {
  found:         { color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', icon: CheckCircle2, label: 'Certificate Found & Valid' },
  'not-found':   { color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)',   icon: XCircle,       label: 'Certificate Not Found'    },
  error:         { color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', icon: AlertTriangle, label: 'Verification Error'        },
  idle:          { color: '#64748b', bg: 'transparent',           border: 'transparent',            icon: Search,        label: ''                          },
  loading:       { color: '#7b93fa', bg: 'rgba(79,110,247,0.08)', border: 'rgba(79,110,247,0.25)', icon: Search,        label: 'Verifying...'              },
};

export default function VerifyCertificate() {
  const { contract } = useApp();
  const [certId, setCertId]   = useState('');
  const [status, setStatus]   = useState<VerifyStatus>('idle');
  const [cert, setCert]       = useState<Certificate | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [file, setFile]       = useState<File | null>(null);
  const [fileHash, setFileHash] = useState('');
  const [hashingFile, setHashingFile] = useState(false);
  const [hashResult, setHashResult]   = useState<'match' | 'mismatch' | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVerify = async () => {
    if (!certId.trim()) return;
    setStatus('loading');
    setCert(null);
    setErrorMsg('');
    setHashResult(null);

    try {
      const c = await getContract();
      if (!c) {
        setStatus('error');
        setErrorMsg('Cannot connect to the blockchain. Ensure the Hardhat node is running.');
        return;
      }

      const exists = await c.certificateExists_check(certId.trim());
      if (!exists) {
        setStatus('not-found');
        return;
      }

      const raw = await c.getCertificate(certId.trim());
      const certificate: Certificate = {
        certificateId:   raw.certificateId,
        studentName:     raw.studentName,
        courseName:      raw.courseName,
        institutionName: raw.institutionName,
        grade:           raw.grade,
        issueDate:       raw.issueDate,
        registeredAt:    raw.registeredAt,
        documentHash:    raw.documentHash,
        issuedBy:        raw.issuedBy,
        isRevoked:       raw.isRevoked,
        revokeReason:    raw.revokeReason,
      };
      setCert(certificate);
      setStatus('found');

      // Check hash if file already uploaded
      if (fileHash) {
        setHashResult(fileHash === raw.documentHash ? 'match' : 'mismatch');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'An unexpected error occurred');
    }
  };

  const handleFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setHashingFile(true);
    setHashResult(null);
    try {
      const hash = await hashFile(selectedFile);
      setFileHash(hash);
      // Compare immediately if certificate already loaded
      if (cert) {
        setHashResult(hash === cert.documentHash ? 'match' : 'mismatch');
      }
    } finally {
      setHashingFile(false);
    }
  }, [cert]);

  const reset = () => {
    setCertId(''); setStatus('idle'); setCert(null);
    setErrorMsg(''); setFile(null); setFileHash('');
    setHashResult(null);
  };

  return (
    <div style={{ padding: '32px', maxWidth: 900 }}>
      <div className="page-header">
        <h1 className="page-title gradient-text">Verify Certificate</h1>
        <p className="page-subtitle">Authenticate any certificate against the immutable blockchain record</p>
      </div>

      {!contract.isDeployed && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <div><strong>Contract Not Deployed</strong> — Start the Hardhat node and deploy the contract first.</div>
        </div>
      )}

      {/* Search Box */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
          Step 1 — Enter Certificate ID
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            className="form-input"
            placeholder="e.g. CERT-2024-0001"
            value={certId}
            onChange={e => setCertId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
            disabled={status === 'loading'}
            style={{ flex: 1, fontSize: 15 }}
          />
          <button
            className="btn-primary"
            onClick={handleVerify}
            disabled={status === 'loading' || !certId.trim()}
            style={{ padding: '12px 24px' }}
          >
            {status === 'loading'
              ? <><div className="spinner" /> Verifying...</>
              : <><Search size={16} /> Verify</>
            }
          </button>
          {status !== 'idle' && (
            <button className="btn-secondary" onClick={reset} title="Reset">
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Not Found */}
      {status === 'not-found' && (
        <div className="glass-card fade-in" style={{ padding: 48, textAlign: 'center' }}>
          <XCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>Certificate Not Found</h2>
          <p style={{ fontSize: 14, color: '#64748b' }}>
            No certificate with ID <strong style={{ color: '#f87171' }}>"{certId}"</strong> exists on the blockchain.
          </p>
          <p style={{ fontSize: 13, color: '#475569', marginTop: 8 }}>
            The certificate may not have been registered, or the ID may be incorrect.
          </p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="alert alert-error fade-in">
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <div><strong>Verification Failed:</strong> {errorMsg}</div>
        </div>
      )}

      {/* Found — Certificate Details */}
      {status === 'found' && cert && (
        <div className="fade-in">
          {/* Status Banner */}
          <div style={{
            padding: '16px 20px', borderRadius: 12, marginBottom: 20,
            background: cert.isRevoked ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
            border: `1px solid ${cert.isRevoked ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            {cert.isRevoked
              ? <ShieldOff size={28} color="#ef4444" />
              : <Shield size={28} color="#10b981" />
            }
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: cert.isRevoked ? '#f87171' : '#34d399' }}>
                {cert.isRevoked ? '⚠ Certificate REVOKED' : '✓ Certificate is VALID'}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                {cert.isRevoked
                  ? `Revoked reason: "${cert.revokeReason}"`
                  : 'This certificate record exists on the Ethereum blockchain and has not been revoked.'}
              </div>
            </div>
          </div>

          {/* Certificate Data */}
          <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
              Certificate Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
              {[
                { label: 'Certificate ID',  value: cert.certificateId,   mono: true },
                { label: 'Student Name',    value: cert.studentName                 },
                { label: 'Course / Degree', value: cert.courseName                  },
                { label: 'Institution',     value: cert.institutionName             },
                { label: 'Grade / CGPA',    value: cert.grade                       },
                { label: 'Issue Date',      value: formatDate(cert.issueDate)        },
                { label: 'Registered On',   value: formatTimestamp(cert.registeredAt) },
                { label: 'Issued By',       value: formatAddress(cert.issuedBy), mono: true },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, color: mono ? '#4f6ef7' : '#e2e8f0', fontFamily: mono ? 'monospace' : undefined, fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Document Hash */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Registered Document Hash (SHA-256)
              </div>
              <div className="hash-text" style={{ wordBreak: 'break-all', fontSize: 11 }}>
                {cert.documentHash}
              </div>
            </div>
          </div>

          {/* Document Verification */}
          <div className="glass-card" style={{ padding: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Step 2 — Verify Document Integrity (Optional)
            </div>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 20 }}>
              Upload the original certificate document. We will compute its SHA-256 hash and compare it with the hash stored on-chain.
            </p>

            <div
              className={`upload-zone ${dragOver ? 'dragover' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            >
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              {file ? (
                <div>
                  <CheckCircle2 size={24} color="#10b981" style={{ marginBottom: 6 }} />
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#34d399' }}>{file.name}</div>
                </div>
              ) : (
                <div>
                  <Upload size={24} color="#4f6ef7" style={{ marginBottom: 6 }} />
                  <div style={{ fontSize: 13, color: '#7b93fa' }}>Click or drag document to verify integrity</div>
                </div>
              )}
            </div>

            {hashingFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, color: '#7b93fa', fontSize: 13 }}>
                <div className="spinner" />
                Computing SHA-256 hash...
              </div>
            )}

            {fileHash && !hashingFile && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Computed Hash
                </div>
                <div className="hash-text" style={{ wordBreak: 'break-all', fontSize: 11 }}>
                  {fileHash}
                </div>
              </div>
            )}

            {hashResult && (
              <div style={{ marginTop: 16 }}>
                {hashResult === 'match' ? (
                  <div className="alert alert-success">
                    <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Document Hash MATCHED ✓</strong>
                      <div style={{ fontSize: 12, marginTop: 2 }}>
                        The uploaded document is the exact file that was hashed and registered on the blockchain. The certificate is authentic.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-error">
                    <XCircle size={18} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Document Hash MISMATCH ✗</strong>
                      <div style={{ fontSize: 12, marginTop: 2 }}>
                        The uploaded document does not match the registered hash. This document may be modified or incorrect.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Idle State Guide */}
      {status === 'idle' && (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
          <Shield size={48} color="#1e3a70" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
            Enter a Certificate ID to Begin Verification
          </h2>
          <p style={{ fontSize: 13, color: '#334155', maxWidth: 460, margin: '0 auto', lineHeight: 1.7 }}>
            CertiChain retrieves the certificate record from the Ethereum blockchain and verifies its authenticity.
            Optionally upload the original document to verify its hash integrity.
          </p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            {['Certificate not found → Not registered on blockchain', 'Hash matched → Document is authentic', 'Hash mismatch → Document may be tampered', 'Revoked → Certificate has been invalidated'].map(item => (
              <div key={item} style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Info size={12} color="#4f6ef7" />
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
