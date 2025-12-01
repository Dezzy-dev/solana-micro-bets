import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getConnection, loadOrCreateWallet, requestAirdrop } from './connection';
import { DiceGame } from './diceGame';

/**
 * Test script for Dice Roll Battle game
 * 
 * This script:
 * 1. Connects to local Solana validator
 * 2. Loads or creates a wallet
 * 3. Requests an airdrop
 * 4. Creates a bet
 * 5. Resolves the bet
 * 6. Displays results
 * 
 * Run with: npm run dev (or ts-node src/solana/testDice.ts)
 */

async function main() {
  console.log('🎲 Dice Roll Battle - Test Script\n');
  console.log('=' .repeat(50));

  try {
    // Step 1: Connect to local validator
    console.log('\n📡 Step 1: Connecting to local Solana validator...');
    const connection = getConnection();
    const version = await connection.getVersion();
    console.log(`✅ Connected! Solana version: ${version['solana-core']}`);

    // Step 2: Load or create wallet
    console.log('\n👛 Step 2: Loading wallet...');
    const wallet = loadOrCreateWallet();
    console.log(`✅ Wallet ready: ${wallet.publicKey.toBase58()}`);

    // Check current balance
    const initialBalance = await connection.getBalance(wallet.publicKey);
    console.log(`   Current balance: ${initialBalance / LAMPORTS_PER_SOL} SOL`);

    // Step 3: Request airdrop if balance is low
    if (initialBalance < LAMPORTS_PER_SOL) {
      console.log('\n💰 Step 3: Requesting airdrop...');
      // Request 1 SOL (devnet limit is 2 SOL per request, but 1 SOL is more reliable)
      await requestAirdrop(connection, wallet.publicKey, 1);
    } else {
      console.log('\n💰 Step 3: Sufficient balance, skipping airdrop');
    }

    // Step 4: Create DiceGame instance
    console.log('\n🎮 Step 4: Initializing Dice Roll Battle game...');
    const game = new DiceGame(connection, wallet);
    console.log('✅ Game initialized!');

    // Step 5: Create a bet
    console.log('\n🎲 Step 5: Creating bet...');
    const betAmount = 0.1; // 0.1 SOL
    const betAmountLamports = betAmount * LAMPORTS_PER_SOL;
    const bet = await game.createBet(betAmountLamports);
    
    console.log('\n📊 Bet Details:');
    console.log(`   Bet ID: ${bet.betId}`);
    console.log(`   Amount: ${bet.amount / LAMPORTS_PER_SOL} SOL`);
    console.log(`   Timestamp: ${new Date(bet.timestamp).toISOString()}`);

    // Step 6: Resolve the bet
    console.log('\n🎯 Step 6: Resolving bet...');
    const result = await game.resolveBet(bet.betId);

    // Step 7: Display final results
    console.log('\n' + '='.repeat(50));
    console.log('📈 FINAL RESULTS');
    console.log('='.repeat(50));
    console.log(`Bet ID: ${result.betId}`);
    console.log(`Player Roll: ${result.playerRoll}`);
    console.log(`House Roll: ${result.houseRoll}`);
    console.log(`Outcome: ${result.outcome.toUpperCase()}`);
    console.log(`Payout: ${result.payout / LAMPORTS_PER_SOL} SOL`);
    console.log('='.repeat(50));

    // Check final balance
    const finalBalance = await connection.getBalance(wallet.publicKey);
    console.log(`\n💰 Final wallet balance: ${finalBalance / LAMPORTS_PER_SOL} SOL`);

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Error during test:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  main();
}

export default main;

