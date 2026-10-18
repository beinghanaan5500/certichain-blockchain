import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, ShieldAlert, BookOpen, Building2,
  Calendar, Hash, User, Clock, AlertTriangle, CheckCircle2, XCircle,
  Upload, Copy, Check, ExternalLink, RefreshCw, FileCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getContract,
  hashFile,
  formatTimestamp,
  formatDate,
  formatAddress,
  formatHash,
  getTargetNetworkName,
  getExplorerUrl,
  parseContractError,
} from '../utils/contract';
import { Certificate } from '../types';
import { getDemoCertificate } from '../utils/demoData';

export default function CertificateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { wallet, contract, connectWallet, refreshContract, isDemoMode, revokeDemoCert } = useApp();

  const [cert, setCert] = useState<Certificate | null>(null);
  const [isDemoCert, setIsDemoCert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Revocation
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState('');
  const [revokeSuccess, setRevokeSuccess] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  // Document verification
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState('');
  const [hashingFile, setHashingFile] = useState(false);
  const [hashResult, setHashResult] = useState<'match' | 'mismatch' | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetName = getTargetNetworkName();

  const loadCert = useCallback(async () => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg('');

    // Check demo records first if in demo mode
    if (isDemoMode) {
      const demo = getDemoCertificate(id);
      if (demo) {
        setCert(demo);
        setIsDemoCert(true);
        setNotFound(false);
        setLoading(false);
        return;
      }
    }

    try {
      const c = await getContract();
      if (!c) {
        // Fallback to demo if contract not reachable
        const demo = getDemoCertificate(id);
        if (demo) {
          setCert(demo);
          setIsDemoCert(true);
          setNotFound(false);
          setLoading(false);
          return;
        }
        setErrorMsg('Unable to connect to blockchain RPC.');
        setLoading(false);
        return;
      }

      const exists = await c.certificateExists_check(id);
      if (!exists) {
        // Check demo records as secondary fallback
        const demo = getDemoCertificate(id);
        if (demo) {
          setCert(demo);
          setIsDemoCert(true);
          setNotFound(false);
          setLoading(false);
          return;
        }
        setNotFound(true);
        setLoading(false);
        return;
      }

      const raw = await c.getCertificate(id);
      setCert({
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
      });
      setIsDemoCert(false);
      setNotFound(false);
    } catch (err: any) {
      console.error('Failed to load certificate:', err);
      const demo = getDemoCertificate(id);
      if (demo) {
        setCert(demo);
        setIsDemoCert(true);
        setNotFound(false);
      } else {
        setErrorMsg(parseContractError(err));
      }
    } finally {
      setLoading(false);
    }
  }, [id, isDemoMode]);

  useEffect(() => {
    loadCert();
  }, [loadCert]);

  const handleRevoke = async () => {
    if (!revokeReason.trim() || !cert) return;
    setRevoking(true);
    setRevokeError('');

    // If demo record, handle via demoData
    if (isDemoCert || isDemoMode) {
      const ok = revokeDemoCert(cert.certificateId, revokeReason.trim());
      setRevoking(false);
      if (ok) {
        setRevokeSuccess(true);
        setShowRevokeConfirm(false);
        await loadCert();
      } else {
        setRevokeError('Failed to revoke demo certificate.');
      }
      return;
    }

    try {
      const c = await getContract(true);
      if (!c) throw new Error('Contract unavailable. Ensure wallet is connected.');
      const tx = await c.revokeCertificate(cert.certificateId, revokeReason.trim());
      await tx.wait();
      setRevokeSuccess(true);
      setShowRevokeConfirm(false);
      await loadCert();
      await refreshContract();
    } catch (err: any) {
      console.error('Revocation error:', err);
      setRevokeError(parseContractError(err));
    } finally {
      setRevoking(false);
    }
  };

  const handleFile = useCallback(
    async (f: File) => {
      setFile(f);
      setHashingFile(true);
      setHashResult(null);
      try {
        const hash = await hashFile(f);
        setFileHash(hash);
        if (cert) {
          setHashResult(hash.toLowerCase() === cert.documentHash.toLowerCase() ? 'match' : 'mismatch');
        }
      } catch (err) {
        console.error('Error hashing document:', err);
      } finally {
        setHashingFile(false);
      }
    },
    [cert]
  );

  const handleCopyId = () => {
    if (cert) {
      navigator.clipboard.writeText(cert.certificateId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px', width: 28, height: 28 }} />
        <div style={{ fontSize: 14, color: '#94a3b8' }}>Querying certificate record from {targetName}...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto' }}>
        <button onClick={() => navigate('/records')} className="btn-secondary" style={{ marginBottom: 24, fontSize: '12px' }}>
          <ArrowLeft size={14} /> Back to Records
        </button>
        <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
          <XCircle size={44} color="#ef4444" style={{ margin: '0 auto 14px' }} />
          <h2 style={{ fontSize: 20, color: '#f87171', fontWeight: 700, marginBottom: 8 }}>Certificate Not Found</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
            No certificate with ID <strong>"{id}"</strong> exists on the blockchain smart contract.
          </p>
          <Link to="/records" className="btn-primary" style={{ fontSize: '13px' }}>
            Browse All Records
          </Link>
        </div>
      </div>
    );
  }

  if (!cert) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto' }}>
        <div className="alert alert-error">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>{errorMsg || 'Failed to load certificate record.'}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button onClick={() => navigate('/records')} className="btn-secondary" style={{ fontSize: '12px' }}>
          <ArrowLeft size={14} /> Back to Records
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to={`/verify?id=${encodeURIComponent(cert.certificateId)}`} className="btn-secondary" style={{ fontSize: '12px' }}>
            Open in Verifier ↗
          </Link>
          <button onClick={handleCopyId} className="btn-secondary" style={{ fontSize: '12px' }}>
            {copiedId ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
            {copiedId ? 'Copied' : 'Copy ID'}
          </button>
        </div>
      </div>

      {/* Hero Certificate Status Banner */}
      <div
        className="glass-card"
        style={{
          padding: 28,
          marginBottom: 24,
          border: `1px solid ${cert.isRevoked ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
          background: cert.isRevoked ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '12px',
                background: cert.isRevoked ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                color: cert.isRevoked ? '#f87171' : '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {cert.isRevoked ? <ShieldAlert size={28} /> : <ShieldCheck size={28} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge ${cert.isRevoked ? 'badge-danger' : 'badge-success'}`}>
                  {cert.isRevoked ? 'Officially Revoked' : 'Authentic On-Chain'}
                </span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  ID: <code style={{ color: '#cbd5e1' }}>{cert.certificateId}</code>
                </span>
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
                {cert.studentName}
              </h1>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Grade Awarded
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
              {cert.grade}
            </div>
          </div>
        </div>

        {/* Revocation Information */}
        {cert.isRevoked && (
          <div
            style={{
              marginTop: 20,
              padding: '16px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#fca5a5',
              fontSize: '13px',
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 700, color: '#f87171', marginBottom: 4 }}>
              ⚠️ Certificate Revocation Record
            </div>
            <div>
              <strong>Reason:</strong> {cert.revokeReason || 'Revoked by authorized institution.'}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Academic Info + Blockchain Verification Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Academic Details */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 18 }}>
            Academic Credentials
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Course / Program</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9', marginTop: 2 }}>
                {cert.courseName}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Issuing Academic Institution</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9', marginTop: 2 }}>
                {cert.institutionName}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Date of Issue</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#cbd5e1', marginTop: 2 }}>
                {formatDate(cert.issueDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Blockchain Details */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 18 }}>
            Blockchain Anchoring Details
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Network & Smart Contract</div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: 2 }}>
                {targetName} ({formatAddress(contract.address || '')})
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Registration Block Timestamp</div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: 2 }}>
                {formatTimestamp(cert.registeredAt)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Issuer Wallet Address</div>
              <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#cbd5e1', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                {cert.issuedBy}
                {getExplorerUrl(cert.issuedBy, 'address') && (
                  <a href={getExplorerUrl(cert.issuedBy, 'address')!} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>SHA-256 Document Hash</div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#94a3b8',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  wordBreak: 'break-all',
                  marginTop: 4,
                }}
              >
                {cert.documentHash}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Cryptographic Verification Component */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Document Cryptographic Hash Verification
          </div>
          {/* Quick simulation buttons for presentation */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                const mockFile = new File(['mock content'], `${cert.studentName.replace(/\s+/g, '_')}_Official_Degree.pdf`, { type: 'application/pdf' });
                setFile(mockFile);
                setFileHash(cert.documentHash);
                setHashResult('match');
              }}
              className="btn-secondary"
              style={{ fontSize: '11px', padding: '4px 10px', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}
            >
              ✓ Simulate Matching Original File
            </button>
            <button
              type="button"
              onClick={() => {
                const mockFile = new File(['tampered content'], `${cert.studentName.replace(/\s+/g, '_')}_Tampered_Copy.pdf`, { type: 'application/pdf' });
                setFile(mockFile);
                const alteredHash = '0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678';
                setFileHash(alteredHash);
                setHashResult('mismatch');
              }}
              className="btn-secondary"
              style={{ fontSize: '11px', padding: '4px 10px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              ⚠ Simulate Altered / Tampered File
            </button>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: 16 }}>
          Verify whether an offline file copy matches this on-chain record by computing its SHA-256 fingerprint:
        </p>

        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            padding: '18px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={e => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />
          {hashingFile ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div className="spinner" style={{ width: 16, height: 16 }} />
              <span style={{ fontSize: '13px', color: '#7b93fa' }}>Computing SHA-256...</span>
            </div>
          ) : file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileCheck size={18} color={hashResult === 'match' ? '#34d399' : '#f87171'} />
                <span style={{ fontSize: '13px', color: '#f1f5f9' }}>{file.name}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Click to re-select</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Upload size={16} color="#7b93fa" />
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                Drop certificate PDF or image to check hash match
              </span>
            </div>
          )}
        </div>

        {hashResult === 'match' && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} />
            Hash matches on-chain record! Document is authentic and unaltered.
          </div>
        )}
        {hashResult === 'mismatch' && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={16} />
            Hash mismatch! The file content differs from the on-chain SHA-256 digest.
          </div>
        )}
      </div>

      {/* Revocation Authority Card */}
      {!cert.isRevoked && (
        <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            {isDemoCert || isDemoMode ? 'Demo Certificate Revocation (Simulation)' : 'Administrative Certificate Revocation'}
          </div>

          {(isDemoCert || isDemoMode) ? (
            !showRevokeConfirm ? (
              <div>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: 14 }}>
                  In Demo Mode, you can simulate revoking this credential with a reason to demonstrate institutional disciplinary actions. The revocation persists across page refreshes.
                </p>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => setShowRevokeConfirm(true)}
                  style={{ fontSize: '13px' }}
                >
                  Initiate Demo Revocation
                </button>
              </div>
            ) : null
          ) : !wallet.isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                Only the contract owner or authorized academic issuers can revoke certificates.
              </span>
              <button onClick={connectWallet} className="btn-secondary" style={{ fontSize: '12px' }}>
                Connect Issuer Wallet
              </button>
            </div>
          ) : !wallet.isAuthorizedIssuer ? (
            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
              Connected account (<code>{formatAddress(wallet.address || '')}</code>) is a viewer and does not possess academic revocation privileges on this smart contract.
            </div>
          ) : !showRevokeConfirm ? (
            <div>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: 14 }}>
                Revocation permanently flags this certificate as invalid on the Ethereum blockchain. This action is irreversible.
              </p>
              <button
                type="button"
                className="btn-danger"
                onClick={() => setShowRevokeConfirm(true)}
                style={{ fontSize: '13px' }}
              >
                Initiate Certificate Revocation
              </button>
            </div>
          ) : null}

          {showRevokeConfirm && (
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: 18, borderRadius: 10 }}>
              <div style={{ fontWeight: 600, color: '#f87171', fontSize: '14px', marginBottom: 10 }}>
                Confirm Revocation for {cert.certificateId} {(isDemoCert || isDemoMode) && '(Demo Record)'}
              </div>
              <label className="form-label" htmlFor="revokeReason">
                Reason for Revocation <span style={{ color: '#f87171' }}>*</span>
              </label>
              <textarea
                id="revokeReason"
                className="form-input"
                placeholder="e.g. Falsified transcript records discovered upon post-graduation audit."
                value={revokeReason}
                onChange={e => setRevokeReason(e.target.value)}
                rows={3}
                style={{ resize: 'vertical', marginBottom: 12 }}
              />

              {revokeError && (
                <div style={{ fontSize: '12px', color: '#f87171', marginBottom: 12 }}>
                  {revokeError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleRevoke}
                  disabled={revoking || !revokeReason.trim()}
                  style={{ fontSize: '13px' }}
                >
                  {revoking ? 'Confirming Revocation...' : (isDemoCert || isDemoMode) ? 'Revoke Demo Certificate' : 'Confirm & Broadcast Revocation'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
