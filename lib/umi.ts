import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { useWallet } from '@solana/wallet-adapter-react';
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import { createContext, ReactNode, useContext, useMemo } from 'react';

// Default RPC URL based on environment
const DEFAULT_RPC_URL = 
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 
  clusterApiUrl((process.env.NEXT_PUBLIC_SOLANA_NETWORK as any) || 'devnet');

// Create a context for the UMI instance
type UmiInstance = ReturnType<typeof createUmi>;

interface UmiContextType {
  umi: UmiInstance;
}

const UmiContext = createContext<UmiContextType | null>(null);

// Initialize UMI instance
export function getUmi(rpcUrl: string = DEFAULT_RPC_URL): UmiInstance {
  if (!rpcUrl) {
    throw new Error('RPC URL is required');
  }

  try {
    return createUmi(rpcUrl).use(mplTokenMetadata());
  } catch (error) {
    console.error('Failed to initialize UMI:', error);
    throw new Error('Failed to initialize UMI instance');
  }
}

// Provider component to wrap your app with
export function UmiProvider({ children }: { children: ReactNode }) {
  const umi = useMemo(() => getUmi(), []);
  
  const contextValue = useMemo<UmiContextType>(() => ({
    umi
  }), [umi]);
  
  return (
    <UmiContext.Provider value={contextValue}>
      {children}
    </UmiContext.Provider>
  );
}

// Hook to use UMI with wallet integration
export function useUmi() {
  const wallet = useWallet();
  const context = useContext(UmiContext);
  
  if (!context) {
    throw new Error('useUmi must be used within a UmiProvider');
  }

  return useMemo(() => {
    return wallet.publicKey 
      ? context.umi.use(walletAdapterIdentity(wallet as any))
      : context.umi;
  }, [wallet.publicKey, context.umi]);
}

// Helper function to format public key
export const formatPublicKey = (publicKey: string | PublicKey): string => {
  const pubkey = typeof publicKey === 'string' ? new PublicKey(publicKey) : publicKey;
  return pubkey.toBase58().slice(0, 4) + '...' + pubkey.toBase58().slice(-4);
};

// Helper to handle transaction errors
export const handleTransactionError = (error: unknown): never => {
  console.error('Transaction error:', error);
  
  if (error instanceof Error) {
    if (error.message.includes('User rejected')) {
      throw new Error('Transaction was rejected');
    }
    if (error.message.includes('InsufficientFunds')) {
      throw new Error('Insufficient SOL for transaction');
    }
  }
  
  throw new Error('Transaction failed. Please try again.');
};

// Helper to confirm transaction
export const confirmTransaction = async (
  umi: UmiInstance,
  signature: Uint8Array | string
) => {
  try {
    const confirmation = await umi.rpc.confirmTransaction(signature);
    if (confirmation.value.err) {
      throw new Error('Transaction failed');
    }
    return confirmation;
  } catch (error) {
    handleTransactionError(error);
    throw error;
  }
};
