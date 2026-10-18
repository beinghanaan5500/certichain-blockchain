import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, ShieldCheck, Wallet, Activity, FilePlus, Search,
  RefreshCw, AlertTriangle, CheckCircle2, Clock, Hash,
  ArrowRight, ShieldAlert, ExternalLink, Database, Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getContract,
  formatAddress,
  formatTimestamp,
  formatDate,
  getTargetNetworkName,
  getTargetChainId,
  getExplorerUrl,
  parseContractError
} from '../utils/contract';
import { Certificate } from '../types';

export default function Dashboard() {
  const {
    wallet,
    contract,
    connectWallet,
    switchNetwork,
    refreshContract,
    isDemoMode,
    demoCertificates,
    toggleDemoMode,
    resetDemoData,
  } = useApp();

  const [recentCerts, setRecentCerts] = useState<Certificate[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [revokedCount, setRevokedCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const targetName = getTargetNetworkName();
  const targetChainId = getTargetChainId();

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');

    if (isDemoMode) {
      // Load from local demo data store
      const active = demoCertificates.filter(c => !c.isRevoked).length;
      const revoked = demoCertificates.filter(c => c.isRevoked).length;
      setActiveCount(active);
      setRevokedCount(revoked);
      setRecentCerts(demoCertificates.slice(0, 5));
      setLoading(false);
      return;
    }

    try {
      const c = await getContract();
      if (!c) {
        setErrorMsg(`Unable to query blockchain contract on ${targetName}.`);
        setRecentCerts([]);
        setActiveCount(0);
        setRevokedCount(0);
        return;
      }

      const totalBn = await c.getTotalCertificates();
      const total = Number(totalBn);

      if (total === 0) {
        setRecentCerts([]);
        setActiveCount(0);
        setRevokedCount(0);
        return;
      }

      // Fetch all IDs to compute accurate counts
      const allIds: string[] = await c.getCertificateIds(0n, BigInt(total));
      const loadedCerts: Certificate[] = [];
      let active = 0;
      let revoked = 0;

      for (const id of allIds) {
        try {
          const raw = await c.getCertificate(id);
          const certItem: Certificate = {
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
          loadedCerts.push(certItem);
          if (raw.isRevoked) revoked++;
          else active++;
        } catch {}
      }

      setActiveCount(active);
      setRevokedCount(revoked);
      // Newest 5 for recent activity table
      setRecentCerts(loadedCerts.slice().reverse().slice(0, 5));
    } catch (err: any) {
      console.error('loadDashboardData error:', err);
      setErrorMsg(parseContractError(err));
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, demoCertificates, targetName]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = async () => {
    if (!isDemoMode) {
      await refreshContract();
    }
    await loadDashboardData();
  };

  const totalCount = isDemoMode ? demoCertificates.length : contract.totalCertificates;

  const statCards = [
    {
      label: isDemoMode ? 'Demo Registered' : 'Total Registered',
      value: totalCount,
      icon: Award,
      color: '#3b82f6',
      sub: isDemoMode ? 'Fictional demo records' : 'On-chain certificates',
    },
    {
      label: 'Active & Valid',
      value: activeCount,
      icon: ShieldCheck,
      color: '#10b981',
      sub: isDemoMode ? 'Verified demo credentials' : 'Tamper-proof credentials',
    },
    {
      label: 'Revoked Records',
      value: revokedCount,
      icon: AlertTriangle,
      color: '#f87171',
      sub: isDemoMode ? 'Flagged sample certificates' : 'Flagged by institutions',
    },
    {
      label: 'Ledger Mode',
      value: isDemoMode ? 'DEMO SIM' : (contract.lastBlockNumber ? `#${contract.lastBlockNumber}` : '—'),
      icon: Activity,
      color: '#f59e0b',
      sub: isDemoMode ? 'Presentation Mode' : targetName.replace(/\(.*\)/, ''),
    },
  ];

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1140, margin: '0 auto' }}>
      {/* Header */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title gradient-text">CertiChain Overview</h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: isDemoMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: isDemoMode ? '#60a5fa' : '#34d399',
                border: `1px solid ${isDemoMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              }}
            >
              {isDemoMode ? 'DEMO MODE ACTIVE' : 'LIVE BLOCKCHAIN'}
            </span>
          </div>
          <p className="page-subtitle">
            {isDemoMode
              ? 'Presentation Mode active with 5 realistic sample academic credentials. Fictional demo records for college presentation.'
              : 'Decentralized student credential registry on Ethereum. Live state verified from smart contract.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/register" className="btn-primary" style={{ fontSize: '13px' }}>
            <FilePlus size={14} />
            {isDemoMode ? 'Add Demo Cert' : 'Register Certificate'}
          </Link>
          <button
            className="btn-secondary"
            onClick={handleRefresh}
            disabled={loading}
            style={{ fontSize: '13px' }}
          >
            <RefreshCw size={14} className={loading ? 'spinner' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Demo Mode Presentation Banner with Quick-Test Chips */}
      {isDemoMode ? (
        <div
          className="glass-card"
          style={{
            padding: '20px 24px',
            marginBottom: 24,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                  🎓 College Presentation Demo Mode
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(59, 130, 246, 0.25)',
                    color: '#93c5fd',
                  }}
                >
                  NO LAPTOP LOCAL NODE REQUIRED
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, maxWidth: 760, lineHeight: 1.5 }}>
                Realistic demonstration data with fictional student identities is active. All records survive page refresh and work directly on this deployed website. Click any sample ID below to immediately verify:
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => toggleDemoMode(false)}
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '6px 12px' }}
                title="Switch to live smart contract queries"
              >
                Switch to On-Chain
              </button>
              <button
                onClick={resetDemoData}
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '6px 12px' }}
                title="Reset sample records back to initial 5 demo certificates"
              >
                Reset Demo Data
              </button>
            </div>
          </div>

          {/* Quick-Test Presentation Chips */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Quick Verification Tests:</span>
            <Link
              to="/verify?id=DEMO-CERT-2024-001"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              ✓ DEMO-CERT-2024-001 (Valid: Aarav Sharma)
            </Link>
            <Link
              to="/verify?id=DEMO-CERT-2024-002"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              ✓ DEMO-CERT-2024-002 (Valid: Diya Nair)
            </Link>
            <Link
              to="/verify?id=DEMO-CERT-2023-REVOKED"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              ⚠ DEMO-CERT-2023-REVOKED (Revoked: Rohan Verma)
            </Link>
            <Link
              to="/verify?id=DEMO-CERT-2024-TAMPER-TEST"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              🔍 DEMO-CERT-2024-TAMPER-TEST (Hash Check)
            </Link>
            <Link
              to="/verify?id=DEMO-UNKNOWN-404"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(148, 163, 184, 0.12)',
                color: '#cbd5e1',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              ✕ DEMO-UNKNOWN-404 (Not Found)
            </Link>
          </div>
        </div>
      ) : !contract.isDeployed ? (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: '13px' }}>
            <strong>Smart Contract Not Reached on {targetName}:</strong> No contract bytecode is active on the public chain.
            For your presentation, switch to <strong>Demo Mode</strong> to show realistic certificates without needing a running local node.
          </div>
          <button
            onClick={() => toggleDemoMode(true)}
            className="btn-primary"
            style={{ fontSize: '12px', padding: '6px 14px', flexShrink: 0 }}
          >
            Activate Demo Mode
          </button>
        </div>
      ) : wallet.isConnected && !wallet.isCorrectNetwork ? (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: '13px' }}>
            <strong>Wrong Network Connected:</strong> Your wallet is connected to Chain ID <code>{wallet.chainId ?? 'unknown'}</code>.
            This contract operates on <strong>{targetName}</strong> (Chain ID: <code>{targetChainId}</code>).
          </div>
          <button
            onClick={() => switchNetwork(targetChainId)}
            className="btn-primary"
            style={{ fontSize: '12px', padding: '6px 14px', flexShrink: 0 }}
          >
            Switch Network
          </button>
        </div>
      ) : null}

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 18,
          marginBottom: 28,
        }}
      >
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="glass-card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {card.label}
                </span>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${card.color}15`,
                    color: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>
                  {card.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Navigation Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 18,
          marginBottom: 28,
        }}
      >
        <Link
          to="/register"
          className="glass-card"
          style={{
            padding: 22,
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FilePlus size={18} />
              </div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Issue Certificate</h2>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
              Authorized institutions can register student credentials and anchor SHA-256 document digests on-chain.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#3b82f6', fontWeight: 600, marginTop: 14 }}>
            Open Registration Form <ArrowRight size={13} />
          </div>
        </Link>

        <Link
          to="/verify"
          className="glass-card"
          style={{
            padding: 22,
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={18} />
              </div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Verify Credentials</h2>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
              Employers and verifiers can look up any Certificate ID or upload PDF files for cryptographic integrity proof.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#10b981', fontWeight: 600, marginTop: 14 }}>
            Verify a Certificate <ArrowRight size={13} />
          </div>
        </Link>

        <Link
          to="/records"
          className="glass-card"
          style={{
            padding: 22,
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={18} />
              </div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Audit Ledger</h2>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
              Browse the public certificate registry with searching, filters, and complete CSV export capabilities.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#f59e0b', fontWeight: 600, marginTop: 14 }}>
            Explore All Records <ArrowRight size={13} />
          </div>
        </Link>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
              {isDemoMode ? 'Recent Activity (Demo Presentation Records)' : 'Recent On-Chain Activity'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              {isDemoMode
                ? 'Sample student credentials prepared for college project presentation'
                : 'Latest certificates anchored to the blockchain ledger'}
            </div>
          </div>
          <Link to="/records" style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>
            View Full Ledger ({totalCount}) →
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 10px', width: 22, height: 22 }} />
            <span style={{ fontSize: '12px', color: '#64748b' }}>Querying credential data...</span>
          </div>
        ) : recentCerts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Award size={36} color="#334155" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
              No Certificates Registered Yet
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', maxWidth: 400, margin: '0 auto 16px' }}>
              {isDemoMode
                ? 'No demo certificates found. Click Reset Demo Data to restore the default sample presentation records.'
                : 'The connected smart contract currently contains zero records. Be the first to issue an on-chain academic certificate.'}
            </div>
            {isDemoMode ? (
              <button onClick={resetDemoData} className="btn-primary" style={{ fontSize: '12px' }}>
                Restore Default Demo Records
              </button>
            ) : (
              <Link to="/register" className="btn-primary" style={{ fontSize: '12px' }}>
                Issue First Certificate
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentCerts.map(cert => (
              <Link
                key={cert.certificateId}
                to={`/records/${cert.certificateId}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: cert.isRevoked ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      color: cert.isRevoked ? '#f87171' : '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {cert.isRevoked ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
                      {cert.studentName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {cert.courseName} · {cert.institutionName}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>
                    {cert.certificateId}
                  </span>
                  {isDemoMode && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      DEMO
                    </span>
                  )}
                  <span className={`badge ${cert.isRevoked ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '9px' }}>
                    {cert.isRevoked ? 'Revoked' : 'Valid'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {formatDate(cert.issueDate)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
