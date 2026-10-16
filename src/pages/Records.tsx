import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Search, RefreshCw, ChevronRight, Award,
  AlertTriangle, Filter, Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getContract, formatTimestamp, formatAddress } from '../utils/contract';
import { Certificate } from '../types';

export default function Records() {
  const { contract, refreshContract } = useApp();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading]   = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRevoked, setFilterRevoked] = useState<'all' | 'valid' | 'revoked'>('all');
  const [page, setPage]         = useState(0);
  const PAGE_SIZE = 20;

  const loadAll = useCallback(async () => {
    if (!contract.isDeployed) { setCertificates([]); return; }
    setLoading(true);
    try {
      const c = await getContract();
      if (!c) return;
      const total = Number(await c.getTotalCertificates());
      if (total === 0) { setCertificates([]); return; }
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
      setCertificates(certs.reverse()); // newest first
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [contract.isDeployed]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filtered = certificates.filter(cert => {
    const q = searchTerm.toLowerCase();
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
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div style={{ padding: '32px', maxWidth: 1200 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title gradient-text">Certificate Records</h1>
          <p className="page-subtitle">
            {contract.totalCertificates} total certificates on blockchain
          </p>
        </div>
        <button className="btn-secondary" onClick={async () => { await refreshContract(); await loadAll(); }} disabled={loading}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {!contract.isDeployed && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <div>Contract not deployed. Run the Hardhat node and deploy first.</div>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input
            className="form-input"
            placeholder="Search by name, ID, course..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
            style={{ paddingLeft: 38 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'valid', 'revoked'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilterRevoked(f); setPage(0); }}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: '1px solid',
                background: filterRevoked === f ? 'rgba(79,110,247,0.15)' : 'rgba(255,255,255,0.03)',
                color:      filterRevoked === f ? '#7b93fa' : '#64748b',
                borderColor: filterRevoked === f ? 'rgba(79,110,247,0.3)' : 'rgba(255,255,255,0.07)',
                textTransform: 'capitalize',
              }}
            >
              {f === 'all' ? `All (${certificates.length})` : f === 'valid' ? `Valid (${certificates.filter(c=>!c.isRevoked).length})` : `Revoked (${certificates.filter(c=>c.isRevoked).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 14px' }} />
            <div style={{ fontSize: 13, color: '#475569' }}>Loading all records from blockchain...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Award size={44} color="#1e3a70" style={{ marginBottom: 14 }} />
            <div style={{ fontSize: 15, color: '#475569' }}>
              {certificates.length === 0 ? 'No certificates registered yet' : 'No records match your search'}
            </div>
            {certificates.length === 0 && (
              <Link to="/register" className="btn-primary" style={{ marginTop: 16, textDecoration: 'none', display: 'inline-flex' }}>
                Register First Certificate
              </Link>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Certificate ID</th>
                    <th>Student Name</th>
                    <th>Course</th>
                    <th>Grade</th>
                    <th>Institution</th>
                    <th>Registered</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((cert, i) => (
                    <tr key={cert.certificateId}>
                      <td style={{ color: '#475569', fontSize: 12 }}>{page * PAGE_SIZE + i + 1}</td>
                      <td><span className="hash-text">{cert.certificateId}</span></td>
                      <td style={{ fontWeight: 500, color: '#e2e8f0' }}>{cert.studentName}</td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cert.courseName}
                      </td>
                      <td><span className="badge badge-info">{cert.grade}</span></td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#64748b' }}>
                        {cert.institutionName}
                      </td>
                      <td style={{ fontSize: 12, color: '#475569' }}>{formatTimestamp(cert.registeredAt)}</td>
                      <td>
                        <span className={`badge ${cert.isRevoked ? 'badge-danger' : 'badge-success'}`}>
                          {cert.isRevoked ? '✕ Revoked' : '✓ Valid'}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/records/${cert.certificateId}`}
                          style={{ color: '#4f6ef7', fontSize: 12, textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          View <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 12, color: '#475569' }}>
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <button className="btn-secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 12px', fontSize: 12 }}>
                  ← Prev
                </button>
                <button className="btn-secondary" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px', fontSize: 12 }}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
