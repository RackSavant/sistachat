import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { Racksavant } from "../target/types/racksavant";

export class RackSavantClient {
  private program: Program<Racksavant>;
  private provider: AnchorProvider;

  constructor(connection: Connection, wallet: Wallet, programId: PublicKey) {
    this.provider = new AnchorProvider(connection, wallet, {});
    this.program = new Program(require("../target/idl/racksavant.json"), programId, this.provider);
  }

  // Platform management
  async initializePlatform(
    platformTreasury: PublicKey,
    platformFeeBps: number = 500
  ): Promise<string> {
    const [platformStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_state")],
      this.program.programId
    );

    return await this.program.methods
      .initializePlatform(platformFeeBps)
      .accounts({
        platformState: platformStatePda,
        platformTreasury,
        authority: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  // Designer operations
  async registerDesigner(
    designer: Keypair,
    name: string,
    ipfsBioUri: string
  ): Promise<{ txId: string; profilePda: PublicKey; tokenMintPda: PublicKey }> {
    const [designerProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("designer_profile"), designer.publicKey.toBuffer()],
      this.program.programId
    );

    const [designerTokenMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("designer_mint"), designer.publicKey.toBuffer()],
      this.program.programId
    );

    const [platformStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_state")],
      this.program.programId
    );

    const designerTokenAccount = await getAssociatedTokenAddress(
      designerTokenMintPda,
      designer.publicKey
    );

    const lpTokenAccount = await getAssociatedTokenAddress(
      designerTokenMintPda,
      platformStatePda,
      true
    );

    const txId = await this.program.methods
      .registerDesigner(name, ipfsBioUri)
      .accounts({
        designerProfile: designerProfilePda,
        designerTokenMint: designerTokenMintPda,
        designerTokenAccount,
        lpTokenAccount,
        platformState: platformStatePda,
        designer: designer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([designer])
      .rpc();

    return { txId, profilePda: designerProfilePda, tokenMintPda: designerTokenMintPda };
  }

  async uploadDesign(
    designer: Keypair,
    imageHash: number[],
    priceLamports: anchor.BN,
    inventory: number
  ): Promise<{ txId: string; designMetaPda: PublicKey }> {
    const [designerProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("designer_profile"), designer.publicKey.toBuffer()],
      this.program.programId
    );

    const [platformStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_state")],
      this.program.programId
    );

    // Get current total designs to calculate the design index
    const platformState = await this.program.account.platformState.fetch(platformStatePda);
    const designIndex = platformState.totalDesigns;

    const [designMetaPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("design_meta"),
        designer.publicKey.toBuffer(),
        designIndex.toArrayLike(Buffer, "le", 8)
      ],
      this.program.programId
    );

    const txId = await this.program.methods
      .uploadDesign(imageHash, priceLamports, inventory)
      .accounts({
        designMeta: designMetaPda,
        designerProfile: designerProfilePda,
        platformState: platformStatePda,
        designer: designer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([designer])
      .rpc();

    return { txId, designMetaPda };
  }

  async updatePrice(
    designer: Keypair,
    designMetaPda: PublicKey,
    newPriceLamports: anchor.BN
  ): Promise<string> {
    return await this.program.methods
      .updatePrice(newPriceLamports)
      .accounts({
        designMeta: designMetaPda,
        designer: designer.publicKey,
      })
      .signers([designer])
      .rpc();
  }

  // Buying operations
  async buyDesign(
    buyer: Keypair,
    designMetaPda: PublicKey,
    quantity: number
  ): Promise<string> {
    const designMeta = await this.program.account.designMeta.fetch(designMetaPda);
    
    const [designerProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("designer_profile"), designMeta.designer.toBuffer()],
      this.program.programId
    );

    const [platformStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_state")],
      this.program.programId
    );

    const [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), designMetaPda.toBuffer()],
      this.program.programId
    );

    const platformState = await this.program.account.platformState.fetch(platformStatePda);

    return await this.program.methods
      .buy(quantity)
      .accounts({
        designMeta: designMetaPda,
        designerProfile: designerProfilePda,
        platformState: platformStatePda,
        escrowAccount: escrowPda,
        platformTreasury: platformState.platformTreasury,
        buyer: buyer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();
  }

  // Revenue distribution
  async distributeRevenue(
    designMetaPda: PublicKey,
    holderPublicKey: PublicKey,
    totalRevenue: anchor.BN,
    holderBalance: anchor.BN,
    totalSupply: anchor.BN
  ): Promise<string> {
    const designMeta = await this.program.account.designMeta.fetch(designMetaPda);
    
    const [designerTokenMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("designer_mint"), designMeta.designer.toBuffer()],
      this.program.programId
    );

    const [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), designMetaPda.toBuffer()],
      this.program.programId
    );

    const holderTokenAccount = await getAssociatedTokenAddress(
      designerTokenMintPda,
      holderPublicKey
    );

    return await this.program.methods
      .distributeToHolder(totalRevenue, holderBalance, totalSupply)
      .accounts({
        designMeta: designMetaPda,
        escrowAccount: escrowPda,
        designerTokenMint: designerTokenMintPda,
        holderTokenAccount,
        holder: holderPublicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  // Platform fee withdrawal
  async withdrawFee(
    authority: Keypair,
    destination: PublicKey,
    amount: anchor.BN
  ): Promise<string> {
    const [platformStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_state")],
      this.program.programId
    );

    const platformState = await this.program.account.platformState.fetch(platformStatePda);

    return await this.program.methods
      .withdrawFee(amount)
      .accounts({
        platformState: platformStatePda,
        platformTreasury: platformState.platformTreasury,
        destination,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();
  }

  // Utility functions
  async getDesignerProfile(designer: PublicKey) {
    const [designerProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("designer_profile"), designer.toBuffer()],
      this.program.programId
    );
    return await this.program.account.designerProfile.fetch(designerProfilePda);
  }

  async getDesignMeta(designMetaPda: PublicKey) {
    return await this.program.account.designMeta.fetch(designMetaPda);
  }

  async getPlatformState() {
    const [platformStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_state")],
      this.program.programId
    );
    return await this.program.account.platformState.fetch(platformStatePda);
  }

  async getDesignerTokenHolders(designerPublicKey: PublicKey): Promise<Array<{
    holder: PublicKey;
    balance: number;
  }>> {
    const [designerTokenMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("designer_mint"), designerPublicKey.toBuffer()],
      this.program.programId
    );

    // Get all token accounts for this mint
    const tokenAccounts = await this.provider.connection.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID,
      {
        filters: [
          {
            dataSize: 165, // Token account data size
          },
          {
            memcmp: {
              offset: 0,
              bytes: designerTokenMintPda.toBase58(),
            },
          },
        ],
      }
    );

    return tokenAccounts
      .map(account => {
        const data = account.account.data as any;
        return {
          holder: new PublicKey(data.parsed.info.owner),
          balance: parseInt(data.parsed.info.tokenAmount.amount),
        };
      })
      .filter(holder => holder.balance > 0);
  }

  // Image storage utilities
  static generateImageHash(imageBuffer: Buffer): number[] {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(imageBuffer).digest();
    return Array.from(hash);
  }

  static calculateRevenueSplit(
    totalRevenue: number,
    holderBalance: number,
    totalSupply: number
  ): number {
    if (totalSupply === 0 || holderBalance === 0) return 0;
    return Math.floor((totalRevenue * holderBalance) / totalSupply);
  }
}

// Export types for easier usage
export type DesignerProfile = anchor.IdlAccounts<Racksavant>["designerProfile"];
export type DesignMeta = anchor.IdlAccounts<Racksavant>["designMeta"];
export type PlatformState = anchor.IdlAccounts<Racksavant>["platformState"];
