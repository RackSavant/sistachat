import { SolanaDashboard } from '@/components/solana/solana-dashboard';

export default function SolanaSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Solana Integration
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your Solana wallet and tokenize your fashion designs on the blockchain
        </p>
      </div>
      
      <SolanaDashboard className="max-w-4xl" />
    </div>
  );
}
