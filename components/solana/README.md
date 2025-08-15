# Solana Wallet Integration

This directory contains the core components for Solana wallet integration in the SistaChat application.

## Components

### 1. WalletContextProvider

The main provider component that should wrap your application. It handles:
- Wallet connection management
- Network configuration
- Error handling
- Loading states
- Multiple wallet support (Phantom, Solflare, Backpack, etc.)

#### Usage

```tsx
// app/layout.tsx
import { WalletContextProvider } from '@/components/solana/WalletContextProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
```

### 2. WalletButton

A pre-styled button component that handles wallet connection and displays wallet info.

#### Features
- Shows wallet connection status
- Displays SOL balance
- Handles connection errors
- Responsive design

#### Usage

```tsx
import { WalletButton } from '@/components/solana/WalletButton';

export function YourComponent() {
  return (
    <div>
      <h1>Your App</h1>
      <div className="absolute top-4 right-4">
        <WalletButton />
      </div>
    </div>
  );
}
```

## Environment Variables

Make sure these are set in your `.env.local` file:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet  # or mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com  # Optional: Your custom RPC URL
NEXT_PUBLIC_RACKSAVANT_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
```

## Available Hooks

You can use these hooks in any component:

```tsx
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

function YourComponent() {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  
  // Your component logic...
}
```

## Styling

The wallet button uses Tailwind CSS for styling. You can customize the appearance by:

1. Overriding the default styles in your global CSS:
```css
/* app/globals.css */
.wallet-adapter-button {
  background-color: #512da8 !important;
}
```

2. Or by using the `wallet-adapter-button-trigger` class in your component:
```tsx
<WalletButton className="your-custom-class" />
```

## Error Handling

All wallet errors are automatically caught and displayed to the user. You can also handle errors manually using the `onError` prop:

```tsx
<WalletContextProvider onError={(error) => {
  console.error('Wallet error:', error);
  // Your custom error handling
}}>
  {children}
</WalletContextProvider>
```
