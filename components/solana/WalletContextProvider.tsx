'use client';

import { FC, ReactNode, useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter, 
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  CoinbaseWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, Cluster } from '@solana/web3.js';
import { WalletError } from '@solana/wallet-adapter-base';

// CSS for the wallet modal
require('@solana/wallet-adapter-react-ui/styles.css');

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get network config from environment variables with validation
    const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet') as Cluster;

    // Initialize wallets with error handling
    const wallets = useMemo(() => {
        try {
            const supportedWallets = [
                new PhantomWalletAdapter(),
                new SolflareWalletAdapter(),
                new TorusWalletAdapter(),
                new LedgerWalletAdapter(),
                new CoinbaseWalletAdapter(),
            ];
            
            return supportedWallets;
        } catch (err) {
            console.error('Error initializing wallets:', err);
            setError('Failed to initialize wallet adapters');
            return [];
        }
    }, [network]);

    const onError = (error: WalletError) => {
        console.error('Wallet Error:', error);
        setError(error.message);
    };

    // Get the RPC endpoint based on network
    const endpoint = useMemo(() => {
        // Use environment variable if available
        if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
            return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
        }
        
        // Fallback to appropriate RPC based on network
        return network === 'mainnet-beta' 
            ? 'https://api.mainnet-beta.solana.com'
            : network === 'testnet'
                ? 'https://api.testnet.solana.com'
                : 'https://api.devnet.solana.com';
    }, [network]);

    // Set loading to false once wallets are initialized
    useEffect(() => {
        setIsLoading(false);
    }, []);

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-lg">Initializing wallet connection...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center p-6 max-w-md mx-auto bg-red-50 rounded-lg">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Wallet Error</h2>
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect onError={onError}>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default WalletContextProvider;
