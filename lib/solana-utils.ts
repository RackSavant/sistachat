import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const useSolanaUtils = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    const sendSol = async (toPubkey: string, amount: number) => {
        if (!publicKey) throw new Error('Wallet not connected');

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: new PublicKey(toPubkey),
                lamports: amount * LAMPORTS_PER_SOL,
            })
        );

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, 'processed');
        console.log('✅ Transaction confirmed:', signature);
        return signature;
    };

    const getBalance = async (address?: PublicKey) => {
        const targetAddress = address || publicKey;
        if (!targetAddress) throw new Error('No address provided');
        
        const balance = await connection.getBalance(targetAddress);
        return balance / LAMPORTS_PER_SOL;
    };

    const requestAirdrop = async (amount: number = 1) => {
        if (!publicKey) throw new Error('Wallet not connected');
        
        const signature = await connection.requestAirdrop(
            publicKey,
            amount * LAMPORTS_PER_SOL
        );
        await connection.confirmTransaction(signature, 'processed');
        console.log('✅ Airdrop confirmed:', signature);
        return signature;
    };

    return {
        sendSol,
        getBalance,
        requestAirdrop,
        publicKey,
        connection,
    };
};
