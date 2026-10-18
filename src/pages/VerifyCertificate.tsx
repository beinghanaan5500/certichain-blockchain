import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, Upload, CheckCircle2, XCircle, AlertTriangle, Hash,
  ShieldCheck, ShieldAlert, FileQuestion, Info, X, RotateCcw,
  User, BookOpen, Building2, Calendar, Star, Clock, ExternalLink,
  Copy, Check, FileCheck, ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getContract,
  hashFile,
  formatAddress,
  formatTimestamp,
  formatDate,
  formatHash,
  getTargetNetworkName,
  getExplorerUrl,
  parseContractError,
} from '../utils/contract';
import { Certificate } from '../types';

type VerifyStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'error';

export default function VerifyCertificate() {
  const { contract, refreshContract } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [certId, setCertId] = useState(searchParams.get('id') || '');
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [cert, setCert] = useState<Certificate | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState('');
  const [hashingFile, setHashingFile] = useState(false);
  const [hashResult, setHashResult] = useState<'match' | 'mismatch' | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetName = getTargetNetworkName();

  const verifyCertificateId = useCallback(
    async (idToVerify: string, currentFileHash?: string) => {
      const trimmed = idToVerify.trim();
      if (!trimmed) return;

      setStatus('loading');
      setCert(null);
      setErrorMsg('');
      setHashResult(null);

      try {
        const c = await getContract();
        if (!c) {
          setStatus('error');
          setErrorMsg(
            `Unable to establish RPC connection to ${targetName}. If running locally, ensure your node is active with 'npm run start'.`
          );
          return;
        }

        const exists = await c.certificateExists_check(trimmed);
        if (!exists) {
          setStatus('not-found');
          return;
        }

        const raw = await c.getCertificate(trimmed);
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

        const hashToCompare = currentFileHash || fileHash;
        if (hashToCompare) {
          setHashResult(hashToCompare.toLowerCase() === raw.documentHash.toLowerCase() ? 'match' : 'mismatch');
        }
      } catch (err: any) {
        console.error('Verification query failed:', err);
        setStatus('error');
        setErrorMsg(parseContractError(err));
      }
    },
    [fileHash, targetName]
  );

  // Check URL param on mount
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      setCertId(idParam);
      verifyCertificateId(idParam);
    }
  }, [searchParams, verifyCertificateId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) return;
    setSearchParams({ id: certId.trim() });
    verifyCertificateId(certId);
  };

  const handleFile = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
      setHashingFile(true);
      setHashResult(null);
      try {
        const hash = await hashFile(selectedFile);
        setFileHash(hash);
        if (cert) {
          setHashResult(hash.toLowerCase() === cert.documentHash.toLowerCase() ? 'match' : 'mismatch');
        }
      } catch (err) {
        console.error('File hashing error:', err);
      } finally {
        setHashingFile(false);
      }
    },
    [cert]
  );

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const handleCopyLink = () => {
    if (cert) {
      const url = `${window.location.origin}/verify?id=${encodeURIComponent(cert.certificateId)}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const reset = () => {
    setCertId('');
    setStatus('idle');
    setCert(null);
    setErrorMsg('');
    setFile(null);
    setFileHash('');
    setHashResult(null);
    setSearchParams({});
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1 className="page-title gradient-text">Verify Certificate</h1>
        <p className="page-subtitle">
          Query the Ethereum blockchain to verify student credential authenticity and validate document integrity.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="glass-card" style={{ padding: '24px 28px', marginBottom: 28 }}>
        <form onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="certId">
            Enter Certificate ID
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={16}
                color="#64748b"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="certId"
                type="text"
                className="form-input"
                placeholder="e.g. CERT-2024-0001 or CERT-2024-1234"
                value={certId}
                onChange={e => setCertId(e.target.value)}
                style={{ paddingLeft: 40 }}
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={status === 'loading' || !certId.trim()}
              style={{ flexShrink: 0, padding: '10px 22px' }}
            >
              {status === 'loading' ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14 }} />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Verify On-Chain
                </>
              )}
            </button>
            {status !== 'idle' && (
              <button
                type="button"
                className="btn-secondary"
                onClick={reset}
                title="Reset verification"
                style={{ padding: '10px 14px' }}
              >
                <RotateCcw size={15} />
              </button>
            )}
          </div>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontSize: '12px', color: '#64748b' }}>
          <span>Target Network: <strong>{targetName}</strong></span>
          <span>•</span>
          <span>Permissionless: No wallet required to verify</span>
        </div>
      </div>

      {/* STATE 1: Error Banner */}
      {status === 'error' && (
        <div className="alert alert-error" style={{ marginBottom: 28 }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <strong>Verification Query Error:</strong> {errorMsg}
          </div>
          <button
            onClick={() => verifyCertificateId(certId)}
            className="btn-secondary"
            style={{ fontSize: '11px', padding: '4px 10px', flexShrink: 0 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* STATE 2: Certificate Not Found */}
      {status === 'not-found' && (
        <div
          className="glass-card"
          style={{
            padding: 40,
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            background: 'rgba(239, 68, 68, 0.04)',
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <XCircle size={28} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f87171', marginBottom: 6 }}>
            Certificate Not Found
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.6 }}>
            No certificate with the identifier <strong>"{certId}"</strong> has been registered on the{' '}
            {targetName} smart contract.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link to="/records" className="btn-secondary" style={{ fontSize: '12px' }}>
              Explore Registered Records
            </Link>
            <button onClick={reset} className="btn-primary" style={{ fontSize: '12px' }}>
              Search Another ID
            </button>
          </div>
        </div>
      )}

      {/* STATE 3: Certificate Found & Verification Breakdown */}
      {status === 'found' && cert && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Main Status Badge Card */}
          <div
            className="glass-card"
            style={{
              padding: 24,
              border: `1px solid ${cert.isRevoked ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
              background: cert.isRevoked ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: cert.isRevoked ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                    color: cert.isRevoked ? '#f87171' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {cert.isRevoked ? <ShieldAlert size={26} /> : <ShieldCheck size={26} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      className={`badge ${cert.isRevoked ? 'badge-danger' : 'badge-success'}`}
                      style={{ fontSize: '12px', padding: '4px 10px' }}
                    >
                      {cert.isRevoked ? 'Revoked by Institution' : 'Authentic & Valid'}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      ID: <strong>{cert.certificateId}</strong>
                    </span>
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
                    {cert.studentName}
                  </h2>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '7px 12px' }}
                >
                  {copiedLink ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                  {copiedLink ? 'Link Copied' : 'Share Verification'}
                </button>
                <Link
                  to={`/records/${cert.certificateId}`}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '7px 12px' }}
                >
                  Audit Details ↗
                </Link>
              </div>
            </div>

            {/* Revocation Warning Box if revoked */}
            {cert.isRevoked && (
              <div
                style={{
                  marginTop: 18,
                  padding: '14px 18px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '13px',
                }}
              >
                <div style={{ fontWeight: 700, color: '#f87171', marginBottom: 4 }}>
                  ⚠️ This Certificate Was Officially Revoked
                </div>
                <div>
                  <strong>Revocation Reason:</strong> {cert.revokeReason || 'No specific reason specified by issuer.'}
                </div>
              </div>
            )}
          </div>

          {/* Detailed Certificate Metadata Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {/* Academic Credential Card */}
            <div className="glass-card" style={{ padding: 22 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                Academic Information
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <BookOpen size={16} color="#7b93fa" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Degree / Program</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>{cert.courseName}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Building2 size={16} color="#7b93fa" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Issuing Institution</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>{cert.institutionName}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Star size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Grade / CGPA</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>{cert.grade}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Calendar size={16} color="#7b93fa" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Date of Issue</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>{formatDate(cert.issueDate)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Blockchain On-Chain Provenance Card */}
            <div className="glass-card" style={{ padding: 22 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                Blockchain Provenance
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Clock size={16} color="#2dd4bf" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>On-Chain Registration Timestamp</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
                      {formatTimestamp(cert.registeredAt)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <User size={16} color="#2dd4bf" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Issuer Wallet Address</div>
                    <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#cbd5e1' }}>
                      {formatAddress(cert.issuedBy)}
                      {getExplorerUrl(cert.issuedBy, 'address') && (
                        <a
                          href={getExplorerUrl(cert.issuedBy, 'address')!}
                          target="_blank"
                          rel="noreferrer"
                          style={{ marginLeft: 6, color: '#60a5fa' }}
                          title="View on Etherscan"
                        >
                          ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 4 }}>
                    On-Chain Document Hash (SHA-256)
                  </div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: '#94a3b8',
                      background: 'rgba(0,0,0,0.25)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      wordBreak: 'break-all',
                    }}
                  >
                    {cert.documentHash}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Document Integrity Check (Optional file comparison) */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Verify Physical / Digital Document Integrity
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: 16 }}>
              Have a copy of the PDF or scan? Drop it here to calculate its SHA-256 fingerprint client-side and verify whether any pixel or character has been tampered with.
            </p>

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
                border: '2px dashed rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? 'rgba(79, 110, 247, 0.08)' : 'rgba(255, 255, 255, 0.02)',
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: '13px', color: '#7b93fa' }}>Computing document hash...</span>
                </div>
              ) : file ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileCheck size={20} color="#34d399" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>{file.name}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Click to choose different file</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <Upload size={18} color="#7b93fa" />
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                    Drop document here to verify hash match
                  </span>
                </div>
              )}
            </div>

            {/* Cryptographic Comparison Result */}
            {hashResult === 'match' && (
              <div
                style={{
                  marginTop: 14,
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#34d399',
                  fontSize: '13px',
                }}
              >
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Cryptographic Match Confirmed:</strong> The uploaded document SHA-256 fingerprint matches the exact hash stored on-chain at registration. Document is authentic and unaltered.
                </div>
              </div>
            )}

            {hashResult === 'mismatch' && (
              <div
                style={{
                  marginTop: 14,
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#f87171',
                  fontSize: '13px',
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Document Mismatch Detected:</strong> The uploaded file hash (<code>{formatHash(fileHash)}</code>) does NOT match the on-chain fingerprint (<code>{formatHash(cert.documentHash)}</code>). This file may have been modified or is a different document.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
