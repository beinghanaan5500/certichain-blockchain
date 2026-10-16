import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Shield, ShieldOff, Award, User, BookOpen, Building2,
  Calendar, Hash, Wallet, Clock, AlertTriangle, CheckCircle2, XCircle,
  Upload, ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getContract, hashFile, formatTimestamp, formatDate, formatAddress } from '../utils/contract';
import { Certificate } from '../types';
import { ethers } from 'ethers';

export default function CertificateDetail() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const { wallet, contract } = useApp();

  const [cert, setCert]   = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Revocation
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState('');
  const [revokeSuccess, setRevokeSuccess] = useState(false);

  // Document verify
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState('');
  const [hashingFile, setHashingFile] = useState(false);
  const [hashResult, setHashResult] = useState<'match' | 'mismatch' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCert = useCallback(async () => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    setLoading(true);
    try {
      const c = await getContract();
      if (!c) { setLoading(false); return; }
      const exists = await c.certificateExists_check(id);
      if (!exists) { setNotFound(true); setLoading(false); return; }
      const raw = await c.getCertificate(id);
      setCert({
        certificateId: raw.certificateId, studentName: raw.studentName,
        courseName: raw.courseName, institutionName: raw.institutionName,
        grade: raw.grade, issueDate: raw.issueDate, registeredAt: raw.registeredAt,
        documentHash: raw.documentHash, issuedBy: raw.issuedBy,
        isRevoked: raw.isRevoked, revokeReason: raw.revokeReason,
      });
    } catch { setNotFound(true); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadCert(); }, [loadCert]);

  const handleRevoke = async () => {
    if (!revokeReason.trim() || !cert) return;
    setRevoking(true);
    setRevokeError('');
    try {
      const c = await getContract(true);
      if (!c) throw new Error('Contract unavailable');
      const tx = await c.revokeCertificate(cert.certificateId, revokeReason.trim());
      await tx.wait();
      setRevokeSuccess(true);
      await loadCert();
    } catch (err: any) {
      setRevokeError(err?.reason || err?.message || 'Revocation failed');
    } finally {
      setRevoking(false);
    }
  };

  const handleFile = useCallback(async (f: File) => {
    setFile(f); setHashingFile(true); setHashResult(null);
    try {
      const hash = await hashFile(f);
      setFileHash(hash);
      if (cert) setHashResult(hash === cert.documentHash ? 'match' : 'mismatch');
    } finally { setHashingFile(false); }
  }, [cert]);

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <div className="spinner" style={{ margin: '0 auto 12px' }} />
      <div style={{ fontSize: 13, color: '#475569' }}>Loading certificate from blockchain...</div>
    </div>
  );

  if (notFound) return (
    <div style={{ padding: '32px', maxWidth: 700 }}>
      <button onClick={() => navigate(-1)} className="btn-secondary" style={{ marginBottom: 24 }}>
        <ArrowLeft size={14} /> Back
      </button>
      <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
        <XCircle size={48} color="#ef4444" style={{ marginBottom: 14 }} />
        <h2 style={{ fontSize: 20, color: '#f87171', fontWeight: 700 }}>Certificate Not Found</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>
          No certificate with ID <strong>"{id}"</strong> exists on this blockchain.
        </p>
        <Link to="/records" className="btn-secondary" style={{ marginTop: 20, textDecoration: 'none', display: 'inline-flex' }}>
          ← Back to Records
        </Link>
      </div>
    </div>
  );

  if (!cert) return null;

  const fields = [
    { icon: Award,     label: 'Certificate ID',  value: cert.certificateId,          mono: true  },
    { icon: User,      label: 'Student Name',    value: cert.studentName              },
    { icon: BookOpen,  label: 'Course / Degree', value: cert.courseName               },
    { icon: Building2, label: 'Institution',     value: cert.institutionName          },
    { icon: Award,     label: 'Grade / CGPA',    value: cert.grade                    },
    { icon: Calendar,  label: 'Issue Date',      value: formatDate(cert.issueDate)    },
    { icon: Clock,     label: 'Registered On',   value: formatTimestamp(cert.registeredAt) },
    { icon: Wallet,    label: 'Issued By (Address)', value: cert.issuedBy,           mono: true  },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: 900 }}>
      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn-secondary" style={{ marginBottom: 24 }}>
        <ArrowLeft size={14} /> Back to Records
      </button>

      {/* Status Banner */}
      <div style={{
        padding: '20px 24px', borderRadius: 14, marginBottom: 24,
        background: cert.isRevoked ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.07)',
        border: `1px solid ${cert.isRevoked ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.2)'}`,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        {cert.isRevoked
          ? <ShieldOff size={32} color="#ef4444" />
          : <Shield size={32} color="#10b981" />
        }
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: cert.isRevoked ? '#f87171' : '#34d399' }}>
            {cert.isRevoked ? 'Certificate REVOKED' : 'Certificate VALID'}
          </div>
          {cert.isRevoked
            ? <div style={{ fontSize: 13, color: '#64748b' }}>Reason: {cert.revokeReason}</div>
            : <div style={{ fontSize: 13, color: '#64748b' }}>Registered on Ethereum blockchain — immutable record</div>
          }
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Certificate Details */}
        <div className="glass-card" style={{ padding: 28, gridColumn: '1 / -1' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>
            Certificate Details
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px 32px' }}>
            {fields.map(({ icon: Icon, label, value, mono }) => (
              <div key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <Icon size={12} color="#475569" />
                  <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                </div>
                <div style={{ fontSize: 14, color: mono ? '#7b93fa' : '#e2e8f0', fontFamily: mono ? 'monospace' : undefined, fontWeight: 500, wordBreak: 'break-all' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Hash */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            <Hash size={12} style={{ display: 'inline', marginRight: 4 }} />
            Registered Document Hash
          </div>
          <div className="hash-text" style={{ wordBreak: 'break-all', fontSize: 11, lineHeight: 1.8 }}>
            {cert.documentHash}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: '#334155' }}>
            SHA-256 hash of the original certificate document
          </div>
        </div>

        {/* Document Verification */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Verify Document Integrity
          </div>
          <div
            className="upload-zone"
            onClick={() => fileInputRef.current?.click()}
            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onDragOver={e => e.preventDefault()}
            style={{ padding: '20px', marginBottom: 12 }}
          >
            <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            {file ? (
              <div>
                <CheckCircle2 size={20} color="#10b981" />
                <div style={{ fontSize: 12, color: '#34d399', marginTop: 4 }}>{file.name}</div>
              </div>
            ) : (
              <div>
                <Upload size={20} color="#4f6ef7" />
                <div style={{ fontSize: 12, color: '#7b93fa', marginTop: 4 }}>Drop document here</div>
              </div>
            )}
          </div>
          {hashingFile && <div style={{ fontSize: 12, color: '#7b93fa' }}>Computing hash...</div>}
          {hashResult && (
            <div className={`alert ${hashResult === 'match' ? 'alert-success' : 'alert-error'}`} style={{ padding: '10px 14px' }}>
              {hashResult === 'match'
                ? <><CheckCircle2 size={14} /> <span style={{ fontSize: 12 }}>Hash matches — Document is authentic</span></>
                : <><XCircle size={14} /> <span style={{ fontSize: 12 }}>Hash mismatch — Document may be altered</span></>
              }
            </div>
          )}
        </div>
      </div>

      {/* Revocation Panel */}
      {wallet.isConnected && !cert.isRevoked && (
        <div className="glass-card" style={{ padding: 28, borderColor: 'rgba(239,68,68,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <ShieldAlert size={16} color="#ef4444" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#f87171' }}>Revoke Certificate</span>
          </div>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
            This action is irreversible. Only authorized issuers can revoke a certificate.
            A reason must be provided and will be stored permanently on the blockchain.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              className="form-input"
              placeholder="Reason for revocation (required)"
              value={revokeReason}
              onChange={e => setRevokeReason(e.target.value)}
              disabled={revoking}
              style={{ flex: 1 }}
            />
            <button
              className="btn-danger"
              onClick={handleRevoke}
              disabled={revoking || !revokeReason.trim()}
            >
              {revoking ? <div className="spinner" /> : <ShieldOff size={14} />}
              {revoking ? 'Revoking...' : 'Revoke'}
            </button>
          </div>
          {revokeError && (
            <div className="alert alert-error" style={{ marginTop: 12, padding: '10px 14px' }}>
              <AlertTriangle size={14} />
              <span style={{ fontSize: 12 }}>{revokeError}</span>
            </div>
          )}
          {revokeSuccess && (
            <div className="alert alert-success" style={{ marginTop: 12, padding: '10px 14px' }}>
              <CheckCircle2 size={14} />
              <span style={{ fontSize: 12 }}>Certificate revoked successfully on the blockchain.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
