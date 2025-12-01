/**
 * Game logic utilities for bet creation and resolution
 */

import { Connection, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getHouseKeypair } from './houseWallet.js';
import { getSolanaConnection } from './solanaClient.js';

// Import crypto module
import crypto from 'crypto';

const PDA_SEED_PREFIX = 'microbet';

/**
 * Derives a PDA from seeds
 */
function derivePDA(playerPubkey, nonce) {
  const seeds = [
    Buffer.from(PDA_SEED_PREFIX),
    playerPubkey.toBuffer(),
    Buffer.from([nonce]),
  ];

  const [pda, bump] = PublicKey.findProgramAddressSync(
    seeds,
    SystemProgram.programId
  );

  return { pda, bump };
}

/**
 * Generates a random roll (1-6)
 */
export function generateRoll() {
  return crypto.randomInt(1, 7);
}

/**
 * Calculates payout for a winning bet (5.5x multiplier)
 */
function calculatePayout(amount) {
  // 5.5x = amount * 11 / 2
  const amountBigInt = BigInt(amount);
  return (amountBigInt * BigInt(11)) / BigInt(2);
}

/**
 * Create bet transaction
 */
export async function createBetTransaction(playerPubkeyString, amountLamports, nonce) {
  const connection = getSolanaConnection();
  const playerPubkey = new PublicKey(playerPubkeyString);

  // Derive PDA
  const { pda, bump } = derivePDA(playerPubkey, nonce);

  // Check if PDA already exists
  const accountInfo = await connection.getAccountInfo(pda);
  if (accountInfo !== null) {
    throw new Error(`PDA already exists: ${pda.toBase58()}`);
  }

  // Create escrow data structure
  const escrowData = {
    player: playerPubkey,
    amount: BigInt(amountLamports),
    settled: false,
    nonce,
    bump,
  };

  // Create transaction
  const transaction = new Transaction();
  const transferIx = SystemProgram.transfer({
    fromPubkey: playerPubkey,
    toPubkey: pda,
    lamports: amountLamports,
  });
  transaction.add(transferIx);

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = playerPubkey;

  // Serialize transaction
  const serializedTransaction = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });

  return {
    transaction: serializedTransaction.toString('base64'),
    pda: pda.toBase58(),
    bump,
    escrowData, // Return for storage
  };
}

/**
 * Resolve bet transaction
 */
export async function resolveBetTransaction(pdaString, playerRoll, houseRoll, escrowData) {
  const connection = getSolanaConnection();
  const houseKeypair = getHouseKeypair();
  const pda = new PublicKey(pdaString);

  // Fetch PDA account to verify it exists
  const accountInfo = await connection.getAccountInfo(pda);
  if (accountInfo === null) {
    throw new Error(`PDA account not found: ${pdaString}`);
  }

  // Verify account balance
  const accountBalance = await connection.getBalance(pda);
  const expectedAmount = typeof escrowData.amount === 'bigint' 
    ? Number(escrowData.amount) 
    : escrowData.amount;
    
  if (accountBalance < expectedAmount) {
    throw new Error(`Account balance (${accountBalance}) is less than expected bet amount (${expectedAmount})`);
  }

  if (escrowData.settled) {
    throw new Error('Bet is already settled');
  }

  // Calculate result
  const totalRoll = playerRoll + houseRoll;
  const playerWins = totalRoll >= 8; // Updated win condition

  let payout = BigInt(0);
  const transaction = new Transaction();

  if (playerWins) {
    // Calculate payout (5.5x)
    payout = calculatePayout(expectedAmount);

    // Check house balance
    const houseBalance = await connection.getBalance(houseKeypair.publicKey);
    if (houseBalance < Number(payout)) {
      throw new Error(
        `insufficient balance. Required: ${Number(payout) / LAMPORTS_PER_SOL} SOL, ` +
        `Available: ${houseBalance / LAMPORTS_PER_SOL} SOL`
      );
    }

    // Transfer payout from house to player
    const payoutIx = SystemProgram.transfer({
      fromPubkey: houseKeypair.publicKey,
      toPubkey: escrowData.player,
      lamports: Number(payout),
    });
    transaction.add(payoutIx);
  }

  // Send transaction
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [houseKeypair],
    { commitment: 'confirmed' }
  );

  return {
    signature,
    payout: playerWins ? payout : BigInt(0),
    playerWins,
  };
}
