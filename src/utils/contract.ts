import { ethers, BrowserProvider, Contract } from 'ethers';
import { DeploymentConfig } from '../types';
import defaultDeployment from '../config/deployment.json';

// ── Deployment Config Resolution ─────────────────────────────────────────────
// Resolves configuration with support for Vite environment variables
// (VITE_CONTRACT_ADDRESS, VITE_CHAIN_ID, VITE_RPC_URL, VITE_NETWORK_NAME)
// with fallback to src/config/deployment.json.
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
    console.warn('⚠️  CertiChain contract address not configured.');
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
  if (config.chainId === 11155111) return 'Ethereum Sepolia';
  if (config.chainId === 1) return 'Ethereum Mainnet';
  if (config.chainId === 31337 || config.chainId === 1337) return 'Localhost 8545 (Chain ID: 31337)';
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

// ── Provider / Signer Helpers ────────────────────────────────────────────────
export function getProvider(): BrowserProvider | null {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return new BrowserProvider((window as any).ethereum);
  }
  return null;
}

export async function getSigner() {
  const provider = getProvider();
  if (!provider) throw new Error('No Ethereum wallet detected. Please install MetaMask.');
  return provider.getSigner();
}

export async function getReadOnlyProvider(): Promise<ethers.JsonRpcProvider | null> {
  const targetChainId = getTargetChainId();

  // Build candidate RPC URLs in order of priority
  const candidateUrls: string[] = [];
  if (import.meta.env.VITE_RPC_URL) {
    candidateUrls.push(import.meta.env.VITE_RPC_URL);
  }

  if (targetChainId === 11155111) {
    candidateUrls.push(
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://rpc.sepolia.org',
      'https://rpc2.sepolia.org',
      'https://1rpc.io/sepolia'
    );
  } else {
    candidateUrls.push('http://127.0.0.1:8545', 'http://localhost:8545');
  }

  for (const url of candidateUrls) {
    try {
      const p = new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true });
      await p.getBlockNumber();
      return p;
    } catch {
      continue;
    }
  }
  return null;
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
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatHash(hash: string): string {
  if (!hash || hash.length < 12) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export function formatTimestamp(ts: bigint | number): string {
  const ms = typeof ts === 'bigint' ? Number(ts) * 1000 : ts * 1000;
  return new Date(ms).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDate(ts: bigint | number): string {
  const ms = typeof ts === 'bigint' ? Number(ts) * 1000 : ts * 1000;
  return new Date(ms).toLocaleDateString('en-IN', {
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

