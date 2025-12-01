import { Connection, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const HOUSE_KEYPAIR_FILE = path.join(__dirname, '../house.json');
const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';

/**
 * Loads house keypair from house.json file
 */
function loadHouseKeypair(): Keypair {
  if (!fs.existsSync(HOUSE_KEYPAIR_FILE)) {
    throw new Error(
      `House keypair file not found at ${HOUSE_KEYPAIR_FILE}. ` +
      `Please create a house.json file first.`
    );
  }

  const keypairData = JSON.parse(fs.readFileSync(HOUSE_KEYPAIR_FILE, 'utf-8'));
  const secretKey = Uint8Array.from(keypairData);
  return Keypair.fromSecretKey(secretKey);
}

/**
 * Requests airdrop for house keypair
 */
async function seedHouse() {
  console.log('🌱 Seeding House Account\n');
  console.log(`RPC URL: ${RPC_URL}`);
  
  const connection = new Connection(RPC_URL, 'confirmed');
  const houseKeypair = loadHouseKeypair();
  const housePubkey = houseKeypair.publicKey;
  
  console.log(`House Pubkey: ${housePubkey.toBase58()}\n`);
  
  // Check current balance
  const currentBalance = await connection.getBalance(housePubkey);
  const currentBalanceSOL = currentBalance / LAMPORTS_PER_SOL;
  
  console.log(`Current Balance: ${currentBalanceSOL.toFixed(4)} SOL (${currentBalance} lamports)\n`);
  
  // Check if on devnet/testnet
  const rpcUrlLower = RPC_URL.toLowerCase();
  const isDevnet = rpcUrlLower.includes('devnet') || rpcUrlLower.includes('testnet');
  
  if (!isDevnet && !rpcUrlLower.includes('localhost')) {
    console.log('⚠️  Not on devnet/testnet. Airdrops are only available on devnet/testnet.');
    console.log(`   Current balance: ${currentBalanceSOL.toFixed(4)} SOL`);
    console.log(`   Recommended max payout (at 0.9 safety factor): ${(currentBalanceSOL * 0.9).toFixed(4)} SOL`);
    return;
  }
  
  // Request airdrop (devnet limit is typically 2 SOL per request)
  console.log('📤 Requesting airdrop...');
  const airdropAmount = 5; // Request 5 SOL (will need multiple requests if on devnet)
  const airdropLamports = airdropAmount * LAMPORTS_PER_SOL;
  
  try {
    // Try to request airdrop (may be rate-limited)
    const signature = await connection.requestAirdrop(housePubkey, airdropLamports);
    console.log(`   Transaction signature: ${signature}`);
    
    console.log('   Waiting for confirmation...');
    await connection.confirmTransaction(signature, 'confirmed');
    
    // Check new balance
    const newBalance = await connection.getBalance(housePubkey);
    const newBalanceSOL = newBalance / LAMPORTS_PER_SOL;
    
    console.log(`\n✅ Airdrop successful!`);
    console.log(`   New Balance: ${newBalanceSOL.toFixed(4)} SOL (${newBalance} lamports)`);
    
    // Calculate recommended max payout
    const safetyFactor = parseFloat(process.env.DEFAULT_SAFETY_FACTOR || '0.9');
    const maxPayoutSOL = newBalanceSOL * safetyFactor;
    
    console.log(`\n📊 Recommended Settings:`);
    console.log(`   Safety Factor: ${safetyFactor}`);
    console.log(`   Max Payout: ${maxPayoutSOL.toFixed(4)} SOL`);
    console.log(`   This allows bets up to ${(maxPayoutSOL / 5.5).toFixed(4)} SOL (with 5.5x multiplier)`);
    
  } catch (error: any) {
    if (error.message && error.message.includes('429')) {
      console.error('\n❌ Airdrop rate-limited (429). This is normal on devnet.');
      console.error(`   Current balance: ${currentBalanceSOL.toFixed(4)} SOL`);
      console.error('\n   To seed manually, use:');
      console.error(`   solana airdrop ${airdropAmount} --url ${RPC_URL} ${housePubkey.toBase58()}`);
      console.error('\n   Or visit: https://faucet.solana.com/');
    } else {
      console.error('\n❌ Airdrop failed:', error.message);
      console.error(`   Current balance: ${currentBalanceSOL.toFixed(4)} SOL`);
    }
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  seedHouse()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

