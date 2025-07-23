# RackSavant Smart Contract - Devnet Deployment & Testing Guide

## 🚀 Quick Start Deployment

Once Anchor CLI installation completes, follow these steps to deploy and test the RackSavant smart contract on Solana devnet.

### Step 1: Verify Installation
```bash
# Check if Anchor is installed
anchor --version

# If not in PATH, add it:
export PATH="$HOME/.cargo/bin:$PATH"
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.zshrc
```

### Step 2: Install Dependencies
```bash
cd racksavant-contract
npm install
```

### Step 3: Deploy to Devnet
```bash
# Make deployment script executable (already done)
chmod +x deploy-devnet.sh

# Run deployment script
./deploy-devnet.sh
```

This script will:
- Configure Solana CLI for devnet
- Generate keypair if needed
- Request SOL airdrop
- Build the Anchor program
- Deploy to devnet
- Update program IDs in client files

### Step 4: Initialize Platform
```bash
# Create keys directory
mkdir -p keys

# Initialize the platform
node scripts/initialize-platform.js
```

### Step 5: Register Test Designer
```bash
# Register a test designer
node scripts/register-designer.js "Fashion Designer 1" "ipfs://QmTestBio123"
```

### Step 6: Run Full Flow Test
```bash
# Test complete purchase flow
node scripts/test-full-flow.js
```

### Step 7: Run Anchor Tests
```bash
# Run comprehensive test suite
anchor test --skip-local-validator
```

## 📋 Manual Step-by-Step Process

If you prefer to run commands manually:

### 1. Configure Solana CLI
```bash
# Set devnet cluster
solana config set --url https://api.devnet.solana.com

# Generate keypair (if needed)
solana-keygen new --outfile ~/.config/solana/id.json --no-bip39-passphrase

# Request airdrop
solana airdrop 2

# Check balance
solana balance
```

### 2. Build and Deploy
```bash
# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Get program ID
solana address -k target/deploy/racksavant-keypair.json
```

### 3. Update Program IDs
Replace `YOUR_PROGRAM_ID_HERE` in these files with your actual program ID:
- `scripts/initialize-platform.js`
- `scripts/register-designer.js`
- `scripts/test-full-flow.js`
- `client/racksavant-client.ts`

### 4. Test Individual Functions

#### Initialize Platform
```javascript
const anchor = require("@coral-xyz/anchor");
const { Connection, clusterApiUrl } = require("@solana/web3.js");

// Your initialization code here
```

#### Register Designer
```javascript
// Designer registration with token minting
// Creates 1M tokens (90% to designer, 10% to LP)
```

#### Upload Design
```javascript
// Upload design metadata with image hash
// Set pricing and inventory
```

#### Purchase Flow
```javascript
// Buy items with automatic fee distribution
// Revenue queued for token holder distribution
```

## 🧪 Testing Scenarios

### Scenario 1: Basic Flow
1. Initialize platform ✅
2. Register designer ✅
3. Upload design ✅
4. Update price ✅
5. Purchase items ✅
6. Check balances ✅

### Scenario 2: Revenue Distribution
1. Complete basic flow
2. Get token holders list
3. Distribute revenue pro-rata
4. Verify holder balances

### Scenario 3: Error Handling
1. Try to buy more than inventory
2. Try to update price as non-designer
3. Try to withdraw fees as non-authority

## 📊 Monitoring & Verification

### Check Platform State
```bash
# View platform statistics
solana account <PLATFORM_STATE_PDA> --output json-compact
```

### Check Designer Profile
```bash
# View designer information
solana account <DESIGNER_PROFILE_PDA> --output json-compact
```

### Check Token Balances
```bash
# View token distribution
spl-token accounts <DESIGNER_TOKEN_MINT>
```

### Monitor Transactions
```bash
# View recent transactions
solana transaction-history <WALLET_ADDRESS>
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Program not found" Error
- Ensure program is deployed: `anchor deploy --provider.cluster devnet`
- Check program ID matches in all files

#### 2. "Insufficient funds" Error
- Request more SOL: `solana airdrop 2`
- Check balance: `solana balance`

#### 3. "Account not found" Error
- Ensure platform is initialized first
- Check PDA calculations are correct

#### 4. Token Account Errors
- Ensure associated token accounts are created
- Check token mint addresses

### Debug Commands
```bash
# Check Solana configuration
solana config get

# View program logs
solana logs <PROGRAM_ID>

# Check account info
solana account <ACCOUNT_ADDRESS>
```

## 📈 Performance Metrics

After successful deployment, you should see:

### Platform Metrics
- ✅ Platform initialized with 5% fee
- ✅ Treasury account created
- ✅ Fee collection working

### Designer Metrics
- ✅ Designer registered with profile
- ✅ 1M tokens minted (900K to designer, 100K to LP)
- ✅ Token accounts created

### Transaction Metrics
- ✅ Design upload successful
- ✅ Price updates working
- ✅ Purchase flow complete
- ✅ Revenue distribution ready

### Financial Metrics
- ✅ Platform fees collected (5% of sales)
- ✅ Revenue escrowed for token holders
- ✅ Inventory tracking accurate

## 🎯 Next Steps

Once testing is complete:

1. **Frontend Integration**: Use the TypeScript client library
2. **Revenue Distribution Bot**: Automate token holder payouts
3. **Image Storage**: Integrate with Cloudflare R2
4. **Monitoring Dashboard**: Track platform metrics
5. **Mainnet Deployment**: Deploy for production use

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Anchor and Solana documentation
3. Check program logs for detailed error messages
4. Verify all account addresses and PDAs

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ All scripts run without errors
- ✅ Token balances show correct distribution
- ✅ Platform fees are collected
- ✅ Revenue is escrowed for distribution
- ✅ Inventory decrements correctly
- ✅ All events are emitted properly

Ready to revolutionize fashion with blockchain technology! 🚀✨
