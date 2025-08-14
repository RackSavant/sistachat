'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WalletConnectButton, WalletInfo } from './wallet-connect-button';
import { useSolanaUtils } from '@/lib/solana-utils';
import { getExplorerUrl, getAccountExplorerUrl } from '@/lib/solana-config';

interface SolanaDashboardProps {
  className?: string;
}

export function SolanaDashboard({ className }: SolanaDashboardProps) {
  const { connected, publicKey } = useWallet();
  const { sendSol, getBalance, requestAirdrop } = useSolanaUtils();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<string[]>([]);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('0.01');

  // Load wallet data when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      loadWalletData();
    }
  }, [connected, publicKey]);

  const loadWalletData = async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    try {
      const walletBalance = await getBalance();
      setBalance(walletBalance);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSol = async () => {
    if (!recipientAddress || !sendAmount) {
      alert('Please enter recipient address and amount');
      return;
    }

    setIsLoading(true);
    try {
      const signature = await sendSol(recipientAddress, parseFloat(sendAmount));
      setTransactions(prev => [...prev, signature]);
      await loadWalletData(); // Refresh balance
      setRecipientAddress('');
      setSendAmount('0.01');
    } catch (error) {
      console.error('Failed to send SOL:', error);
      alert('Transaction failed: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAirdrop = async () => {
    setIsLoading(true);
    try {
      const signature = await requestAirdrop(1); // Request 1 SOL
      setTransactions(prev => [...prev, signature]);
      await loadWalletData(); // Refresh balance
    } catch (error) {
      console.error('Failed to request airdrop:', error);
      alert('Airdrop failed: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!connected) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Solana Integration</CardTitle>
          <CardDescription>
            Connect your Solana wallet to access blockchain features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WalletConnectButton />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Wallet Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Solana Wallet
            <Badge variant="outline" className="text-green-600">
              Connected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WalletInfo />
          
          {publicKey && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Balance:</span>
                <span className="text-sm">
                  {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
                </span>
              </div>
              
              <Button
                onClick={loadWalletData}
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Refreshing...' : 'Refresh Balance'}
              </Button>

              <a
                href={getAccountExplorerUrl(publicKey.toString())}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline block"
              >
                View on Solana Explorer →
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Solana Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Solana Operations</CardTitle>
          <CardDescription>
            Send SOL and request airdrops (devnet only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Request Airdrop (Devnet only) */}
          <div className="space-y-2">
            <Button
              onClick={handleRequestAirdrop}
              disabled={isLoading || !publicKey}
              variant="outline"
              className="w-full"
            >
              {isLoading ? 'Processing...' : 'Request 1 SOL Airdrop (Devnet)'}
            </Button>
          </div>

          {/* Send SOL */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="Enter Solana address..."
            />
            
            <Label htmlFor="amount">Amount (SOL)</Label>
            <Input
              id="amount"
              type="number"
              step="0.001"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              placeholder="0.01"
            />
            
            <Button
              onClick={handleSendSol}
              disabled={isLoading || !publicKey || !recipientAddress}
              className="w-full"
            >
              {isLoading ? 'Processing...' : 'Send SOL'}
            </Button>
          </div>

          {balance !== null && balance < 0.01 && (
            <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
              ⚠️ Low balance detected. You need at least 0.01 SOL for transactions.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transactions.map((txId, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <code className="text-xs">{txId.slice(0, 8)}...{txId.slice(-8)}</code>
                  <a
                    href={getExplorerUrl(txId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View →
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disconnect */}
      <div className="flex justify-center">
        <WalletConnectButton variant="outline" />
      </div>
    </div>
  );
}
