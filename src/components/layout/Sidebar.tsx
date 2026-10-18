import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, Search, FileText, Info, Menu, X,
  ChevronRight, Wallet, AlertTriangle, CheckCircle2, ShieldCheck,
  RefreshCw, Copy, Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatAddress, getTargetNetworkName, getTargetChainId } from '../../utils/contract';

const NAV_ITEMS = [
  { path: '/',           label: 'Dashboard',     icon: LayoutDashboard, badge: null },
  { path: '/register',  label: 'Register Cert', icon: FilePlus,        badge: 'Issuer' },
  { path: '/verify',    label: 'Verify Cert',   icon: Search,          badge: 'Public' },
  { path: '/records',   label: 'All Records',   icon: FileText,        badge: null },
  { path: '/about',     label: 'About Project', icon: Info,            badge: null },
];

export default function Sidebar() {
  const {
    wallet,
    contract,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    openWalletModal,
    isLoading,
    isDemoMode,
    demoCertificates,
    toggleDemoMode,
    resetDemoData,
  } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const targetName = getTargetNetworkName();
  const targetChainId = getTargetChainId();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand Header */}
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
              color: '#ffffff',
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <div
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: '#f8fafc',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              CertiChain
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  letterSpacing: '0.04em',
                }}
              >
                v1.0
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
              Certificate Verification DApp
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
        <div
          style={{
            fontSize: '10px',
            color: '#475569',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '4px 10px 10px',
          }}
        >
          Navigation
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.map(({ path, label, icon: Icon, badge }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    padding: '2px 5px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#94a3b8',
                  }}
                >
                  {badge}
                </span>
              )}
              <ChevronRight size={13} style={{ opacity: 0.35 }} />
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Network & Wallet Section */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Demo Mode Toggle Card */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '10px',
            background: isDemoMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${isDemoMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: isDemoMode ? '#3b82f6' : '#64748b',
                  boxShadow: isDemoMode ? '0 0 8px rgba(59, 130, 246, 0.6)' : 'none',
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: 700, color: isDemoMode ? '#60a5fa' : '#94a3b8', letterSpacing: '0.02em' }}>
                DEMO MODE
              </span>
            </div>
            <button
              onClick={() => toggleDemoMode()}
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: isDemoMode ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                color: isDemoMode ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              {isDemoMode ? 'ACTIVE' : 'OFF'}
            </button>
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.4 }}>
            {isDemoMode
              ? `Presentation Mode: ${demoCertificates.length} sample certificates active (no local node needed)`
              : 'Live Mode: Querying smart contract directly'}
          </div>
          {isDemoMode && (
            <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetDemoData();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '9px',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
                title="Reset sample records back to initial state"
              >
                Reset Demo Data
              </button>
            </div>
          )}
        </div>

        {/* Network / Contract Status Card */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Network Target
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: contract.isDeployed ? '#10b981' : '#f59e0b',
                  boxShadow: contract.isDeployed ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none',
                }}
              />
              <span style={{ fontSize: '11px', color: contract.isDeployed ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
                {targetName.replace(/\(.*\)/, '')}
              </span>
            </div>
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
            <span>Contract: {formatAddress(contract.address || '')}</span>
            <span>{isDemoMode ? `${demoCertificates.length} (demo)` : `${contract.totalCertificates} certs`}</span>
          </div>
        </div>

        {/* Wallet Connection Card */}
        {wallet.isConnected ? (
          <div
            onClick={openWalletModal}
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: wallet.isCorrectNetwork
                ? 'rgba(59, 130, 246, 0.07)'
                : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${
                wallet.isCorrectNetwork
                  ? 'rgba(59, 130, 246, 0.22)'
                  : 'rgba(245, 158, 11, 0.3)'
              }`,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: wallet.isCorrectNetwork ? '#3b82f6' : '#f59e0b',
                  }}
                />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#f1f5f9' }}>
                  {wallet.isOwner
                    ? 'Owner'
                    : wallet.isAuthorizedIssuer
                    ? 'Academic Issuer'
                    : 'Connected'}
                </span>
              </div>
              <button
                onClick={handleCopy}
                title="Copy Address"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: copied ? '#34d399' : '#64748b',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '10px',
                }}
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {formatAddress(wallet.address || '')}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8' }}>
              <span>{wallet.balance} ETH</span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Manage ↗</span>
            </div>

            {/* Wrong Network Notice & Switch Button */}
            {!wallet.isCorrectNetwork && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(245, 158, 11, 0.15)' }}>
                <div style={{ fontSize: '10px', color: '#fbbf24', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={11} />
                  Wrong Network ({wallet.chainId ?? '?'})
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    switchNetwork(targetChainId);
                  }}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    background: '#f59e0b',
                    color: '#000000',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <RefreshCw size={11} className={isLoading ? 'spinner' : ''} />
                  Switch to {targetName.replace(/\(.*\)/, '')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="btn-primary"
            onClick={connectWallet}
            disabled={isLoading}
            style={{
              width: '100%',
              justifyContent: 'center',
              fontSize: '13px',
              padding: '11px',
            }}
          >
            <Wallet size={15} />
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar" aria-label="Main Navigation">
        {renderContent()}
      </aside>

      {/* Mobile Top Navigation Bar */}
      <div
        className="mobile-header"
        style={{
          display: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'rgba(5, 13, 26, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 90,
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open Navigation Menu"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '7px',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <ShieldCheck size={16} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>CertiChain</span>
          </div>
        </div>

        <div>
          {wallet.isConnected ? (
            <button
              onClick={openWalletModal}
              style={{
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#60a5fa',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {formatAddress(wallet.address || '')}
            </button>
          ) : (
            <button
              onClick={connectWallet}
              style={{
                background: '#3b82f6',
                border: 'none',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            zIndex: 99,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className="sidebar"
        style={{
          display: mobileOpen ? 'flex' : 'none',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          boxShadow: '10px 0 36px rgba(0, 0, 0, 0.6)',
        }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close Navigation Menu"
          style={{
            position: 'absolute',
            top: '20px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            zIndex: 10,
          }}
        >
          <X size={18} />
        </button>
        {renderContent()}
      </aside>
    </>
  );
}
