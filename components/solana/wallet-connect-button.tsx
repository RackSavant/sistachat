'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';

interface WalletConnectButtonProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export function WalletConnectButton({ 
  className, 
  size = 'default',
  variant = 'default'
}: WalletConnectButtonProps) {
  const { connected, publicKey, disconnect } = useWallet();

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium text-green-600 dark:text-green-400">
          Connected: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
        </div>
        <Button
          onClick={disconnect}
          size={size}
          variant="outline"
          className={className}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <WalletMultiButton 
      className={`wallet-adapter-button-trigger ${className || ''}`}
      style={{
        background: 'linear-gradient(to right, #ec4899, #8b5cf6)',
        border: 'none',
        borderRadius: '0.375rem',
        padding: size === 'sm' ? '0.5rem 1rem' : size === 'lg' ? '0.75rem 1.5rem' : '0.625rem 1.25rem',
        fontSize: size === 'sm' ? '0.875rem' : '1rem',
        fontWeight: '500',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    />
  );
}

export function WalletInfo() {
  const { connected, publicKey, wallet } = useWallet();

  if (!connected || !publicKey) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
      <h3 className="font-semibold mb-2">Wallet Connected</h3>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Wallet:</span>{' '}
          {wallet?.adapter.name}
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Address:</span>{' '}
          <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {publicKey.toString()}
          </code>
        </div>
      </div>
    </div>
  );
}
