import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { WalletState, ContractState, WalletError } from '../types';
import {
  getProvider,
  getInjectedProvider,
  getReadOnlyProvider,
  loadDeploymentConfig,
  getWalletChainId,
  isCorrectNetwork,
  switchOrAddNetwork,
  getTargetChainId,
  parseContractError,
} from '../utils/contract';
import { ethers } from 'ethers';

import {
  DemoCertificate,
  getDemoCertificates,
  getSavedDemoModePreference,
  setSavedDemoModePreference,
  registerDemoCertificate,
  revokeDemoCertificate,
  resetDemoCertificates,
} from '../utils/demoData';

interface AppContextType {
  wallet: WalletState;
  contract: ContractState;
  walletError: WalletError | null;
  isWalletModalOpen: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  demoCertificates: DemoCertificate[];
  toggleDemoMode: (active?: boolean) => void;
  refreshDemoData: () => void;
  addDemoCertificate: (data: {
    certificateId: string;
    studentName: string;
    courseName: string;
    institutionName: string;
    grade: string;
    issueDate: bigint | number;
    documentHash: string;
    issuedBy?: string;
  }) => DemoCertificate;
  revokeDemoCert: (id: string, reason: string) => boolean;
  resetDemoData: () => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (targetChainId?: number) => Promise<boolean>;
  refreshContract: () => Promise<void>;
  clearWalletError: () => void;
  openWalletModal: () => void;
  closeWalletModal: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: null,
    isCorrectNetwork: false,
    isAuthorizedIssuer: false,
    isOwner: false,
  });

  const [contract, setContract] = useState<ContractState>({
    isDeployed: false,
    address: null,
    totalCertificates: 0,
    lastBlockNumber: null,
    ownerAddress: null,
  });

  // Demo Mode state: default to true if user hasn't explicitly disabled it
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    const saved = getSavedDemoModePreference();
    return saved !== null ? saved : true;
  });

  const [demoCertificates, setDemoCertificates] = useState<DemoCertificate[]>(() => getDemoCertificates());

  const [walletError, setWalletError] = useState<WalletError | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refreshDemoData = useCallback(() => {
    setDemoCertificates(getDemoCertificates());
  }, []);

  const toggleDemoMode = useCallback((active?: boolean) => {
    setIsDemoMode(prev => {
      const next = active !== undefined ? active : !prev;
      setSavedDemoModePreference(next);
      return next;
    });
  }, []);

  const addDemoCertificate = useCallback(
    (data: {
      certificateId: string;
      studentName: string;
      courseName: string;
      institutionName: string;
      grade: string;
      issueDate: bigint | number;
      documentHash: string;
      issuedBy?: string;
    }) => {
      const created = registerDemoCertificate(data);
      refreshDemoData();
      return created;
    },
    [refreshDemoData]
  );

  const revokeDemoCert = useCallback(
    (id: string, reason: string) => {
      const success = revokeDemoCertificate(id, reason);
      if (success) {
        refreshDemoData();
      }
      return success;
    },
    [refreshDemoData]
  );

  const resetDemoData = useCallback(() => {
    resetDemoCertificates();
    refreshDemoData();
  }, [refreshDemoData]);

  const clearWalletError = useCallback(() => setWalletError(null), []);
  const openWalletModal = useCallback(() => setIsWalletModalOpen(true), []);
  const closeWalletModal = useCallback(() => {
    setIsWalletModalOpen(false);
    setWalletError(null);
  }, []);

  // ── Refresh Contract State ────────────────────────────────────────────────
  const refreshContract = useCallback(async () => {
    const config = await loadDeploymentConfig();
    if (!config || !config.contractAddress) {
      setContract({
        isDeployed: false,
        address: null,
        totalCertificates: 0,
        lastBlockNumber: null,
        ownerAddress: null,
      });
      return;
    }

    try {
      const provider = getProvider() || (await getReadOnlyProvider());
      if (!provider) {
        setContract({
          isDeployed: true,
          address: config.contractAddress,
          totalCertificates: 0,
          lastBlockNumber: null,
          ownerAddress: null,
        });
        return;
      }

      const c = new ethers.Contract(config.contractAddress, config.abi, provider);
      const [total, block, owner] = await Promise.all([
        c.getTotalCertificates().catch(() => 0n),
        provider.getBlockNumber().catch(() => null),
        c.owner().catch(() => null),
      ]);

      setContract({
        isDeployed: true,
        address: config.contractAddress,
        totalCertificates: Number(total),
        lastBlockNumber: block,
        ownerAddress: owner,
      });
    } catch {
      setContract({
        isDeployed: true,
        address: config.contractAddress,
        totalCertificates: 0,
        lastBlockNumber: null,
        ownerAddress: null,
      });
    }
  }, []);

  // ── Update Wallet State & Permissions ─────────────────────────────────────
  const updateWallet = useCallback(async (address: string) => {
    const provider = getProvider();
    if (!provider) return;

    try {
      const chainId = await getWalletChainId();
      let balanceFormatted = '0.0000';
      try {
        const balanceBn = await provider.getBalance(address);
        balanceFormatted = parseFloat(ethers.formatEther(balanceBn)).toFixed(4);
      } catch {}

      // Query authorization status if contract is accessible
      let isAuthorized = false;
      let isOwner = false;
      const config = await loadDeploymentConfig();
      if (config && config.contractAddress) {
        try {
          const c = new ethers.Contract(config.contractAddress, config.abi, provider);
          const [owner, authorized] = await Promise.all([
            c.owner().catch(() => null),
            c.authorizedIssuers(address).catch(() => false),
          ]);
          isOwner = owner?.toLowerCase() === address.toLowerCase();
          isAuthorized = isOwner || !!authorized;
        } catch {}
      }

      setWallet({
        isConnected: true,
        address,
        chainId,
        balance: balanceFormatted,
        isCorrectNetwork: isCorrectNetwork(chainId),
        isAuthorizedIssuer: isAuthorized,
        isOwner,
      });
      setWalletError(null);
    } catch (err: any) {
      console.warn('updateWallet error:', err);
    }
  }, []);

  // ── Connect Wallet ────────────────────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    const injected = getInjectedProvider();
    if (!injected) {
      setWalletError({
        title: 'MetaMask Not Detected',
        message:
          'No Web3 Ethereum wallet was detected in your browser. Install the MetaMask extension or open this application in the MetaMask Mobile in-app browser.',
        action: 'install_metamask',
      });
      setIsWalletModalOpen(true);
      return;
    }

    setIsLoading(true);
    setWalletError(null);

    try {
      const accounts: string[] = await injected.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts[0]) {
        await updateWallet(accounts[0]);
        await refreshContract();
      }
    } catch (err: any) {
      if (err.code === 4001) {
        setWalletError({
          title: 'Connection Cancelled',
          message: 'The wallet connection request was cancelled in MetaMask. Please click connect and approve the prompt.',
          action: 'retry',
        });
      } else if (err.code === -32002) {
        setWalletError({
          title: 'Request Already Open',
          message: 'A connection request is already pending in MetaMask. Please open your MetaMask extension and approve.',
          action: 'retry',
        });
      } else {
        setWalletError({
          title: 'Connection Failed',
          message: parseContractError(err),
          action: 'retry',
        });
      }
      setIsWalletModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, [updateWallet, refreshContract]);

  // ── Switch Network ────────────────────────────────────────────────────────
  const switchNetwork = useCallback(
    async (targetChainId?: number): Promise<boolean> => {
      const target = targetChainId || getTargetChainId();
      setIsLoading(true);
      const res = await switchOrAddNetwork(target);
      setIsLoading(false);

      if (res.success) {
        if (wallet.address) {
          await updateWallet(wallet.address);
        }
        await refreshContract();
        return true;
      } else {
        setWalletError({
          title: 'Network Switch Failed',
          message: res.error || 'Failed to switch network in MetaMask.',
          action: 'switch_network',
        });
        setIsWalletModalOpen(true);
        return false;
      }
    },
    [wallet.address, updateWallet, refreshContract]
  );

  // ── Disconnect Wallet ─────────────────────────────────────────────────────
  const disconnectWallet = useCallback(() => {
    setWallet({
      isConnected: false,
      address: null,
      chainId: null,
      balance: null,
      isCorrectNetwork: false,
      isAuthorizedIssuer: false,
      isOwner: false,
    });
    setWalletError(null);
  }, []);

  // ── Auto-Connect if Already Authorized ───────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const injected = getInjectedProvider();
      if (injected) {
        try {
          const accounts: string[] = await injected.request({ method: 'eth_accounts' });
          if (mounted && accounts && accounts[0]) {
            await updateWallet(accounts[0]);
          }
        } catch {}
      }
      if (mounted) {
        await refreshContract();
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [updateWallet, refreshContract]);

  // ── Listen to MetaMask Events ─────────────────────────────────────────────
  useEffect(() => {
    const injected = getInjectedProvider();
    if (!injected || !injected.on) return;

    const onAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts[0]) {
        updateWallet(accounts[0]);
      } else {
        disconnectWallet();
      }
    };

    const onChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setWallet(prev => ({
        ...prev,
        chainId: newChainId,
        isCorrectNetwork: isCorrectNetwork(newChainId),
      }));
      refreshContract();
    };

    injected.on('accountsChanged', onAccountsChanged);
    injected.on('chainChanged', onChainChanged);

    return () => {
      if (injected.removeListener) {
        injected.removeListener('accountsChanged', onAccountsChanged);
        injected.removeListener('chainChanged', onChainChanged);
      }
    };
  }, [updateWallet, disconnectWallet, refreshContract]);

  return (
    <AppContext.Provider
      value={{
        wallet,
        contract,
        walletError,
        isWalletModalOpen,
        isLoading,
        isDemoMode,
        demoCertificates,
        toggleDemoMode,
        refreshDemoData,
        addDemoCertificate,
        revokeDemoCert,
        resetDemoData,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        refreshContract,
        clearWalletError,
        openWalletModal,
        closeWalletModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
