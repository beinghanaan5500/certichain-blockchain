import React, { useState, useRef, useCallback } from 'react';
import {
  FilePlus, Upload, Hash, Calendar, User, BookOpen, Building2,
  Star, AlertTriangle, CheckCircle2, Loader2, Info, X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getContract, hashFile, getTargetNetworkName, getTargetChainId } from '../utils/contract';
import { TxState } from '../types';
import { ethers } from 'ethers';

interface FormData {
  certificateId:  string;
  studentName:    string;
  courseName:     string;
  institutionName:string;
  grade:          string;
  issueDate:      string;
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

export default function RegisterCertificate() {
  const { wallet, contract, connectWallet, refreshContract } = useApp();
  const [form, setForm]     = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [file, setFile]     = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const [hashingFile, setHashingFile] = useState(false);
  const [tx, setTx]         = useState<TxState>({ isLoading: false, hash: null, error: null, success: false });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.certificateId.trim()) e.certificateId = 'Certificate ID is required';
    if (!form.studentName.trim())   e.studentName   = 'Student name is required';
    if (!form.courseName.trim())    e.courseName    = 'Course name is required';
    if (!form.institutionName.trim()) e.institutionName = 'Institution is required';
    if (!form.grade.trim())         e.grade         = 'Grade is required';
    if (!form.issueDate)            e.issueDate     = 'Issue date is required';
    if (!file) {
      // Use a separate error store or just alert
      setTx(prev => ({ ...prev, error: 'Please upload the certificate document (PDF/image) to generate its hash.' }));
      setErrors(e);
      return Object.keys(e).length === 0 && !!file;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setHashingFile(true);
    try {
      const hash = await hashFile(selectedFile);
      setFileHash(hash);
    } catch {
      setFileHash('');
    } finally {
      setHashingFile(false);
    }
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [handleFile]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!wallet.isConnected) { connectWallet(); return; }
    if (!wallet.isCorrectNetwork) {
      setTx({
        isLoading: false,
        hash: null,
        error: `Wrong network. Switch MetaMask to ${getTargetNetworkName()} (Chain ID: ${getTargetChainId()}).`,
        success: false,
      });
      return;
    }

    setTx({ isLoading: true, hash: null, error: null, success: false });

    try {
      const c = await getContract(true);
      if (!c) throw new Error('Contract not available. Deploy the contract first.');

      const issueDateUnix = Math.floor(new Date(form.issueDate).getTime() / 1000);
      const docHashBytes32 = fileHash as `0x${string}`;

      const tx = await c.registerCertificate(
        form.certificateId.trim(),
        form.studentName.trim(),
        form.courseName.trim(),
        form.institutionName.trim(),
        form.grade.trim(),
        issueDateUnix,
        docHashBytes32
      );

      setTx({ isLoading: true, hash: tx.hash, error: null, success: false });
      await tx.wait();
      await refreshContract();

      setTx({ isLoading: false, hash: tx.hash, error: null, success: true });
      // Reset form
      setForm(INITIAL_FORM);
      setFile(null);
      setFileHash('');
    } catch (err: any) {
      const msg = err?.reason || err?.message || 'Transaction failed';
      setTx({ isLoading: false, hash: null, error: msg, success: false });
    }
  };

  const Field = ({ name, label, icon: Icon, type = 'text', placeholder, ...rest }: any) => (
    <div>
      <label className="form-label" htmlFor={name}>
        <Icon size={10} style={{ display: 'inline', marginRight: 4 }} />
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className="form-input"
        placeholder={placeholder}
        value={form[name as keyof FormData]}
        onChange={e => { setForm(p => ({ ...p, [name]: e.target.value })); setErrors(p => ({ ...p, [name]: '' })); }}
        disabled={tx.isLoading}
        {...rest}
      />
      {errors[name as keyof FormData] && (
        <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>{errors[name as keyof FormData]}</div>
      )}
    </div>
  );

  return (
    <div style={{ padding: '32px', maxWidth: 900 }}>
      <div className="page-header">
        <h1 className="page-title gradient-text">Register Certificate</h1>
        <p className="page-subtitle">Issue a new academic certificate on the Ethereum blockchain</p>
      </div>

      {/* Wallet Warning */}
      {!wallet.isConnected && (
        <div className="alert alert-info" style={{ marginBottom: 24 }}>
          <Info size={16} style={{ flexShrink: 0 }} />
          <div>
            <strong>Wallet Required</strong> — Connect MetaMask to register certificates. Only authorized issuers can submit this transaction.
            <button className="btn-primary" onClick={connectWallet} style={{ marginLeft: 12, padding: '6px 14px', fontSize: 12 }}>
              Connect Wallet
            </button>
          </div>
        </div>
      )}

      {/* Not Deployed Warning */}
      {!contract.isDeployed && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <div>
            <strong>Contract Not Deployed</strong> — Start the Hardhat node and run <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: 4 }}>npm run deploy</code>.
          </div>
        </div>
      )}

      <form onSubmit={handleRegister}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Certificate Information
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="form-label">
                    <Hash size={10} style={{ display: 'inline', marginRight: 4 }} />
                    Certificate ID
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      id="certificateId"
                      className="form-input"
                      placeholder="CERT-2024-0001"
                      value={form.certificateId}
                      onChange={e => { setForm(p => ({ ...p, certificateId: e.target.value })); setErrors(p => ({ ...p, certificateId: '' })); }}
                      disabled={tx.isLoading}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setForm(p => ({ ...p, certificateId: generateId() }))}
                      style={{ flexShrink: 0, fontSize: 12 }}
                    >
                      Generate
                    </button>
                  </div>
                  {errors.certificateId && <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>{errors.certificateId}</div>}
                </div>

                <Field name="studentName"  label="Student Full Name" icon={User}     placeholder="e.g. Rahul Sharma" />
                <Field name="courseName"   label="Course / Degree"   icon={BookOpen} placeholder="e.g. B.Tech CSE (AI/ML)" />
                <Field name="institutionName" label="Institution"     icon={Building2} placeholder="e.g. NIT Delhi" />
                <Field name="grade"        label="Grade / CGPA"      icon={Star}     placeholder="e.g. 9.2 CGPA / First Class" />
                <Field name="issueDate"    label="Issue Date"         icon={Calendar} type="date" />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Document Upload */}
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Document Hash (Required)
              </div>
              <div
                className={`upload-zone ${dragOver ? 'dragover' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                />
                {file ? (
                  <div>
                    <CheckCircle2 size={28} color="#10b981" style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#34d399' }}>{file.name}</div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload size={28} color="#4f6ef7" style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#7b93fa' }}>
                      Click or drag certificate document here
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                      PDF, JPG, PNG, DOC — Max 10MB
                    </div>
                  </div>
                )}
              </div>

              {hashingFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: '#7b93fa', fontSize: 13 }}>
                  <div className="spinner" />
                  Computing SHA-256 hash...
                </div>
              )}

              {fileHash && !hashingFile && (
                <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(16,185,129,0.06)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    SHA-256 Document Hash
                  </div>
                  <div className="hash-text" style={{ wordBreak: 'break-all', fontSize: 11 }}>
                    {fileHash}
                  </div>
                </div>
              )}

              {file && (
                <button
                  type="button"
                  onClick={() => { setFile(null); setFileHash(''); }}
                  style={{ marginTop: 8, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <X size={12} /> Remove file
                </button>
              )}
            </div>

            {/* On-Chain Info */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                What gets stored on-chain
              </div>
              {[
                'Certificate ID (unique identifier)',
                'Student name, course, institution, grade',
                'Issue date (Unix timestamp)',
                'SHA-256 hash of your document',
                'Your wallet address (issuer)',
                'Block timestamp of registration',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <CheckCircle2 size={12} color="#10b981" />
                  <span style={{ fontSize: 12, color: '#64748b' }}>{item}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, fontSize: 11, color: '#334155', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                ⚠ No personal data beyond student name is stored on-chain. The actual document stays with you.
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Status */}
        {tx.error && (
          <div className="alert alert-error fade-in" style={{ marginTop: 20 }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <div><strong>Error:</strong> {tx.error}</div>
          </div>
        )}

        {tx.success && (
          <div className="alert alert-success fade-in" style={{ marginTop: 20 }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <div>
              <strong>Certificate Registered Successfully!</strong>
              {tx.hash && (
                <div style={{ marginTop: 4, fontSize: 12 }}>
                  Transaction: <span className="hash-text">{tx.hash}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {tx.isLoading && tx.hash && (
          <div className="alert alert-info fade-in" style={{ marginTop: 20 }}>
            <div className="spinner" style={{ flexShrink: 0 }} />
            <div>
              <strong>Awaiting confirmation...</strong>
              <div style={{ marginTop: 4, fontSize: 12 }}>
                Transaction hash: <span className="hash-text">{tx.hash}</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={tx.isLoading || !fileHash}
            style={{ padding: '14px 32px', fontSize: 15 }}
          >
            {tx.isLoading
              ? <><div className="spinner" /> Processing Transaction...</>
              : <><FilePlus size={16} /> Register on Blockchain</>
            }
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setForm(INITIAL_FORM); setFile(null); setFileHash(''); setErrors({}); setTx({ isLoading: false, hash: null, error: null, success: false }); }}
            disabled={tx.isLoading}
          >
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
}
