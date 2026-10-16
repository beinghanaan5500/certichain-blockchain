import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, ShieldCheck, Wallet, Activity, TrendingUp, FilePlus,
  Search, ExternalLink, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, Hash, Users, Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getContract, formatAddress, formatTimestamp, getTargetNetworkName, getTargetChainId } from '../utils/contract';
import { Certificate } from '../types';

export default function Dashboard() {
  const { wallet, contract, connectWallet, refreshContract } = useApp();
  const [recentCerts, setRecentCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecentCertificates = useCallback(async () => {
    if (!contract.isDeployed) return;
    setLoading(true);
    try {
      const c = await getContract();
      if (!c) return;
      const total = Number(await c.getTotalCertificates());
      if (total === 0) { setRecentCerts([]); return; }
      const offset = Math.max(0, total - 5);
      const ids: string[] = await c.getCertificateIds(BigInt(offset), BigInt(5));
      const certs: Certificate[] = [];
      for (const id of ids.slice().reverse()) {
        try {
          const cert = await c.getCertificate(id);
          certs.push({
            certificateId:   cert.certificateId,
            studentName:     cert.studentName,
            courseName:      cert.courseName,
            institutionName: cert.institutionName,
            grade:           cert.grade,
            issueDate:       cert.issueDate,
            registeredAt:    cert.registeredAt,
            documentHash:    cert.documentHash,
            issuedBy:        cert.issuedBy,
            isRevoked:       cert.isRevoked,
            revokeReason:    cert.revokeReason,
          });
        } catch {}
      }
      setRecentCerts(certs);
    } catch (err) {
      console.error('loadRecentCertificates error:', err);
    } finally {
      setLoading(false);
    }
  }, [contract.isDeployed]);

  useEffect(() => { loadRecentCertificates(); }, [loadRecentCertificates]);

  const handleRefresh = async () => {
    await refreshContract();
    await loadRecentCertificates();
  };

  const stats = [
    {
      label: 'Total Certificates',
      value: contract.totalCertificates,
      icon: Award,
      gradient: 'linear-gradient(135deg, #4f6ef7 0%, #6366f1 100%)',
      glow: 'rgba(79,110,247,0.3)',
    },
    {
      label: 'Active Certs',
      value: recentCerts.filter(c => !c.isRevoked).length,
      icon: ShieldCheck,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      glow: 'rgba(16,185,129,0.3)',
    },
    {
      label: 'Revoked Certs',
      value: recentCerts.filter(c => c.isRevoked).length,
      icon: AlertTriangle,
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      glow: 'rgba(239,68,68,0.3)',
    },
    {
      label: 'Block Number',
      value: contract.lastBlockNumber ?? '—',
      icon: Activity,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      glow: 'rgba(245,158,11,0.3)',
    },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: 1200 }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title gradient-text">Dashboard</h1>
          <p className="page-subtitle">Real-time blockchain certificate overview</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link to="/register" className="btn-primary" style={{ textDecoration: 'none' }}>
            <FilePlus size={14} />
            New Certificate
          </Link>
        </div>
      </div>

      {/* Network Warning */}
      {wallet.isConnected && !wallet.isCorrectNetwork && (
        <div className="alert alert-warning fade-in" style={{ marginBottom: 24 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <div>
            <strong>Wrong Network</strong> — Please switch MetaMask to <strong>{getTargetNetworkName()}</strong> (Chain ID: {getTargetChainId()}).
          </div>
        </div>
      )}

      {/* Not Deployed Warning */}
      {!contract.isDeployed && (
        <div className="alert alert-warning fade-in" style={{ marginBottom: 24 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <div>
            <strong>Contract Not Deployed</strong> — Configure the contract address in environment variables or deploy using <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>npm run deploy</code>.
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {stats.map(({ label, value, icon: Icon, gradient, glow }) => (
          <div key={label} className="glass-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  {label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>
                  {loading ? '—' : value.toLocaleString()}
                </div>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 15px ${glow}`,
                flexShrink: 0,
              }}>
                <Icon size={20} color="white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
        {/* Blockchain Status */}
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={14} />
            Blockchain Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Network</span>
              <span className={`badge ${contract.isDeployed ? 'badge-success' : 'badge-warning'}`}>
                <div className="pulse-dot" style={{ background: contract.isDeployed ? '#10b981' : '#f59e0b' }} />
                {contract.isDeployed ? getTargetNetworkName() : 'Disconnected'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Contract</span>
              <span style={{ fontSize: 12, color: '#4f6ef7', fontFamily: 'monospace' }}>
                {contract.address ? formatAddress(contract.address) : 'Not deployed'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Chain ID</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{getTargetChainId()}</span>
            </div>
          </div>
        </div>

        {/* Wallet Status */}
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wallet size={14} />
            Wallet Status
          </div>
          {wallet.isConnected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Status</span>
                <span className="badge badge-success">
                  <div className="pulse-dot" style={{ background: '#10b981' }} />
                  Connected
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Address</span>
                <span style={{ fontSize: 12, color: '#7b93fa', fontFamily: 'monospace' }}>
                  {formatAddress(wallet.address || '')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Balance</span>
                <span style={{ fontSize: 13, color: '#34d399', fontWeight: 600 }}>
                  {wallet.balance} ETH
                </span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 14 }}>
                Connect your wallet to register certificates.
              </p>
              <button className="btn-primary" onClick={connectWallet} style={{ fontSize: 13 }}>
                <Wallet size={14} />
                Connect MetaMask
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={14} />
            Quick Actions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/register" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              background: 'rgba(79,110,247,0.08)', borderRadius: 10,
              border: '1px solid rgba(79,110,247,0.15)', textDecoration: 'none',
              transition: 'all 0.2s',
            }}>
              <FilePlus size={14} color="#7b93fa" />
              <span style={{ fontSize: 13, color: '#7b93fa', fontWeight: 500 }}>Register Certificate</span>
              <ExternalLink size={11} color="#4f6ef7" style={{ marginLeft: 'auto' }} />
            </Link>
            <Link to="/verify" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              background: 'rgba(16,185,129,0.08)', borderRadius: 10,
              border: '1px solid rgba(16,185,129,0.15)', textDecoration: 'none',
              transition: 'all 0.2s',
            }}>
              <Search size={14} color="#34d399" />
              <span style={{ fontSize: 13, color: '#34d399', fontWeight: 500 }}>Verify Certificate</span>
              <ExternalLink size={11} color="#10b981" style={{ marginLeft: 'auto' }} />
            </Link>
            <Link to="/records" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              background: 'rgba(245,158,11,0.08)', borderRadius: 10,
              border: '1px solid rgba(245,158,11,0.15)', textDecoration: 'none',
              transition: 'all 0.2s',
            }}>
              <Award size={14} color="#fbbf24" />
              <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 500 }}>View All Records</span>
              <ExternalLink size={11} color="#f59e0b" style={{ marginLeft: 'auto' }} />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Certificates */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={15} />
            Recent Certificates
          </div>
          <Link to="/records" style={{ fontSize: 12, color: '#4f6ef7', textDecoration: 'none', fontWeight: 500 }}>
            View All →
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 13, color: '#475569' }}>Loading from blockchain...</div>
          </div>
        ) : recentCerts.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Award size={40} color="#1e3a70" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 15, color: '#475569', fontWeight: 500 }}>No certificates registered yet</div>
            <p style={{ fontSize: 13, color: '#334155', marginTop: 6 }}>
              Start by registering a certificate on the blockchain.
            </p>
            <Link to="/register" className="btn-primary" style={{ marginTop: 16, textDecoration: 'none', display: 'inline-flex' }}>
              <FilePlus size={14} />
              Register First Certificate
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>Student Name</th>
                  <th>Course</th>
                  <th>Grade</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentCerts.map((cert) => (
                  <tr key={cert.certificateId}>
                    <td>
                      <span className="hash-text">{cert.certificateId}</span>
                    </td>
                    <td style={{ fontWeight: 500, color: '#e2e8f0' }}>{cert.studentName}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cert.courseName}
                    </td>
                    <td>
                      <span className="badge badge-info">{cert.grade}</span>
                    </td>
                    <td style={{ fontSize: 12, color: '#475569' }}>
                      {formatTimestamp(cert.registeredAt)}
                    </td>
                    <td>
                      <span className={`badge ${cert.isRevoked ? 'badge-danger' : 'badge-success'}`}>
                        {cert.isRevoked ? '✕ Revoked' : '✓ Valid'}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/records/${cert.certificateId}`}
                        style={{ color: '#4f6ef7', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
