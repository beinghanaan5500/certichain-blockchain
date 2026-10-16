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

export interface WalletState {
  isConnected:   boolean;
  address:       string | null;
  chainId:       number | null;
  balance:       string | null;
  isCorrectNetwork: boolean;
}

export interface ContractState {
  isDeployed:      boolean;
  address:         string | null;
  totalCertificates: number;
  lastBlockNumber: number | null;
}

export interface TxState {
  isLoading:  boolean;
  hash:       string | null;
  error:      string | null;
  success:    boolean;
}

export interface DeploymentConfig {
  contractAddress:  string;
  chainId:          number;
  networkName:      string;
  deployedAt:       string;
  deployerAddress:  string;
  abi:              object[];
}
