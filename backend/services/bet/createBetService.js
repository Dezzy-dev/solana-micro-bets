/**
 * Service for creating bets
 */

import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createBetTransaction } from './gameLogic.js';
import { insertBet, getOrCreateUser } from '../../db/dbHelpers.js';

export async function createBetService(body) {
  const { playerPubkey, amountLamports, nonce } = body;

  // Validate input
  if (!playerPubkey) {
    throw new Error('playerPubkey is required');
  }
  if (!amountLamports || typeof amountLamports !== 'number' || amountLamports <= 0) {
    throw new Error('amountLamports must be a positive number');
  }
  if (nonce === undefined || typeof nonce !== 'number' || nonce < 0 || nonce > 255) {
    throw new Error('nonce must be a number between 0 and 255');
  }

  // Parse player public key
  let playerPubkeyParsed;
  try {
    playerPubkeyParsed = new PublicKey(playerPubkey);
  } catch (error) {
    throw new Error('Invalid playerPubkey format');
  }

  // Create bet transaction
  const { transaction, pda, bump, escrowData } = await createBetTransaction(
    playerPubkey,
    amountLamports,
    nonce
  );

  const pdaAddress = pda;
  const amountSOL = amountLamports / LAMPORTS_PER_SOL;
  const playerWallet = playerPubkeyParsed.toBase58();

  console.log(`Created bet transaction for player ${playerWallet}, PDA: ${pdaAddress}`);

  // Insert bet into Supabase database
  try {
    // Ensure user exists first (required for foreign key constraint)
    await getOrCreateUser(playerWallet);
    
    // Now insert the bet
    await insertBet({
      bet_id: pdaAddress,
      user_wallet: playerWallet,
      amount: amountSOL,
      bet_time: new Date(),
      nonce: escrowData.nonce,
      bump: escrowData.bump,
    });
    console.log(`✅ Bet record created in database for PDA: ${pdaAddress}`);
  } catch (dbError) {
    // Log database error but don't fail the bet creation
    console.error('⚠️  Failed to insert bet into database:', dbError.message);
    // Continue with response - bet creation on Solana is more critical
  }

  return {
    success: true,
    transaction,
    pda: pdaAddress,
    bump,
  };
}

