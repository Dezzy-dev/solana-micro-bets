/**
 * Service for resolving bets
 */

import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { generateRoll, resolveBetTransaction } from './gameLogic.js';
import { getBetByBetId, updateBetByBetId } from '../../db/dbHelpers.js';
import { getOrCreateUser, incrementUserWin, incrementUserLoss, addToUserEarnings } from '../../db/dbHelpers.js';
import { getHouseKeypair } from '../../utils/houseWallet.js';
import { getSolanaConnection } from '../../solana/solanaClient.js';

export async function resolveBetService(body) {
  const { pda, playerRoll } = body;

  // Validate input
  if (!pda) {
    throw new Error('pda is required');
  }
  if (playerRoll === undefined || typeof playerRoll !== 'number' || playerRoll < 1 || playerRoll > 6) {
    throw new Error('playerRoll must be a number between 1 and 6');
  }

  // Generate house roll SERVER-SIDE (secure, can't be manipulated by client)
  const houseRoll = generateRoll();
  console.log(`🎲 Server-generated house roll: ${houseRoll} (Player roll: ${playerRoll})`);

  // Parse PDA public key
  let pdaParsed;
  try {
    pdaParsed = new PublicKey(pda);
  } catch (error) {
    throw new Error('Invalid pda format');
  }

  // Get escrow data from database
  const betRecord = await getBetByBetId(pda);
  if (!betRecord) {
    throw new Error(`Bet not found for PDA: ${pda}. The bet may not have been created, or the server was restarted.`);
  }

  // Reconstruct escrow data from bet record
  const escrowData = {
    player: new PublicKey(betRecord.user_wallet),
    amount: BigInt(Math.floor(betRecord.amount * LAMPORTS_PER_SOL)),
    settled: betRecord.outcome !== null,
    nonce: betRecord.nonce || 0,
    bump: betRecord.bump || 0,
  };

  if (escrowData.settled) {
    throw new Error('Bet is already settled');
  }

  // Resolve bet (pass escrow data)
  const { signature, payout, playerWins } = await resolveBetTransaction(
    pda,
    playerRoll,
    houseRoll,
    escrowData
  );

  const playerWallet = escrowData.player.toBase58();
  const outcome = playerWins ? 'win' : 'lose';
  const payoutLamports = Number(payout);
  const payoutSOL = payoutLamports / LAMPORTS_PER_SOL;
  const betAmountSOL = betRecord.amount;

  console.log(`Resolved bet ${pda}. Player ${outcome}. Signature: ${signature}`);

  // Update bet in Supabase database
  try {
    await updateBetByBetId(pda, {
      user_roll: playerRoll,
      house_roll: houseRoll,
      outcome: outcome,
      tx_signature: signature,
    });
    console.log(`✅ Bet updated in database for PDA: ${pda}`);

    // Update user statistics
    try {
      // Ensure user exists
      await getOrCreateUser(playerWallet);

      if (playerWins) {
        // Player wins: increment wins and add payout to total_earned
        await incrementUserWin(playerWallet);
        await addToUserEarnings(playerWallet, payoutSOL);
        console.log(`✅ Updated user stats: ${playerWallet} - Win, +${payoutSOL} SOL`);
      } else {
        // Player loses: increment losses and subtract bet amount from total_earned
        await incrementUserLoss(playerWallet);
        await addToUserEarnings(playerWallet, -betAmountSOL);
        console.log(`✅ Updated user stats: ${playerWallet} - Loss, -${betAmountSOL} SOL`);
      }
    } catch (userError) {
      console.error('⚠️  Failed to update user stats:', userError.message);
      // Don't fail the response - bet resolution was successful
    }
  } catch (dbError) {
    console.error('⚠️  Failed to update bet in database:', dbError.message);
    // Don't fail the response - Solana transaction was successful
  }

  return {
    success: true,
    signature,
    payout: payout.toString(),
    playerWins,
    playerRoll,
    houseRoll,
    totalRoll: playerRoll + houseRoll,
  };
}

