import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { WalletState, ContractState } from '../types';
import {
  getProvider, getReadOnlyProvider, loadDeploymentConfig, getWalletChainId, isCorrectNetwork, formatAddress
} from '../utils/contract';
import { ethers } from 'ethers';

interface AppContextType {
  wallet:    WalletState;
  contract:  ContractState;
  connectWallet:    () => Promise<void>;
  disconnectWallet: () => void;
  refreshContract:  () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false, address: null, chainId: null, balance: null, isCorrectNetwork: false,
  });
  const [contract, setContract] = useState<ContractState>({
    isDeployed: false, address: null, totalCertificates: 0, lastBlockNumber: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  // ── Refresh Contract State ────────────────────────────────────────────────
  const refreshContract = useCallback(async () => {
    const config = await loadDeploymentConfig();
    if (!config || !config.contractAddress) {
      setContract({ isDeployed: false, address: null, totalCertificates: 0, lastBlockNumber: null });
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
        });
        return;
      }
      const c = new ethers.Contract(config.contractAddress, config.abi, provider);
      const total = await c.getTotalCertificates();
      let block: number | null = null;
      try {
        block = await provider.getBlockNumber();
      } catch {}
      setContract({
        isDeployed: true,
        address: config.contractAddress,
        totalCertificates: Number(total),
        lastBlockNumber: block,
      });
    } catch (err) {
      setContract({
        isDeployed: true, address: config.contractAddress,
        totalCertificates: 0, lastBlockNumber: null,
      });
    }
  }, []);

  // ── Update Wallet State ───────────────────────────────────────────────────
  const updateWallet = useCallback(async (address: string) => {
    const provider = getProvider();
    if (!provider) return;
    const chainId = await getWalletChainId();
    const balanceBn = await provider.getBalance(address);
    const balance = parseFloat(ethers.formatEther(balanceBn)).toFixed(4);
    setWallet({
      isConnected: true,
      address,
      chainId,
      balance,
      isCorrectNetwork: isCorrectNetwork(chainId),
    });
  }, []);

  // ── Connect Wallet ────────────────────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    if (!(window as any).ethereum) {
      alert('MetaMask not found. Please install MetaMask to use this app.');
      return;
    }
    setIsLoading(true);
    try {
      const accounts: string[] = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });
      if (accounts[0]) await updateWallet(accounts[0]);
    } catch (err: any) {
      console.error('Wallet connection error:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [updateWallet]);

  const disconnectWallet = useCallback(() => {
    setWallet({ isConnected: false, address: null, chainId: null, balance: null, isCorrectNetwork: false });
  }, []);

  // ── Auto-Connect if Already Authorized ───────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if ((window as any).ethereum) {
        try {
          const accounts: string[] = await (window as any).ethereum.request({ method: 'eth_accounts' });
          if (accounts[0]) await updateWallet(accounts[0]);
        } catch {}
      }
      await refreshContract();
    };
    init();
  }, [updateWallet, refreshContract]);

  // ── Listen to MetaMask Events ─────────────────────────────────────────────
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    const onAccountsChanged = (accounts: string[]) => {
      if (accounts[0]) updateWallet(accounts[0]);
      else disconnectWallet();
    };
    const onChainChanged = () => window.location.reload();
    eth.on('accountsChanged', onAccountsChanged);
    eth.on('chainChanged', onChainChanged);
    return () => {
      eth.removeListener('accountsChanged', onAccountsChanged);
      eth.removeListener('chainChanged', onChainChanged);
    };
  }, [updateWallet, disconnectWallet]);

  return (
    <AppContext.Provider value={{ wallet, contract, connectWallet, disconnectWallet, refreshContract, isLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
