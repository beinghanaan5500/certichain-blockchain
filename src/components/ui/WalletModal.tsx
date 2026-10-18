import React, { useState } from 'react';
import {
  X, Wallet, ExternalLink, RefreshCw, AlertTriangle, CheckCircle2,
  Copy, Check, ShieldCheck, ArrowRight, Smartphone, Laptop
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getTargetNetworkName,
  getTargetChainId,
  formatAddress,
  getExplorerUrl,
  hasInjectedWallet,
} from '../../utils/contract';

export default function WalletModal() {
  const {
    wallet,
    walletError,
    isWalletModalOpen,
    closeWalletModal,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isLoading,
  } = useApp();

  const [copied, setCopied] = useState(false);

  if (!isWalletModalOpen) return null;

  const targetName = getTargetNetworkName();
  const targetChainId = getTargetChainId();
  const hasWallet = hasInjectedWallet();

  const handleCopy = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isNoWalletError = walletError?.action === 'install_metamask' || !hasWallet;
  const isWrongNetwork = wallet.isConnected && !wallet.isCorrectNetwork;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={closeWalletModal}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(180deg, #0e1726 0%, #080f1d 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '18px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(79, 110, 247, 0.15)',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(79, 110, 247, 0.15)',
                border: '1px solid rgba(79, 110, 247, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7b93fa',
              }}
            >
              <Wallet size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                {wallet.isConnected ? 'Connected Web3 Wallet' : 'Web3 Wallet Assistant'}
              </h2>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Ethereum Blockchain Integration
              </span>
            </div>
          </div>
          <button
            onClick={closeWalletModal}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '22px' }}>
          {/* Error / Alert banner if active */}
          {walletError && (
            <div
              style={{
                padding: '14px',
                borderRadius: '12px',
                marginBottom: '18px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#fca5a5',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 600, color: '#f87171', marginBottom: '4px' }}>
                {walletError.title}
              </div>
              <div>{walletError.message}</div>
            </div>
          )}

          {/* CASE 1: No Wallet Installed */}
          {isNoWalletError && !wallet.isConnected && (
            <div>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '16px' }}>
                CertiChain uses Ethereum smart contracts to guarantee tamper-proof academic credentials.
                To register certificates or sign administrative transactions, an injected Web3 wallet like MetaMask is required.
              </p>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <Laptop size={16} color="#7b93fa" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    <strong>Desktop Browser:</strong> Install the MetaMask extension for Chrome, Edge, Firefox, or Brave.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Smartphone size={16} color="#2dd4bf" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    <strong>Mobile Device:</strong> Open this website URL inside the built-in browser of the MetaMask Mobile app.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
                >
                  Install MetaMask
                  <ExternalLink size={14} />
                </a>
                <button
                  className="btn-secondary"
                  onClick={() => connectWallet()}
                  disabled={isLoading}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {/* CASE 2: Wallet Installed but Not Connected */}
          {!isNoWalletError && !wallet.isConnected && (
            <div>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '18px' }}>
                Connect your Web3 wallet to issue certificates or verify smart contract permissions on <strong>{targetName}</strong>.
              </p>
              <button
                className="btn-primary"
                onClick={connectWallet}
                disabled={isLoading}
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                <Wallet size={16} />
                {isLoading ? 'Connecting...' : 'Connect MetaMask Wallet'}
              </button>
            </div>
          )}

          {/* CASE 3: Connected to Wrong Network */}
          {wallet.isConnected && isWrongNetwork && (
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
                  <AlertTriangle size={16} />
                  Wrong Network Detected
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                  You are connected to Chain ID <code>{wallet.chainId ?? 'unknown'}</code>.
                  This application requires <strong>{targetName}</strong> (Chain ID: <code>{targetChainId}</code>).
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={() => switchNetwork(targetChainId)}
                disabled={isLoading}
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                <RefreshCw size={15} className={isLoading ? 'spinner' : ''} />
                Switch to {targetName}
              </button>
            </div>
          )}

          {/* CASE 4: Connected on Correct Network */}
          {wallet.isConnected && (
            <div>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    Connected Account
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={handleCopy}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: 'none',
                        color: copied ? '#34d399' : '#94a3b8',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    {wallet.address && getExplorerUrl(wallet.address, 'address') && (
                      <a
                        href={getExplorerUrl(wallet.address, 'address')!}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: '#94a3b8',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={12} />
                        Explorer
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#f8fafc', marginBottom: '14px', wordBreak: 'break-all' }}>
                  {wallet.address}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Balance</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                      {wallet.balance} ETH
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Network</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: wallet.isCorrectNetwork ? '#34d399' : '#fbbf24' }}>
                      {wallet.isCorrectNetwork ? targetName : `Chain ID ${wallet.chainId}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Authorization role badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: wallet.isAuthorizedIssuer
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(79, 110, 247, 0.08)',
                  border: `1px solid ${
                    wallet.isAuthorizedIssuer
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(79, 110, 247, 0.2)'
                  }`,
                  marginBottom: '16px',
                }}
              >
                {wallet.isAuthorizedIssuer ? (
                  <ShieldCheck size={18} color="#10b981" />
                ) : (
                  <CheckCircle2 size={18} color="#7b93fa" />
                )}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: wallet.isAuthorizedIssuer ? '#34d399' : '#7b93fa' }}>
                    {wallet.isOwner
                      ? 'Contract Owner & Authorized Issuer'
                      : wallet.isAuthorizedIssuer
                      ? 'Authorized Academic Issuer'
                      : 'Guest Verifier Account'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {wallet.isAuthorizedIssuer
                      ? 'You have permission to register and revoke certificates.'
                      : 'You can verify documents and browse records. Issuer privileges require authorization.'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn-secondary"
                  onClick={disconnectWallet}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Disconnect
                </button>
                <button
                  className="btn-primary"
                  onClick={closeWalletModal}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
