import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { connection, RACKSAVANT_PROGRAM_ID } from './solana-config';

export class SolanaClient {
  private connection: Connection;
  private program: Program | null = null;
  private provider: AnchorProvider | null = null;

  constructor() {
    this.connection = connection;
  }

  // Initialize with wallet
  async initialize(wallet: Wallet) {
    this.provider = new AnchorProvider(this.connection, wallet, {
      commitment: 'confirmed',
    });

    // TODO: Load RackSavant IDL dynamically when needed
    // For now, we'll handle basic wallet operations without the program
    // this.program = new Program(RackSavantIDL, RACKSAVANT_PROGRAM_ID, this.provider);
  }

  // Get wallet balance
  async getBalance(publicKey: PublicKey): Promise<number> {
    const balance = await this.connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  // Check if wallet is connected and has sufficient balance
  async isWalletReady(publicKey: PublicKey, minimumBalance = 0.01): Promise<boolean> {
    try {
      const balance = await this.getBalance(publicKey);
      return balance >= minimumBalance;
    } catch (error) {
      console.error('Error checking wallet readiness:', error);
      return false;
    }
  }

  // Basic Solana operations (no contract required)
  async sendSOL(
    fromPubkey: PublicKey,
    toPubkey: PublicKey,
    lamports: number
  ): Promise<string> {
    if (!this.provider) {
      throw new Error('Solana client not initialized');
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      })
    );

    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    // Sign and send transaction
    const signature = await this.provider.sendAndConfirm(transaction);
    return signature;
  }

  // RackSavant specific methods (placeholder for when IDL is available)
  async initializePlatform(
    platformTreasury: PublicKey,
    platformFeeBps: number = 500
  ): Promise<string> {
    throw new Error('RackSavant contract not loaded. Please deploy and configure the IDL first.');
  }

  async registerDesigner(
    designerPublicKey: PublicKey,
    name: string,
    ipfsBioUri: string
  ): Promise<{ txId: string; profilePda: PublicKey; tokenMintPda: PublicKey }> {
    throw new Error('RackSavant contract not loaded. Please deploy and configure the IDL first.');
  }

  // Utility methods
  async confirmTransaction(signature: string): Promise<boolean> {
    try {
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
      return !confirmation.value.err;
    } catch (error) {
      console.error('Error confirming transaction:', error);
      return false;
    }
  }

  async getRecentBlockhash() {
    return await this.connection.getLatestBlockhash();
  }

  // Helper to create transaction with proper fee payer
  createTransaction(instructions: any[], feePayer: PublicKey): Transaction {
    const transaction = new Transaction();
    transaction.add(...instructions);
    transaction.feePayer = feePayer;
    return transaction;
  }
}

// Singleton instance
export const solanaClient = new SolanaClient();
