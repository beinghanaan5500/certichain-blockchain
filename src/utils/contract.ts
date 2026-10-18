import { ethers, BrowserProvider, Contract } from 'ethers';
import { DeploymentConfig, NetworkConfig } from '../types';
import defaultDeployment from '../config/deployment.json';

// ── Supported Network Configurations ─────────────────────────────────────────
export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  11155111: {
    chainId: 11155111,
    chainIdHex: '0xaa36a7',
    chainName: 'Ethereum Sepolia',
    rpcUrls: [
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://rpc.sepolia.org',
      'https://1rpc.io/sepolia',
    ],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  31337: {
    chainId: 31337,
    chainIdHex: '0x7a69',
    chainName: 'Hardhat Localhost (Chain 31337)',
    rpcUrls: ['http://127.0.0.1:8545'],
    blockExplorerUrls: [],
    nativeCurrency: {
      name: 'Hardhat ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  1337: {
    chainId: 1337,
    chainIdHex: '0x539',
    chainName: 'Localhost (Chain 1337)',
    rpcUrls: ['http://127.0.0.1:8545'],
    blockExplorerUrls: [],
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

// ── Deployment Config Resolution ─────────────────────────────────────────────
let deploymentConfig: DeploymentConfig | null = null;

export function getEffectiveConfig(): DeploymentConfig {
  const envContractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const envChainId = import.meta.env.VITE_CHAIN_ID ? Number(import.meta.env.VITE_CHAIN_ID) : undefined;
  const envNetworkName = import.meta.env.VITE_NETWORK_NAME;

  const baseConfig = (deploymentConfig || defaultDeployment) as DeploymentConfig;

  return {
    ...baseConfig,
    contractAddress: envContractAddress || baseConfig.contractAddress || '',
    chainId:         envChainId || baseConfig.chainId || 31337,
    networkName:     envNetworkName || (envChainId === 11155111 ? 'sepolia' : baseConfig.networkName || 'localhost'),
  };
}

export async function loadDeploymentConfig(): Promise<DeploymentConfig | null> {
  const config = getEffectiveConfig();
  if (!config.contractAddress) {
    console.warn('⚠️ CertiChain contract address not configured.');
    return null;
  }
  deploymentConfig = config;
  return deploymentConfig;
}

// ── Target Network Information ────────────────────────────────────────────────
export function getTargetChainId(): number {
  return getEffectiveConfig().chainId;
}

export function getTargetNetworkName(): string {
  const config = getEffectiveConfig();
  const known = SUPPORTED_NETWORKS[config.chainId];
  if (known) return known.chainName;
  if (config.chainId === 1) return 'Ethereum Mainnet';
  return config.networkName || `Chain ID ${config.chainId}`;
}

export function isCorrectNetwork(chainId: number | null): boolean {
  if (!chainId) return false;
  const target = getTargetChainId();
  if (chainId === target) return true;
  // If target is 31337 (Hardhat), accept 1337 (Ganache/standard local)
  if (target === 31337 && chainId === 1337) return true;
  return false;
}

export function getExplorerUrl(txOrAddress: string, type: 'tx' | 'address' = 'tx'): string | null {
  const chainId = getTargetChainId();
  if (chainId === 11155111) {
    return `https://sepolia.etherscan.io/${type}/${txOrAddress}`;
  }
  return null;
}

// ── Injected Wallet Resolution ────────────────────────────────────────────────
export function getInjectedProvider(): any | null {
  if (typeof window === 'undefined') return null;
  const eth = (window as any).ethereum;
  if (!eth) return null;

  // Handle multi-wallet injection (e.g. MetaMask + Coinbase + Phantom)
  if (Array.isArray(eth.providers)) {
    const metamaskProvider = eth.providers.find((p: any) => p.isMetaMask);
    if (metamaskProvider) return metamaskProvider;
    return eth.providers[0];
  }

  return eth;
}

export function hasInjectedWallet(): boolean {
  return !!getInjectedProvider();
}

// ── Provider / Signer Helpers ────────────────────────────────────────────────
export function getProvider(): BrowserProvider | null {
  const injected = getInjectedProvider();
  if (injected) {
    return new BrowserProvider(injected);
  }
  return null;
}

export async function getSigner() {
  const provider = getProvider();
  if (!provider) {
    throw new Error('NO_WALLET: No Ethereum wallet detected. Please install MetaMask to perform transactions.');
  }
  return provider.getSigner();
}

export async function getReadOnlyProvider(): Promise<ethers.JsonRpcProvider | null> {
  const targetChainId = getTargetChainId();

  // Candidate RPC URLs in order of priority
  const candidateUrls: string[] = [];
  if (import.meta.env.VITE_RPC_URL) {
    candidateUrls.push(import.meta.env.VITE_RPC_URL);
  }

  const networkDef = SUPPORTED_NETWORKS[targetChainId];
  if (networkDef && networkDef.rpcUrls) {
    candidateUrls.push(...networkDef.rpcUrls);
  } else if (targetChainId === 11155111) {
    candidateUrls.push(
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://rpc.sepolia.org',
      'https://1rpc.io/sepolia'
    );
  } else {
    candidateUrls.push('http://127.0.0.1:8545', 'http://localhost:8545');
  }

  // Deduplicate URLs
  const uniqueUrls = Array.from(new Set(candidateUrls));

  for (const url of uniqueUrls) {
    // Avoid insecure HTTP attempts from secure HTTPS browser contexts
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
      continue;
    }

    try {
      // Short timeout (3.5s) to avoid UI hang if an RPC endpoint is unreachable
      const p = new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('RPC timeout')), 3500)
      );
      await Promise.race([p.getBlockNumber(), timeoutPromise]);
      return p;
    } catch {
      continue;
    }
  }
  return null;
}

// ── Programmatic Network Switching & Adding ──────────────────────────────────
export async function switchOrAddNetwork(targetChainId?: number): Promise<{ success: boolean; error?: string }> {
  const injected = getInjectedProvider();
  if (!injected) {
    return { success: false, error: 'MetaMask is not installed. Please install MetaMask to switch networks.' };
  }

  const chainId = targetChainId || getTargetChainId();
  const hexChainId = '0x' + chainId.toString(16);
  const netConfig = SUPPORTED_NETWORKS[chainId];

  try {
    await injected.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
    return { success: true };
  } catch (switchError: any) {
    // Error code 4902 indicates the chain has not been added to MetaMask
    if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
      if (netConfig) {
        try {
          await injected.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: hexChainId,
                chainName: netConfig.chainName,
                rpcUrls: netConfig.rpcUrls,
                blockExplorerUrls: netConfig.blockExplorerUrls.length > 0 ? netConfig.blockExplorerUrls : undefined,
                nativeCurrency: netConfig.nativeCurrency,
              },
            ],
          });
          return { success: true };
        } catch (addError: any) {
          return { success: false, error: addError.message || 'Failed to add network to MetaMask.' };
        }
      }
    }
    if (switchError.code === 4001) {
      return { success: false, error: 'Network switch request was rejected in MetaMask.' };
    }
    return { success: false, error: switchError.message || 'Failed to switch network.' };
  }
}

// ── Contract Factory ─────────────────────────────────────────────────────────
export async function getContract(withSigner = false): Promise<Contract | null> {
  const config = getEffectiveConfig();
  if (!config || !config.contractAddress) return null;

  try {
    if (withSigner) {
      const signer = await getSigner();
      return new Contract(config.contractAddress, config.abi, signer);
    } else {
      const provider = getProvider();
      if (provider) {
        return new Contract(config.contractAddress, config.abi, provider);
      }
      const roProvider = await getReadOnlyProvider();
      if (!roProvider) return null;
      return new Contract(config.contractAddress, config.abi, roProvider);
    }
  } catch (err) {
    console.error('getContract error:', err);
    return null;
  }
}

// ── Hash Utilities ────────────────────────────────────────────────────────────
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hashHex;
}

export function hashText(text: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(text));
}

// ── Formatting ────────────────────────────────────────────────────────────────
export function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatHash(hash: string): string {
  if (!hash || hash.length < 12) return hash || '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export function formatTimestamp(ts: bigint | number): string {
  const ms = typeof ts === 'bigint' ? Number(ts) * 1000 : ts * 1000;
  if (!ms || isNaN(ms)) return '—';
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDate(ts: bigint | number): string {
  const ms = typeof ts === 'bigint' ? Number(ts) * 1000 : ts * 1000;
  if (!ms || isNaN(ms)) return '—';
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Network Check ─────────────────────────────────────────────────────────────
export async function getWalletChainId(): Promise<number | null> {
  const provider = getProvider();
  if (!provider) return null;
  try {
    const network = await provider.getNetwork();
    return Number(network.chainId);
  } catch {
    return null;
  }
}

// ── Error Parser ──────────────────────────────────────────────────────────────
export function parseContractError(err: any): string {
  if (!err) return 'An unknown error occurred.';

  // User rejection
  if (err.code === 4001 || err.code === 'ACTION_REJECTED' || err.message?.includes('user rejected')) {
    return 'Transaction rejected in your wallet.';
  }

  // Already pending
  if (err.code === -32002 || err.message?.includes('already pending')) {
    return 'A wallet request is already pending. Please check MetaMask popup.';
  }

  // Contract revert custom messages
  const msg = err.reason || err.shortMessage || err.message || '';

  if (msg.includes('CertiChain: caller is not an authorized issuer')) {
    return 'Unauthorized: Your connected wallet is not an authorized academic issuer on this contract.';
  }
  if (msg.includes('CertiChain: caller is not the owner')) {
    return 'Unauthorized: Only the contract owner can perform this action.';
  }
  if (msg.includes('CertiChain: certificate ID already registered')) {
    return 'Duplicate ID: This Certificate ID is already registered on the blockchain.';
  }
  if (msg.includes('CertiChain: certificate already revoked')) {
    return 'Already Revoked: This certificate has already been revoked.';
  }
  if (msg.includes('CertiChain: certificate ID does not exist')) {
    return 'Not Found: No certificate with this ID exists on the blockchain.';
  }
  if (msg.includes('CertiChain: revocation reason required')) {
    return 'Revocation reason cannot be empty.';
  }
  if (msg.includes('insufficient funds') || msg.includes('gas required exceeds allowance')) {
    return 'Insufficient funds: Your wallet does not have enough testnet ETH to pay the transaction gas fee.';
  }
  if (msg.includes('NO_WALLET')) {
    return 'MetaMask not detected. Please install MetaMask to submit transactions.';
  }

  // Clean fallback
  return err.reason || err.shortMessage || (msg.length > 120 ? msg.slice(0, 120) + '...' : msg) || 'Transaction failed.';
}

// ── Validation Helpers ────────────────────────────────────────────────────────
export function validateCertificateId(id: string): string | null {
  const trimmed = id.trim();
  if (!trimmed) return 'Certificate ID is required.';
  if (trimmed.length < 3) return 'Certificate ID must be at least 3 characters.';
  if (trimmed.length > 64) return 'Certificate ID cannot exceed 64 characters.';
  if (!/^[a-zA-Z0-9_\-./]+$/.test(trimmed)) {
    return 'Certificate ID can only contain letters, numbers, hyphens, slashes, and periods.';
  }
  return null;
}

export function validateGrade(grade: string): string | null {
  const trimmed = grade.trim();
  if (!trimmed) return 'Grade or CGPA is required.';
  if (trimmed.length > 50) return 'Grade description cannot exceed 50 characters.';
  return null;
}
