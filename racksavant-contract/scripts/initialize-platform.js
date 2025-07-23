const anchor = require("@coral-xyz/anchor");
const { Connection, PublicKey, Keypair, clusterApiUrl } = require("@solana/web3.js");

async function initializePlatform() {
  console.log("🏗️ Initializing RackSavant Platform on Devnet...");

  // Connect to devnet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  
  // Load wallet (you'll need to replace this with your actual wallet)
  const wallet = anchor.Wallet.local();
  
  // Set up provider
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  anchor.setProvider(provider);

  // Load the program
  const programId = new PublicKey("YOUR_PROGRAM_ID_HERE"); // Will be updated by deploy script
  const idl = require("../target/idl/racksavant.json");
  const program = new anchor.Program(idl, programId, provider);

  try {
    // Generate platform treasury keypair
    const platformTreasury = Keypair.generate();
    console.log("🏦 Platform Treasury:", platformTreasury.publicKey.toString());

    // Find platform state PDA
    const [platformStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_state")],
      program.programId
    );

    // Initialize platform with 5% fee (500 basis points)
    const tx = await program.methods
      .initializePlatform(500)
      .accounts({
        platformState: platformStatePda,
        platformTreasury: platformTreasury.publicKey,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Platform initialized successfully!");
    console.log("📋 Transaction:", tx);
    console.log("🏛️ Platform State PDA:", platformStatePda.toString());
    console.log("🏦 Platform Treasury:", platformTreasury.publicKey.toString());

    // Save treasury keypair for later use
    const fs = require("fs");
    fs.writeFileSync(
      "./keys/platform-treasury.json",
      JSON.stringify(Array.from(platformTreasury.secretKey))
    );
    console.log("💾 Platform treasury keypair saved to ./keys/platform-treasury.json");

  } catch (error) {
    console.error("❌ Error initializing platform:", error);
  }
}

// Run if called directly
if (require.main === module) {
  initializePlatform().catch(console.error);
}

module.exports = { initializePlatform };
