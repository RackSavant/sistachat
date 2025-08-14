import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

// Environment variables for Solana configuration
export const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Devnet;
export const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(SOLANA_NETWORK);

// Program IDs
export const RACKSAVANT_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_RACKSAVANT_PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS'
);

// Connection configuration
export const CONNECTION_CONFIG = {
  commitment: 'confirmed' as const,
  confirmTransactionInitialTimeout: 60000,
};

// Create Solana connection
export const connection = new Connection(SOLANA_RPC_ENDPOINT, CONNECTION_CONFIG);

// Network configuration
export const NETWORK_CONFIG = {
  [WalletAdapterNetwork.Mainnet]: {
    name: 'Mainnet Beta',
    rpc: clusterApiUrl(WalletAdapterNetwork.Mainnet),
    explorerUrl: 'https://explorer.solana.com',
  },
  [WalletAdapterNetwork.Testnet]: {
    name: 'Testnet',
    rpc: clusterApiUrl(WalletAdapterNetwork.Testnet),
    explorerUrl: 'https://explorer.solana.com?cluster=testnet',
  },
  [WalletAdapterNetwork.Devnet]: {
    name: 'Devnet',
    rpc: clusterApiUrl(WalletAdapterNetwork.Devnet),
    explorerUrl: 'https://explorer.solana.com?cluster=devnet',
  },
};

// Helper functions
export function getExplorerUrl(signature: string, cluster: WalletAdapterNetwork = SOLANA_NETWORK) {
  const baseUrl = NETWORK_CONFIG[cluster].explorerUrl;
  return `${baseUrl}/tx/${signature}`;
}

export function getAccountExplorerUrl(address: string, cluster: WalletAdapterNetwork = SOLANA_NETWORK) {
  const baseUrl = NETWORK_CONFIG[cluster].explorerUrl;
  return `${baseUrl}/account/${address}`;
}
