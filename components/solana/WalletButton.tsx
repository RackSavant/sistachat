'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';

export const WalletButton = () => {
    const { publicKey } = useWallet();
    const { connection } = useConnection();
    const [balance, setBalance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch balance when wallet connects
    useEffect(() => {
        const fetchBalance = async () => {
            if (!publicKey) {
                setBalance(null);
                return;
            }
            
            try {
                setIsLoading(true);
                setError(null);
                const balance = await connection.getBalance(publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);
            } catch (err) {
                console.error('Error fetching balance:', err);
                setError('Failed to fetch balance');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBalance();
        
        // Subscribe to balance changes
        const subscriptionId = connection.onAccountChange(
            publicKey || new PublicKey('11111111111111111111111111111111'), // Dummy pubkey if none
            (accountInfo) => {
                setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
            },
            'confirmed'
        );

        return () => {
            connection.removeAccountChangeListener(subscriptionId);
        };
    }, [publicKey, connection]);

    // Format address for display
    const formatAddress = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    return (
        <div className="flex items-center space-x-2">
            {error && (
                <div className="text-red-500 text-sm mr-2">
                    {error}
                </div>
            )}
            
            {publicKey && (
                <div className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm">
                    {isLoading ? (
                        'Loading...'
                    ) : balance !== null ? (
                        `${balance.toFixed(2)} SOL`
                    ) : (
                        'Balance: --'
                    )}
                </div>
            )}
            
            <div className="wallet-adapter-button-trigger">
                <WalletMultiButton>
                    {publicKey ? formatAddress(publicKey.toString()) : 'Connect Wallet'}
                </WalletMultiButton>
            </div>
            
            <style jsx global>{`
                .wallet-adapter-button-trigger {
                    background-color: #512da8;
                }
                .wallet-adapter-button-trigger:hover {
                    background-color: #4527a0;
                }
            `}</style>
        </div>
    );
};

export default WalletButton;
