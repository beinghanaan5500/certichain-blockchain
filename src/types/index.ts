// TypeScript types for the CertiChain application

export interface Certificate {
  certificateId:   string;
  studentName:     string;
  courseName:      string;
  institutionName: string;
  grade:           string;
  issueDate:       bigint;
  registeredAt:    bigint;
  documentHash:    string;
  issuedBy:        string;
  isRevoked:       boolean;
  revokeReason:    string;
}

export type VerificationStatus =
  | 'idle'
  | 'loading'
  | 'found'
  | 'not-found'
  | 'revoked'
  | 'hash-match'
  | 'hash-mismatch'
  | 'error';

export interface VerificationResult {
  status:       VerificationStatus;
  certificate?: Certificate;
  hashMatches?: boolean;
  message:      string;
  txHash?:      string;
}

export interface WalletError {
  title: string;
  message: string;
  action?: 'install_metamask' | 'switch_network' | 'retry' | 'none';
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
  isCorrectNetwork: boolean;
  isAuthorizedIssuer: boolean;
  isOwner: boolean;
}

export interface ContractState {
  isDeployed: boolean;
  address: string | null;
  totalCertificates: number;
  lastBlockNumber: number | null;
  ownerAddress?: string | null;
}

export interface TxState {
  isLoading: boolean;
  hash: string | null;
  error: string | null;
  success: boolean;
}

export interface DeploymentConfig {
  contractAddress: string;
  chainId: number;
  networkName: string;
  deployedAt: string;
  deployerAddress: string;
  abi: object[];
}

export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  chainName: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}
