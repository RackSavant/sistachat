import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Racksavant } from "../target/types/racksavant";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { assert } from "chai";

describe("racksavant", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Racksavant as Program<Racksavant>;
  const provider = anchor.getProvider();

  // Test accounts
  let platformAuthority: Keypair;
  let platformTreasury: Keypair;
  let designer1: Keypair;
  let designer2: Keypair;
  let buyer1: Keypair;
  let buyer2: Keypair;

  // PDAs
  let platformStatePda: PublicKey;
  let designer1ProfilePda: PublicKey;
  let designer1TokenMintPda: PublicKey;
  let designer1TokenAccount: PublicKey;
  let designer1LpTokenAccount: PublicKey;

  before(async () => {
    // Initialize test accounts
    platformAuthority = Keypair.generate();
    platformTreasury = Keypair.generate();
    designer1 = Keypair.generate();
    designer2 = Keypair.generate();
    buyer1 = Keypair.generate();
    buyer2 = Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(platformAuthority.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(designer1.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(designer2.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(buyer1.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(buyer2.publicKey, 10 * LAMPORTS_PER_SOL);

    // Wait for airdrops to confirm
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Calculate PDAs
    [platformStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_state")],
      program.programId
    );

    [designer1ProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("designer_profile"), designer1.publicKey.toBuffer()],
      program.programId
    );

    [designer1TokenMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("designer_mint"), designer1.publicKey.toBuffer()],
      program.programId
    );

    designer1TokenAccount = await getAssociatedTokenAddress(
      designer1TokenMintPda,
      designer1.publicKey
    );

    designer1LpTokenAccount = await getAssociatedTokenAddress(
      designer1TokenMintPda,
      platformStatePda,
      true
    );
  });

  it("Initialize platform", async () => {
    const platformFeeBps = 500; // 5%

    await program.methods
      .initializePlatform(platformFeeBps)
      .accounts({
        platformState: platformStatePda,
        platformTreasury: platformTreasury.publicKey,
        authority: platformAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([platformAuthority])
      .rpc();

    // Verify platform state
    const platformState = await program.account.platformState.fetch(platformStatePda);
    assert.equal(platformState.platformFeeBps, platformFeeBps);
    assert.equal(platformState.totalDesigners.toNumber(), 0);
    assert.equal(platformState.totalDesigns.toNumber(), 0);
    assert.equal(platformState.platformTreasury.toString(), platformTreasury.publicKey.toString());
  });

  it("Register designer", async () => {
    const name = "Fashion Designer 1";
    const ipfsBioUri = "ipfs://QmExampleHash123456789";

    await program.methods
      .registerDesigner(name, ipfsBioUri)
      .accounts({
        designerProfile: designer1ProfilePda,
        designerTokenMint: designer1TokenMintPda,
        designerTokenAccount: designer1TokenAccount,
        lpTokenAccount: designer1LpTokenAccount,
        platformState: platformStatePda,
        designer: designer1.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([designer1])
      .rpc();

    // Verify designer profile
    const designerProfile = await program.account.designerProfile.fetch(designer1ProfilePda);
    assert.equal(designerProfile.name, name);
    assert.equal(designerProfile.ipfsBioUri, ipfsBioUri);
    assert.equal(designerProfile.totalDesigns, 0);
    assert.equal(designerProfile.totalSales, 0);
    assert.equal(designerProfile.designer.toString(), designer1.publicKey.toString());

    // Verify token mint and distribution
    const mintInfo = await provider.connection.getParsedAccountInfo(designer1TokenMintPda);
    const mintData = mintInfo.value?.data as any;
    assert.equal(mintData.parsed.info.supply, "1000000000000"); // 1M tokens with 6 decimals

    // Verify designer token balance (90%)
    const designerTokenBalance = await provider.connection.getTokenAccountBalance(designer1TokenAccount);
    assert.equal(designerTokenBalance.value.amount, "900000000000"); // 900K tokens

    // Verify LP token balance (10%)
    const lpTokenBalance = await provider.connection.getTokenAccountBalance(designer1LpTokenAccount);
    assert.equal(lpTokenBalance.value.amount, "100000000000"); // 100K tokens

    // Verify platform state updated
    const platformState = await program.account.platformState.fetch(platformStatePda);
    assert.equal(platformState.totalDesigners.toNumber(), 1);
  });

  it("Upload design", async () => {
    const imageHash = Array.from(Buffer.from("test_image_hash_32_bytes_long_12", "utf8"));
    const priceLamports = new anchor.BN(1 * LAMPORTS_PER_SOL); // 1 SOL
    const inventory = 10;

    const [designMetaPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("design_meta"),
        designer1.publicKey.toBuffer(),
        Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]) // total_designs = 0
      ],
      program.programId
    );

    await program.methods
      .uploadDesign(imageHash, priceLamports, inventory)
      .accounts({
        designMeta: designMetaPda,
        designerProfile: designer1ProfilePda,
        platformState: platformStatePda,
        designer: designer1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([designer1])
      .rpc();

    // Verify design metadata
    const designMeta = await program.account.designMeta.fetch(designMetaPda);
    assert.equal(designMeta.designer.toString(), designer1.publicKey.toString());
    assert.deepEqual(Array.from(designMeta.imageHash), imageHash);
    assert.equal(designMeta.priceLamports.toString(), priceLamports.toString());
    assert.equal(designMeta.inventory, inventory);
    assert.equal(designMeta.initialInventory, inventory);
    assert.equal(designMeta.totalSales, 0);

    // Verify designer profile updated
    const designerProfile = await program.account.designerProfile.fetch(designer1ProfilePda);
    assert.equal(designerProfile.totalDesigns, 1);

    // Verify platform state updated
    const platformState = await program.account.platformState.fetch(platformStatePda);
    assert.equal(platformState.totalDesigns.toNumber(), 1);
  });

  it("Update design price", async () => {
    const [designMetaPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("design_meta"),
        designer1.publicKey.toBuffer(),
        Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]) // design index 0
      ],
      program.programId
    );

    const newPrice = new anchor.BN(2 * LAMPORTS_PER_SOL); // 2 SOL

    await program.methods
      .updatePrice(newPrice)
      .accounts({
        designMeta: designMetaPda,
        designer: designer1.publicKey,
      })
      .signers([designer1])
      .rpc();

    // Verify price updated
    const designMeta = await program.account.designMeta.fetch(designMetaPda);
    assert.equal(designMeta.priceLamports.toString(), newPrice.toString());
  });

  it("Buy design item", async () => {
    const [designMetaPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("design_meta"),
        designer1.publicKey.toBuffer(),
        Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]) // design index 0
      ],
      program.programId
    );

    const [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), designMetaPda.toBuffer()],
      program.programId
    );

    const quantity = 2;
    const buyerBalanceBefore = await provider.connection.getBalance(buyer1.publicKey);
    const treasuryBalanceBefore = await provider.connection.getBalance(platformTreasury.publicKey);

    await program.methods
      .buy(quantity)
      .accounts({
        designMeta: designMetaPda,
        designerProfile: designer1ProfilePda,
        platformState: platformStatePda,
        escrowAccount: escrowPda,
        platformTreasury: platformTreasury.publicKey,
        buyer: buyer1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer1])
      .rpc();

    // Verify design metadata updated
    const designMeta = await program.account.designMeta.fetch(designMetaPda);
    assert.equal(designMeta.inventory, 8); // 10 - 2
    assert.equal(designMeta.totalSales, 2);

    // Verify designer profile updated
    const designerProfile = await program.account.designerProfile.fetch(designer1ProfilePda);
    assert.equal(designerProfile.totalSales, 2);

    // Verify payment and fees
    const totalCost = 2 * 2 * LAMPORTS_PER_SOL; // 2 items * 2 SOL each
    const platformFee = (totalCost * 500) / 10000; // 5% fee
    
    const buyerBalanceAfter = await provider.connection.getBalance(buyer1.publicKey);
    const treasuryBalanceAfter = await provider.connection.getBalance(platformTreasury.publicKey);

    // Buyer should have paid total cost (plus transaction fees)
    assert.isTrue(buyerBalanceBefore - buyerBalanceAfter >= totalCost);
    
    // Treasury should have received platform fee
    assert.equal(treasuryBalanceAfter - treasuryBalanceBefore, platformFee);
  });

  it("Withdraw platform fees", async () => {
    const withdrawAmount = 0.1 * LAMPORTS_PER_SOL;
    const destination = Keypair.generate();

    const treasuryBalanceBefore = await provider.connection.getBalance(platformTreasury.publicKey);

    await program.methods
      .withdrawFee(new anchor.BN(withdrawAmount))
      .accounts({
        platformState: platformStatePda,
        platformTreasury: platformTreasury.publicKey,
        destination: destination.publicKey,
        authority: platformAuthority.publicKey,
      })
      .signers([platformAuthority])
      .rpc();

    // Verify balances
    const treasuryBalanceAfter = await provider.connection.getBalance(platformTreasury.publicKey);
    const destinationBalance = await provider.connection.getBalance(destination.publicKey);

    assert.equal(treasuryBalanceBefore - treasuryBalanceAfter, withdrawAmount);
    assert.equal(destinationBalance, withdrawAmount);
  });

  it("Fails to buy with insufficient inventory", async () => {
    const [designMetaPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("design_meta"),
        designer1.publicKey.toBuffer(),
        Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]) // design index 0
      ],
      program.programId
    );

    const [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), designMetaPda.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .buy(20) // More than available inventory (8)
        .accounts({
          designMeta: designMetaPda,
          designerProfile: designer1ProfilePda,
          platformState: platformStatePda,
          escrowAccount: escrowPda,
          platformTreasury: platformTreasury.publicKey,
          buyer: buyer2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer2])
        .rpc();
      
      assert.fail("Should have failed with insufficient inventory");
    } catch (error) {
      assert.include(error.toString(), "InsufficientInventory");
    }
  });

  it("Fails to update price by non-designer", async () => {
    const [designMetaPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("design_meta"),
        designer1.publicKey.toBuffer(),
        Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]) // design index 0
      ],
      program.programId
    );

    try {
      await program.methods
        .updatePrice(new anchor.BN(3 * LAMPORTS_PER_SOL))
        .accounts({
          designMeta: designMetaPda,
          designer: buyer1.publicKey, // Wrong signer
        })
        .signers([buyer1])
        .rpc();
      
      assert.fail("Should have failed with unauthorized access");
    } catch (error) {
      assert.include(error.toString(), "has_one");
    }
  });
});
