import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, Search, FileText, Info, Menu, X,
  ChevronRight, Wallet, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatAddress, getTargetNetworkName } from '../../utils/contract';

const NAV_ITEMS = [
  { path: '/',            label: 'Dashboard',    icon: LayoutDashboard },
  { path: '/register',   label: 'Register Cert',icon: FilePlus        },
  { path: '/verify',     label: 'Verify Cert',  icon: Search          },
  { path: '/records',    label: 'All Records',  icon: FileText        },
  { path: '/about',      label: 'About Project',icon: Info            },
];

export default function Sidebar() {
  const { wallet, contract, connectWallet, disconnectWallet } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #4f6ef7, #2dd4bf)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: 'white',
          }}>⛓</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>CertiChain</div>
            <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Certificate Verification
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '12px 12px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, color: '#334155', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 8px 4px' }}>
          Main Menu
        </div>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }: { isActive: boolean }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <Icon size={16} />
            <span style={{ flex: 1 }}>{label}</span>
            <ChevronRight size={12} style={{ opacity: 0.3 }} />
          </NavLink>
        ))}
      </nav>

      {/* Wallet Status */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Contract Status */}
        <div style={{
          padding: '10px 12px', borderRadius: 10, marginBottom: 10,
          background: contract.isDeployed
            ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
          border: `1px solid ${contract.isDeployed ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {contract.isDeployed
              ? <CheckCircle2 size={12} color="#10b981" />
              : <AlertTriangle size={12} color="#f59e0b" />}
            <span style={{ fontSize: 11, fontWeight: 600, color: contract.isDeployed ? '#34d399' : '#fbbf24' }}>
              {contract.isDeployed ? 'Contract Live' : 'Not Deployed'}
            </span>
          </div>
          {contract.isDeployed && (
            <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>
              {formatAddress(contract.address || '')} · {contract.totalCertificates} certs
            </div>
          )}
        </div>

        {/* Wallet */}
        {wallet.isConnected ? (
          <div style={{
            padding: '10px 12px', borderRadius: 10,
            background: 'rgba(79,110,247,0.08)',
            border: '1px solid rgba(79,110,247,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div className="pulse-dot" style={{ background: '#4f6ef7' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#7b93fa' }}>Wallet Connected</span>
            </div>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>
              {formatAddress(wallet.address || '')}
            </div>
            {!wallet.isCorrectNetwork && (
              <div style={{ fontSize: 10, color: '#f87171', marginBottom: 6 }}>
                ⚠ Wrong network — switch to {getTargetNetworkName()}
              </div>
            )}
            <button
              onClick={disconnectWallet}
              style={{
                fontSize: 11, color: '#64748b', background: 'transparent',
                border: 'none', cursor: 'pointer', padding: '2px 0',
              }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            className="btn-primary"
            onClick={connectWallet}
            style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
          >
            <Wallet size={14} />
            Connect MetaMask
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <SidebarContent />
      </div>

      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        style={{
          display: 'none', position: 'fixed', top: 16, left: 16, zIndex: 50,
          background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: 8, color: '#94a3b8', cursor: 'pointer',
        }}
        className="mobile-menu-btn"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 99, backdropFilter: 'blur(4px)',
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className="sidebar"
        style={{
          display: mobileOpen ? 'flex' : 'none',
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
          flexDirection: 'column',
          boxShadow: '8px 0 32px rgba(0,0,0,0.5)',
        }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>
        <SidebarContent />
      </div>
    </>
  );
}
