const anchor = require("@coral-xyz/anchor");
const { Connection, PublicKey, Keypair, clusterApiUrl } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require("@solana/spl-token");

async function registerDesigner(designerName = "Test Designer", bioUri = "ipfs://QmTestHash") {
  console.log("👤 Registering Designer on RackSavant Platform...");

  // Connect to devnet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  
  // Load wallet
  const wallet = anchor.Wallet.local();
  
  // Set up provider
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  anchor.setProvider(provider);

  // Load the program
  const programId = new PublicKey("YOUR_PROGRAM_ID_HERE"); // Will be updated by deploy script
  const idl = require("../target/idl/racksavant.json");
  const program = new anchor.Program(idl, programId, provider);

  try {
    // Generate designer keypair
    const designer = Keypair.generate();
    console.log("🎨 Designer Wallet:", designer.publicKey.toString());

    // Airdrop SOL to designer for transaction fees
    console.log("💰 Requesting airdrop for designer...");
    await connection.requestAirdrop(designer.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for confirmation

    // Find PDAs
    const [designerProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("designer_profile"), designer.publicKey.toBuffer()],
      program.programId
    );

    const [designerTokenMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("designer_mint"), designer.publicKey.toBuffer()],
      program.programId
    );

    const [platformStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_state")],
      program.programId
    );

    // Get associated token accounts
    const { getAssociatedTokenAddress } = require("@solana/spl-token");
    
    const designerTokenAccount = await getAssociatedTokenAddress(
      designerTokenMintPda,
      designer.publicKey
    );

    const lpTokenAccount = await getAssociatedTokenAddress(
      designerTokenMintPda,
      platformStatePda,
      true
    );

    // Register designer
    const tx = await program.methods
      .registerDesigner(designerName, bioUri)
      .accounts({
        designerProfile: designerProfilePda,
        designerTokenMint: designerTokenMintPda,
        designerTokenAccount: designerTokenAccount,
        lpTokenAccount: lpTokenAccount,
        platformState: platformStatePda,
        designer: designer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([designer])
      .rpc();

    console.log("✅ Designer registered successfully!");
    console.log("📋 Transaction:", tx);
    console.log("👤 Designer Profile PDA:", designerProfilePda.toString());
    console.log("🪙 Designer Token Mint:", designerTokenMintPda.toString());
    console.log("💼 Designer Token Account:", designerTokenAccount.toString());

    // Save designer keypair for later use
    const fs = require("fs");
    if (!fs.existsSync("./keys")) {
      fs.mkdirSync("./keys");
    }
    fs.writeFileSync(
      "./keys/test-designer.json",
      JSON.stringify(Array.from(designer.secretKey))
    );
    console.log("💾 Designer keypair saved to ./keys/test-designer.json");

    // Verify token balances
    const designerBalance = await connection.getTokenAccountBalance(designerTokenAccount);
    console.log("🎨 Designer token balance:", designerBalance.value.uiAmount, "tokens (90%)");

    const lpBalance = await connection.getTokenAccountBalance(lpTokenAccount);
    console.log("🏊 LP token balance:", lpBalance.value.uiAmount, "tokens (10%)");

    return {
      designer: designer.publicKey,
      profilePda: designerProfilePda,
      tokenMintPda: designerTokenMintPda,
      transaction: tx
    };

  } catch (error) {
    console.error("❌ Error registering designer:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const designerName = process.argv[2] || "Test Fashion Designer";
  const bioUri = process.argv[3] || "ipfs://QmTestDesignerBio123456789";
  
  registerDesigner(designerName, bioUri).catch(console.error);
}

module.exports = { registerDesigner };
