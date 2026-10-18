import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Search, RefreshCw, ChevronRight, Award,
  AlertTriangle, Filter, Download, ShieldCheck, ShieldAlert,
  ArrowUpDown, ExternalLink, Calendar, BookOpen, Building2, User
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getContract,
  formatTimestamp,
  formatDate,
  formatAddress,
  formatHash,
  getTargetNetworkName,
  parseContractError
} from '../utils/contract';
import { Certificate } from '../types';

export default function Records() {
  const { contract, refreshContract } = useApp();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRevoked, setFilterRevoked] = useState<'all' | 'valid' | 'revoked'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12;

  const targetName = getTargetNetworkName();

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const c = await getContract();
      if (!c) {
        setErrorMsg(`Unable to connect to blockchain RPC on ${targetName}.`);
        setCertificates([]);
        return;
      }
      const total = Number(await c.getTotalCertificates());
      if (total === 0) {
        setCertificates([]);
        return;
      }

      const ids: string[] = await c.getCertificateIds(0n, BigInt(total));
      const certs: Certificate[] = [];

      for (const id of ids) {
        try {
          const raw = await c.getCertificate(id);
          certs.push({
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
        } catch {}
      }

      setCertificates(certs);
    } catch (err: any) {
      console.error('Failed to load certificates:', err);
      setErrorMsg(parseContractError(err));
    } finally {
      setLoading(false);
    }
  }, [targetName]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Filtering & Sorting
  const filtered = certificates
    .filter(cert => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        cert.certificateId.toLowerCase().includes(q) ||
        cert.studentName.toLowerCase().includes(q) ||
        cert.courseName.toLowerCase().includes(q) ||
        cert.institutionName.toLowerCase().includes(q);
      const matchFilter =
        filterRevoked === 'all' ||
        (filterRevoked === 'valid' && !cert.isRevoked) ||
        (filterRevoked === 'revoked' && cert.isRevoked);
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return Number(b.registeredAt - a.registeredAt);
      if (sortBy === 'oldest') return Number(a.registeredAt - b.registeredAt);
      if (sortBy === 'name') return a.studentName.localeCompare(b.studentName);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = [
      'Certificate ID',
      'Student Name',
      'Course',
      'Institution',
      'Grade',
      'Issue Date',
      'Registered At',
      'Issuer Address',
      'Status',
      'Revocation Reason',
      'Document Hash',
    ];
    const rows = filtered.map(c => [
      `"${c.certificateId}"`,
      `"${c.studentName.replace(/"/g, '""')}"`,
      `"${c.courseName.replace(/"/g, '""')}"`,
      `"${c.institutionName.replace(/"/g, '""')}"`,
      `"${c.grade}"`,
      `"${formatDate(c.issueDate)}"`,
      `"${formatTimestamp(c.registeredAt)}"`,
      `"${c.issuedBy}"`,
      `"${c.isRevoked ? 'Revoked' : 'Valid'}"`,
      `"${(c.revokeReason || '').replace(/"/g, '""')}"`,
      `"${c.documentHash}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CertiChain_Records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1140, margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title gradient-text">Certificate Ledger</h1>
          <p className="page-subtitle">
            Cryptographically signed academic credentials registered on {targetName}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            style={{ fontSize: '12px' }}
          >
            <Download size={14} />
            Export CSV ({filtered.length})
          </button>
          <button
            className="btn-secondary"
            onClick={async () => {
              await refreshContract();
              await loadAll();
            }}
            disabled={loading}
            style={{ fontSize: '12px' }}
          >
            <RefreshCw size={14} className={loading ? 'spinner' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by ID, student, degree, or institution..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            style={{ paddingLeft: 36, fontSize: '13px' }}
          />
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'valid', 'revoked'] as const).map(f => (
            <button
              key={f}
              onClick={() => {
                setFilterRevoked(f);
                setPage(0);
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: filterRevoked === f ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                color: filterRevoked === f ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
                textTransform: 'capitalize',
              }}
            >
              {f === 'all' ? 'All' : f === 'valid' ? 'Valid' : 'Revoked'}
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#e2e8f0',
            padding: '7px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="newest" style={{ background: '#0a1628' }}>Newest Registered</option>
          <option value="oldest" style={{ background: '#0a1628' }}>Oldest Registered</option>
          <option value="name" style={{ background: '#0a1628' }}>Student Name (A-Z)</option>
        </select>
      </div>

      {/* Main Records List / Table */}
      {loading ? (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 14px', width: 24, height: 24 }} />
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>Loading certificates from {targetName}...</div>
        </div>
      ) : paginated.length === 0 ? (
        <div className="glass-card" style={{ padding: 50, textAlign: 'center' }}>
          <FileText size={40} color="#475569" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9', marginBottom: 6 }}>
            {certificates.length === 0 ? 'No Certificates on Ledger' : 'No Matching Certificates'}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: 440, margin: '0 auto 18px', lineHeight: 1.5 }}>
            {certificates.length === 0
              ? `There are currently 0 certificates registered on ${targetName}. Register your first certificate to get started.`
              : 'Try clearing search terms or selecting a different status filter.'}
          </p>
          {certificates.length === 0 && (
            <Link to="/register" className="btn-primary" style={{ fontSize: '12px' }}>
              Register Certificate
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {paginated.map(c => (
            <Link
              key={c.certificateId}
              to={`/records/${c.certificateId}`}
              className="glass-card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: c.isRevoked ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    color: c.isRevoked ? '#f87171' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {c.isRevoked ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                      {c.studentName}
                    </span>
                    <span className={`badge ${c.isRevoked ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '10px' }}>
                      {c.isRevoked ? 'Revoked' : 'Valid'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 2 }}>
                    {c.courseName} · <span style={{ color: '#64748b' }}>{c.institutionName}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ textAlign: 'right', display: 'none', md: 'block' } as any}>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>
                    {c.certificateId}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {formatDate(c.issueDate)}
                  </div>
                </div>

                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#e2e8f0',
                  }}
                >
                  {c.grade}
                </div>

                <ChevronRight size={16} color="#64748b" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 24 }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Previous
          </button>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
