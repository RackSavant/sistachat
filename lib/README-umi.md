# UMI Utilities

This module provides a set of utilities for working with Metaplex's UMI (Universal Metadata Interface) in your SistaChat application.

## Features

- **UMI Instance Management**: Create and manage UMI instances with proper configuration
- **React Hooks**: Easy integration with React components
- **Wallet Integration**: Automatic wallet adapter integration
- **Error Handling**: Comprehensive error handling for transactions
- **Helper Functions**: Common operations simplified

## Setup

First, wrap your application with the `UmiProvider`:

```tsx
// app/layout.tsx
import { UmiProvider } from '@/lib/umi';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <UmiProvider>
          {children}
        </UmiProvider>
      </body>
    </html>
  );
}
```

## Usage

### Basic Usage in Components

```tsx
'use client';

import { useUmi } from '@/lib/umi';

export function YourComponent() {
  const umi = useUmi();
  
  // Now you can use umi to interact with the blockchain
  // Example: const metadata = await fetchMetadata(umi, mintAddress);
  
  return <div>Your component</div>;
}
```

### Making Transactions

```tsx
import { useUmi, confirmTransaction } from '@/lib/umi';

function YourTransactionComponent() {
  const umi = useUmi();
  
  const handleTransaction = async () => {
    try {
      // Create your transaction
      const transaction = /* your transaction logic */;
      
      // Send and confirm
      const signature = await umi.rpc.sendTransaction(transaction);
      await confirmTransaction(umi, signature);
      
      // Transaction successful!
    } catch (error) {
      // Error is already handled by confirmTransaction
      console.error(error);
    }
  };
  
  return <button onClick={handleTransaction}>Send Transaction</button>;
}
```

## Available Hooks & Functions

### `useUmi()`

A React hook that provides access to the UMI instance with wallet integration.

### `getUmi(rpcUrl?: string)`

Creates a new UMI instance with the specified RPC URL.

### `confirmTransaction(umi, signature)`

Helper function to confirm a transaction with proper error handling.

### `formatPublicKey(publicKey)`

Formats a public key for display purposes.

## Error Handling

All UMI operations are wrapped in error handling that provides user-friendly error messages. You can also use the `handleTransactionError` function to handle errors manually.

## Configuration

Set these environment variables in your `.env.local` file:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

## Best Practices

1. Always use the `useUmi` hook in your components to ensure proper wallet integration
2. Wrap transaction logic in try/catch blocks
3. Use the provided error handling utilities
4. For complex transactions, consider creating custom hooks that use the UMI instance

## Example: Fetching Metadata

```tsx
import { publicKey } from '@metaplex-foundation/umi';
import { fetchMetadata } from '@metaplex-foundation/mpl-token-metadata';

async function getTokenMetadata(umi: any, mintAddress: string) {
  const metadata = await fetchMetadata(umi, publicKey(mintAddress));
  return metadata;
}
```

## Troubleshooting

- **Connection Issues**: Verify your RPC URL is correct and accessible
- **Transaction Failures**: Check the error message and ensure you have enough SOL for fees
- **Wallet Not Connected**: Ensure the wallet adapter is properly configured and the user has connected their wallet
