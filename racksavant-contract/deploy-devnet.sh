#!/bin/bash

# RackSavant Smart Contract Deployment Script for Devnet
echo "🚀 Deploying RackSavant Smart Contract to Devnet..."

# Set up Solana configuration for devnet
echo "📡 Configuring Solana CLI for devnet..."
solana config set --url https://api.devnet.solana.com

# Generate a new keypair if one doesn't exist
if [ ! -f ~/.config/solana/id.json ]; then
    echo "🔑 Generating new keypair..."
    solana-keygen new --outfile ~/.config/solana/id.json --no-bip39-passphrase
fi

# Request airdrop for deployment fees
echo "💰 Requesting SOL airdrop for deployment..."
solana airdrop 2
sleep 5

# Check balance
echo "💳 Current balance:"
solana balance

# Build the program
echo "🔨 Building Anchor program..."
anchor build

# Deploy to devnet
echo "🚀 Deploying to devnet..."
anchor deploy --provider.cluster devnet

# Get the program ID
PROGRAM_ID=$(solana address -k target/deploy/racksavant-keypair.json)
echo "✅ Program deployed successfully!"
echo "📋 Program ID: $PROGRAM_ID"

# Update the program ID in the client
echo "🔄 Updating program ID in client files..."
sed -i '' "s/RackSavantProgram111111111111111111111111/$PROGRAM_ID/g" client/racksavant-client.ts
sed -i '' "s/RackSavantProgram111111111111111111111111/$PROGRAM_ID/g" tests/racksavant.ts

echo "🎉 Deployment complete!"
echo "📝 Next steps:"
echo "   1. Run tests: npm test"
echo "   2. Initialize platform: node scripts/initialize-platform.js"
echo "   3. Register test designer: node scripts/register-designer.js"
