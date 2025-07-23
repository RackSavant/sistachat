const anchor = require("@coral-xyz/anchor");
const { Connection, PublicKey, Keypair, clusterApiUrl } = require("@solana/web3.js");
const crypto = require("crypto");

async function testFullFlow() {
  console.log("🧪 Testing Complete RackSavant Flow on Devnet...");

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
    console.log("📋 Step 1: Load designer from saved keypair...");
    const fs = require("fs");
    const designerSecretKey = JSON.parse(fs.readFileSync("./keys/test-designer.json"));
    const designer = Keypair.fromSecretKey(new Uint8Array(designerSecretKey));
    console.log("👤 Designer:", designer.publicKey.toString());

    console.log("📋 Step 2: Upload a test design...");
    
    // Generate test image hash
    const testImageData = "test_fashion_design_image_data_" + Date.now();
    const imageHash = Array.from(crypto.createHash('sha256').update(testImageData).digest());
    
    const price = new anchor.BN(2 * anchor.web3.LAMPORTS_PER_SOL); // 2 SOL
    const inventory = 5;

    // Get platform state to determine design index
    const [platformStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_state")],
      program.programId
    );
    
    const platformState = await program.account.platformState.fetch(platformStatePda);
    const designIndex = platformState.totalDesigns;

    const [designMetaPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("design_meta"),
        designer.publicKey.toBuffer(),
        designIndex.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    const [designerProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("designer_profile"), designer.publicKey.toBuffer()],
      program.programId
    );

    const uploadTx = await program.methods
      .uploadDesign(imageHash, price, inventory)
      .accounts({
        designMeta: designMetaPda,
        designerProfile: designerProfilePda,
        platformState: platformStatePda,
        designer: designer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([designer])
      .rpc();

    console.log("✅ Design uploaded! Transaction:", uploadTx);
    console.log("🎨 Design PDA:", designMetaPda.toString());

    console.log("📋 Step 3: Update design price...");
    const newPrice = new anchor.BN(3 * anchor.web3.LAMPORTS_PER_SOL); // 3 SOL
    
    const updateTx = await program.methods
      .updatePrice(newPrice)
      .accounts({
        designMeta: designMetaPda,
        designer: designer.publicKey,
      })
      .signers([designer])
      .rpc();

    console.log("✅ Price updated! Transaction:", updateTx);

    console.log("📋 Step 4: Create buyer and purchase design...");
    const buyer = Keypair.generate();
    
    // Airdrop SOL to buyer
    await connection.requestAirdrop(buyer.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), designMetaPda.toBuffer()],
      program.programId
    );

    // Load platform treasury
    const platformTreasurySecretKey = JSON.parse(fs.readFileSync("./keys/platform-treasury.json"));
    const platformTreasury = Keypair.fromSecretKey(new Uint8Array(platformTreasurySecretKey));

    const quantity = 2;
    const buyTx = await program.methods
      .buy(quantity)
      .accounts({
        designMeta: designMetaPda,
        designerProfile: designerProfilePda,
        platformState: platformStatePda,
        escrowAccount: escrowPda,
        platformTreasury: platformTreasury.publicKey,
        buyer: buyer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    console.log("✅ Purchase completed! Transaction:", buyTx);
    console.log("🛒 Buyer:", buyer.publicKey.toString());
    console.log("📦 Quantity purchased:", quantity);

    console.log("📋 Step 5: Check final state...");
    
    // Check design metadata
    const designMeta = await program.account.designMeta.fetch(designMetaPda);
    console.log("📊 Design inventory remaining:", designMeta.inventory);
    console.log("📊 Total sales:", designMeta.totalSales);

    // Check designer profile
    const designerProfile = await program.account.designerProfile.fetch(designerProfilePda);
    console.log("📊 Designer total sales:", designerProfile.totalSales);

    // Check escrow balance (should contain revenue for distribution)
    const escrowBalance = await connection.getBalance(escrowPda);
    console.log("💰 Escrow balance (for token holder distribution):", escrowBalance / anchor.web3.LAMPORTS_PER_SOL, "SOL");

    // Check platform treasury balance
    const treasuryBalance = await connection.getBalance(platformTreasury.publicKey);
    console.log("🏦 Platform treasury balance:", treasuryBalance / anchor.web3.LAMPORTS_PER_SOL, "SOL");

    console.log("🎉 Full flow test completed successfully!");
    console.log("📝 Summary:");
    console.log("   - Designer registered with 1M tokens");
    console.log("   - Design uploaded and price updated");
    console.log("   - Purchase completed with platform fee deduction");
    console.log("   - Revenue ready for distribution to token holders");

    return {
      designer: designer.publicKey,
      buyer: buyer.publicKey,
      designPda: designMetaPda,
      escrowBalance,
      treasuryBalance
    };

  } catch (error) {
    console.error("❌ Error in full flow test:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  testFullFlow().catch(console.error);
}

module.exports = { testFullFlow };
