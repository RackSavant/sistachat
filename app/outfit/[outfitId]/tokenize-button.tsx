'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@solana/wallet-adapter-react';
import { tokenizeOutfit } from '@/lib/tokenization';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface TokenizeButtonProps {
  outfitId: string;
  imageUrl: string;
  notes?: string;
  userId: string;
}

export function TokenizeButton({ outfitId, imageUrl, notes, userId }: TokenizeButtonProps) {
  const { publicKey, signTransaction } = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const router = useRouter();

  const handleTokenize = async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsMinting(true);
    
    try {
      // First, create metadata on your server
      const metadataResponse = await fetch('/api/create-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outfitId,
          imageUrl,
          notes,
          userId,
        }),
      });

      if (!metadataResponse.ok) {
        throw new Error('Failed to create metadata');
      }

      const { metadataUri } = await metadataResponse.json();

      // Then mint the NFT with the metadata URI
      const result = await tokenizeOutfit(
        {
          name: `Outfit #${outfitId.slice(0, 6)}`,
          symbol: 'SISTA',
          uri: metadataUri,
          sellerFeeBasisPoints: 500, // 5%
          creators: [
            {
              address: publicKey,
              verified: false,
              share: 100,
            },
          ],
          isMutable: true,
        },
        window.solana // Assuming Phantom wallet is used
      );

      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span>Outfit tokenized successfully!</span>
        </div>,
        {
          duration: 5000,
        }
      );

      // Refresh the page to show the tokenized state
      router.refresh();
    } catch (error) {
      console.error('Tokenization error:', error);
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span>Failed to tokenize outfit: {error instanceof Error ? error.message : 'Unknown error'}</span>
        </div>,
        {
          duration: 5000,
        }
      );
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <Button
      onClick={handleTokenize}
      disabled={isMinting}
      className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
    >
      {isMinting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Tokenizing...
        </>
      ) : (
        'Tokenize on Solana'
      )}
    </Button>
  );
}
