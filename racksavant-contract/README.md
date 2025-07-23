# RackSavant NFT/Giphy Platform Smart Contract

A Solana-based smart contract platform for designer tokenization and revenue sharing, enabling fashion designers to monetize their work through token-based collections and direct sales.

## Overview

RackSavant implements a unique tokenomics model where:
- Each designer gets a fixed supply of 1M SPL tokens (90% to designer, 10% to liquidity pool)
- Buyers purchase physical fashion items with SOL
- Revenue from sales is distributed pro-rata to token holders after platform fees
- On-chain provenance tracking with off-chain image storage on Cloudflare R2

## Architecture

### Core Components

1. **Platform State**: Global configuration and statistics
2. **Designer Profiles**: KYC'd designers with token mints
3. **Design Metadata**: Item listings with pricing and inventory
4. **Revenue Distribution**: Pro-rata payouts to token holders
5. **Fee Management**: Platform treasury and withdrawal system

### Token Economics

- **Fixed Supply**: 1,000,000 tokens per designer (non-mintable, non-burnable)
- **Initial Distribution**: 90% designer, 10% liquidity pool
- **Revenue Sharing**: Sales revenue distributed to holders after 5% platform fee
- **Scarcity Model**: Limited token supply creates fashion flex value

## Smart Contract Instructions

### Platform Management

#### `initialize_platform(platform_fee_bps: u16)`
- Initializes the platform with fee configuration
- Creates global platform state PDA
- Sets platform treasury and fee percentage (default: 500 bps = 5%)

### Designer Operations

#### `register_designer(name: String, ipfs_bio_uri: String)`
- Registers a new designer (requires off-chain KYC)
- Mints 1M fixed-supply SPL tokens
- Distributes 90% to designer, 10% to LP pool
- Creates designer profile PDA

#### `upload_design(image_hash: [u8; 32], price_lamports: u64, inventory: u32)`
- Uploads new design metadata
- Stores SHA-256 hash of image (actual image on R2)
- Sets initial pricing and inventory
- Increments designer's total designs

#### `update_price(new_price_lamports: u64)`
- Updates design pricing (designer only)
- Emits price change event
- No inventory restrictions

### Purchase Flow

#### `buy(quantity: u32)`
- Validates inventory availability
- Transfers payment from buyer to escrow
- Deducts platform fee to treasury
- Queues revenue for distribution to token holders
- Decrements inventory and updates sales stats

### Revenue Distribution

#### `distribute_to_holder(total_revenue: u64, holder_balance: u64, total_supply: u64)`
- Distributes pro-rata revenue share to individual token holder
- Called separately for each holder (batched processing)
- Transfers lamports from escrow to holder wallet
- Emits distribution event with holder details

### Fee Management

#### `withdraw_fee(amount: u64)`
- Withdraws platform fees from treasury (multisig only)
- Transfers to specified destination wallet
- Emits withdrawal event

## Data Structures

### PlatformState
```rust
pub struct PlatformState {
    pub platform_treasury: Pubkey,    // Multisig treasury address
    pub platform_fee_bps: u16,        // Fee in basis points (500 = 5%)
    pub total_designers: u64,          // Total registered designers
    pub total_designs: u64,            // Total uploaded designs
}
```

### DesignerProfile
```rust
pub struct DesignerProfile {
    pub designer: Pubkey,              // Designer's wallet address
    pub name: String,                  // Designer name (max 50 chars)
    pub ipfs_bio_uri: String,          // IPFS bio/portfolio URI (max 200 chars)
    pub token_mint: Pubkey,            // Designer's SPL token mint
    pub total_designs: u32,            // Total designs uploaded
    pub total_sales: u32,              // Total items sold
    pub created_at: i64,               // Unix timestamp
}
```

### DesignMeta
```rust
pub struct DesignMeta {
    pub designer: Pubkey,              // Designer who created this
    pub image_hash: [u8; 32],          // SHA-256 hash of image
    pub ts_unix: i64,                  // Upload timestamp (provenance)
    pub price_lamports: u64,           // Current price per item
    pub inventory: u32,                // Items remaining
    pub initial_inventory: u32,        // Original inventory
    pub mint: Pubkey,                  // Designer's token mint
    pub total_sales: u32,              // Items sold from this design
}
```

## Usage Examples

### Initialize Platform
```typescript
const client = new RackSavantClient(connection, wallet, programId);
await client.initializePlatform(treasuryPubkey, 500); // 5% fee
```

### Register Designer
```typescript
const designer = Keypair.generate();
const { txId, profilePda, tokenMintPda } = await client.registerDesigner(
  designer,
  "Fashion Designer Name",
  "ipfs://QmExampleBioHash"
);
```

### Upload Design
```typescript
const imageBuffer = fs.readFileSync('design.jpg');
const imageHash = RackSavantClient.generateImageHash(imageBuffer);
const price = new anchor.BN(2 * LAMPORTS_PER_SOL); // 2 SOL

const { txId, designMetaPda } = await client.uploadDesign(
  designer,
  imageHash,
  price,
  10 // inventory
);
```

### Purchase Item
```typescript
const buyer = Keypair.generate();
await client.buyDesign(buyer, designMetaPda, 2); // Buy 2 items
```

### Distribute Revenue
```typescript
// Get all token holders
const holders = await client.getDesignerTokenHolders(designerPubkey);

// Distribute to each holder
for (const holder of holders) {
  await client.distributeRevenue(
    designMetaPda,
    holder.holder,
    totalRevenue,
    new anchor.BN(holder.balance),
    new anchor.BN(1000000000000) // Total supply with decimals
  );
}
```

## Security Features

### Access Controls
- Designer-only operations (upload, price updates)
- Multisig treasury for fee withdrawals
- Inventory validation prevents overselling
- Token holder verification for revenue distribution

### Anti-Abuse Measures
- Fixed token supply prevents inflation
- Wash trading results in net loss due to fees
- On-chain inventory tracking prevents double-spending
- Image hash verification ensures authenticity

### Economic Security
- Platform fee ensures sustainability
- Pro-rata distribution prevents gaming
- No refund mechanism reduces dispute vectors
- Escrow system protects buyer payments

## Storage Architecture

### On-Chain Data
- Design metadata and pricing
- Token balances and ownership
- Sales history and inventory
- Platform configuration

### Off-Chain Storage (Cloudflare R2)
- High-resolution design images
- Designer portfolios and bios
- Additional metadata and assets
- Backup and redundancy systems

## Deployment Guide

### Prerequisites
```bash
# Install Rust and Solana CLI
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
npm install -g @coral-xyz/anchor-cli
```

### Build and Test
```bash
cd racksavant-contract
npm install
anchor build
anchor test
```

### Deploy to Devnet
```bash
# Configure Solana CLI
solana config set --url devnet
solana-keygen new --outfile ~/.config/solana/id.json

# Request airdrop
solana airdrop 2

# Deploy program
anchor deploy --provider.cluster devnet
```

### Deploy to Mainnet
```bash
# Configure for mainnet
solana config set --url mainnet-beta

# Deploy with production keys
anchor deploy --provider.cluster mainnet
```

## Integration Examples

### Frontend Integration
```typescript
import { RackSavantClient } from './client/racksavant-client';
import { Connection, clusterApiUrl } from '@solana/web3.js';

const connection = new Connection(clusterApiUrl('devnet'));
const client = new RackSavantClient(connection, wallet, programId);

// Get designer profile
const profile = await client.getDesignerProfile(designerPubkey);
console.log(`Designer: ${profile.name}, Designs: ${profile.totalDesigns}`);
```

### Revenue Distribution Bot
```typescript
// Automated revenue distribution service
class RevenueDistributor {
  async distributeForDesign(designMetaPda: PublicKey) {
    const designMeta = await client.getDesignMeta(designMetaPda);
    const holders = await client.getDesignerTokenHolders(designMeta.designer);
    
    const escrowBalance = await connection.getBalance(escrowPda);
    
    for (const holder of holders) {
      const share = RackSavantClient.calculateRevenueSplit(
        escrowBalance,
        holder.balance,
        1000000000000 // Total supply
      );
      
      if (share > 0) {
        await client.distributeRevenue(
          designMetaPda,
          holder.holder,
          new anchor.BN(escrowBalance),
          new anchor.BN(holder.balance),
          new anchor.BN(1000000000000)
        );
      }
    }
  }
}
```

## Events and Monitoring

### Event Types
- `DesignerRegistered`: New designer onboarded
- `DesignUploaded`: New design added to marketplace
- `PriceUpdated`: Design pricing changed
- `Sale`: Item purchased by buyer
- `RevenueDistributed`: Revenue paid to token holder
- `FeeWithdrawn`: Platform fees withdrawn

### Monitoring Setup
```typescript
// Listen for sales events
client.program.addEventListener('Sale', (event) => {
  console.log(`Sale: ${event.quantity} items for ${event.totalCost} lamports`);
  console.log(`Platform fee: ${event.platformFee} lamports`);
  console.log(`Revenue distributed: ${event.revenueDistributed} lamports`);
});
```

## Roadmap and Extensions

### Phase 2 Features
- **Automated Market Maker**: Liquidity pools for designer tokens using OpenBook v2
- **Secondary Royalties**: NFT-style receipts for physical item resales
- **ZK Receipts**: Privacy-preserving ownership verification
- **Savage Drops**: Burn tokens to unlock limited editions

### Phase 3 Integrations
- **Cross-chain Bridge**: Ethereum and Polygon compatibility
- **Mobile Wallet**: Dedicated fashion marketplace app
- **AR/VR Integration**: Virtual try-on and showroom experiences
- **DAO Governance**: Community-driven platform decisions

## Support and Contributing

### Documentation
- [API Reference](./docs/api.md)
- [Integration Guide](./docs/integration.md)
- [Security Audit](./docs/security.md)

### Community
- Discord: [RackSavant Community](https://discord.gg/racksavant)
- Twitter: [@RackSavant](https://twitter.com/racksavant)
- GitHub: [racksavant/racksavant-contract](https://github.com/racksavant/racksavant-contract)

### License
MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with 💕 for sisters supporting sisters**

*RackSavant - Where Fashion Meets DeFi*
