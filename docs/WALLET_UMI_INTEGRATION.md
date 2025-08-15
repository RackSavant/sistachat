# Wallet and UMI Integration Guide

This document outlines the wallet integration and UMI (Unified Metaplex Interface) setup for the SistaChat application.

## Table of Contents
- [Overview](#overview)
- [Dependencies](#dependencies)
- [Setup](#setup)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## Overview

The application uses:
- `@solana/wallet-adapter-react` for wallet connection management
- `@metaplex-foundation/umi` for Solana program interactions
- Custom UMI context and hooks for simplified usage

## Dependencies

Make sure these are installed:

```bash
npm install @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/web3.js
npm install @metaplex-foundation/umi-bundle-defaults @metaplex-foundation/mpl-token-metadata @metaplex-foundation/umi-signer-wallet-adapters
```

## Setup

### 1. Wallet Provider

Wrap your app with the wallet provider in `app/layout.tsx`:

```tsx
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

function MyApp({ children }) {
  const network = WalletAdapterNetwork.Devnet; // or .Mainnet
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  
  const wallets = useMemo(
    () => [
      // Add wallet adapters here (e.g., Phantom, Solflare)
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

### 2. UMI Provider

Wrap your app with the UMI provider:

```tsx
import { UmiProvider } from '@/lib/umi';

function MyApp({ children }) {
  return (
    <UmiProvider>
      {children}
    </UmiProvider>
  );
}
```

## Usage

### Using the Wallet

```tsx
import { useWallet } from '@solana/wallet-adapter-react';

function MyComponent() {
  const { publicKey, connect, disconnect } = useWallet();
  
  return (
    <div>
      {publicKey ? (
        <button onClick={disconnect}>
          Disconnect {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </button>
      ) : (
        <button onClick={connect}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}
```

### Using UMI

```tsx
import { useUmi } from '@/lib/umi';

function MyComponent() {
  const umi = useUmi();
  
  const handleAction = async () => {
    try {
      // Use umi to interact with Solana programs
      const result = await someUmiAction(umi);
      console.log('Result:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return <button onClick={handleAction}>Perform Action</button>;
}
```

## Troubleshooting

### Common Issues

1. **Wallet Not Connecting**
   - Ensure the wallet extension is installed
   - Check the browser console for errors
   - Verify the network (devnet/mainnet) matches the wallet's network

2. **UMI Errors**
   - Make sure the UMI provider wraps your app
   - Check that the RPC endpoint is correct and accessible
   - Verify the wallet is connected before performing UMI actions

3. **TypeScript Errors**
   - Ensure all dependencies are properly installed
   - Check for version mismatches between packages
   - Make sure TypeScript is configured correctly in `tsconfig.json`

### Environment Variables

Add these to your `.env.local` file:

```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Additional Resources

- [Solana Wallet Adapter Docs](https://github.com/solana-labs/wallet-adapter)
- [Metaplex UMI Documentation](https://github.com/metaplex-foundation/umi)
- [Solana Cookbook](https://solanacookbook.com/)
