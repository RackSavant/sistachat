# Solana Integration Guide for SistaChat

## Overview
This guide explains how to integrate Solana blockchain functionality into SistaChat, including wallet connections, RackSavant contract interactions, and NFT tokenization for fashion designs.

## Prerequisites
- Node.js 18+ installed
- A Solana wallet (Phantom, Solflare, etc.)
- Basic understanding of Solana blockchain

## Installation

### 1. Install Required Packages
```bash
npm install @solana/web3.js @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @coral-xyz/anchor @solana/spl-token
```

### 2. Environment Variables
Add these to your `.env.local` file:

```env
# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_RACKSAVANT_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
```

For production (mainnet):
```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_RACKSAVANT_PROGRAM_ID=your-mainnet-program-id
```

## Components Setup

### 1. Wrap Your App with Wallet Provider
Update your `app/layout.tsx`:

```tsx
import { SolanaWalletProvider } from '@/components/solana/wallet-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SolanaWalletProvider>
          <ThemeProvider>
            {/* Your existing layout */}
            {children}
          </ThemeProvider>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
```

### 2. Add Solana Dashboard to Settings
Create a new settings page at `app/settings/solana/page.tsx`:

```tsx
import { SolanaDashboard } from '@/components/solana/solana-dashboard';

export default function SolanaSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Solana Integration</h1>
      <SolanaDashboard />
    </div>
  );
}
```

### 3. Add Wallet Connect Button to Header
Update your header to include wallet connection:

```tsx
import { WalletConnectButton } from '@/components/solana/wallet-connect-button';

// In your header component
<div className="flex items-center gap-4">
  <WalletConnectButton size="sm" />
  {/* Your existing header items */}
</div>
```

## Core Features

### 1. Wallet Connection
- Supports Phantom, Solflare, Backpack, and Ledger wallets
- Automatic reconnection on page refresh
- Balance checking and transaction history

### 2. RackSavant Contract Integration
- Designer registration
- NFT minting for fashion designs
- Revenue sharing mechanisms
- Platform fee management

### 3. Fashion Design Tokenization
Users can:
- Register as designers on the blockchain
- Mint NFTs for their fashion designs
- Set up revenue sharing with collaborators
- Track ownership and transfers

## Usage Examples

### Basic Wallet Integration
```tsx
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletConnectButton } from '@/components/solana/wallet-connect-button';

function MyComponent() {
  const { connected, publicKey } = useWallet();

  return (
    <div>
      {connected ? (
        <p>Connected: {publicKey?.toString()}</p>
      ) : (
        <WalletConnectButton />
      )}
    </div>
  );
}
```

### Contract Interactions
```tsx
import { solanaClient } from '@/lib/solana-client';

// Register as designer
const registerDesigner = async () => {
  if (!publicKey) return;
  
  const result = await solanaClient.registerDesigner(
    publicKey,
    'Designer Name',
    'ipfs://bio-hash'
  );
  
  console.log('Transaction:', result.txId);
};
```

## File Structure
```
├── lib/
│   ├── solana-config.ts      # Network and RPC configuration
│   └── solana-client.ts      # Contract interaction client
├── components/
│   └── solana/
│       ├── wallet-provider.tsx          # Wallet context provider
│       ├── wallet-connect-button.tsx    # Wallet connection UI
│       └── solana-dashboard.tsx         # Full dashboard component
└── app/
    └── settings/
        └── solana/
            └── page.tsx      # Solana settings page
```

## Network Configuration

### Development (Devnet)
- Free SOL from faucets
- Fast transactions
- Test environment

### Production (Mainnet)
- Real SOL required
- Production transactions
- Live environment

## Security Considerations

1. **Private Keys**: Never store private keys in your application
2. **RPC Endpoints**: Use secure, rate-limited RPC providers
3. **Transaction Validation**: Always validate transactions before signing
4. **Network Selection**: Clearly indicate which network users are on

## Troubleshooting

### Common Issues
1. **Wallet not connecting**: Check if wallet extension is installed
2. **Transaction failing**: Ensure sufficient SOL balance for fees
3. **Network mismatch**: Verify wallet is on correct network

### Debug Mode
Set environment variable for debugging:
```env
DEBUG=solana:*
```

## Next Steps

1. **Add Solana dashboard to navigation menu**
2. **Integrate with existing fashion upload flow**
3. **Create NFT marketplace for designs**
4. **Add revenue sharing for AI feedback**
5. **Implement designer reputation system**

## Resources

- [Solana Documentation](https://docs.solana.com/)
- [Wallet Adapter Documentation](https://github.com/solana-labs/wallet-adapter)
- [Anchor Framework](https://www.anchor-lang.com/)
- [RackSavant Contract Repository](./racksavant-contract/)

## Support

For issues with Solana integration:
1. Check the console for error messages
2. Verify network connectivity
3. Ensure wallet has sufficient balance
4. Check RPC endpoint status
