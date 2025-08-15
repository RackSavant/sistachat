import { PublicKey } from '@solana/web3.js';
import { useUmi } from './umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { generateSigner, keypairIdentity, percentAmount } from '@metaplex-foundation/umi';
import { createNft, fetchDigitalAsset } from '@metaplex-foundation/mpl-token-metadata';

export interface TokenizeParams {
  name: string;
  symbol: string;
  uri: string; // Metadata URI
  sellerFeeBasisPoints: number;
  creators?: Array<{
    address: PublicKey;
    verified: boolean;
    share: number;
  }>;
  isMutable?: boolean;
}

export async function tokenizeOutfit(
  params: TokenizeParams,
  wallet: any
): Promise<{ mintAddress: string; signature: string }> {
  try {
    // Initialize UMI with the wallet
    const umi = createUmi(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com')
      .use(mplTokenMetadata())
      .use(keypairIdentity(wallet));

    // Create a new mint account
    const mint = generateSigner(umi);
    
    // Create the NFT
    const result = await createNft(umi, {
      mint,
      name: params.name,
      uri: params.uri,
      sellerFeeBasisPoints: percentAmount(params.sellerFeeBasisPoints / 100), // Convert to basis points
      symbol: params.symbol,
      creators: params.creators,
      isMutable: params.isMutable,
    }).sendAndConfirm(umi);

    // Fetch the created NFT to verify
    const nft = await fetchDigitalAsset(umi, mint.publicKey);
    
    return {
      mintAddress: mint.publicKey.toString(),
      signature: result.signature.toString(),
    };
  } catch (error) {
    console.error('Error minting NFT:', error);
    throw new Error('Failed to tokenize outfit');
  }
}
