/**
 * POST /api/bet/resolve
 * Resolves a bet (house signs and sends transaction)
 */

import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { generateRoll, resolveBetTransaction } from '../lib/gameLogic.js';
import { getBetByBetId, updateBetByBetId } from '../lib/dbHelpers.js';
import { getOrCreateUser, incrementUserWin, incrementUserLoss, addToUserEarnings } from '../lib/dbHelpers.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { pda, playerRoll } = req.body;

    // Validate input
    if (!pda) {
      return res.status(400).json({
        success: false,
        error: 'pda is required',
      });
    }
    if (playerRoll === undefined || typeof playerRoll !== 'number' || playerRoll < 1 || playerRoll > 6) {
      return res.status(400).json({
        success: false,
        error: 'playerRoll must be a number between 1 and 6',
      });
    }

    // Generate house roll SERVER-SIDE (secure, can't be manipulated by client)
    const houseRoll = generateRoll();
    console.log(`🎲 Server-generated house roll: ${houseRoll} (Player roll: ${playerRoll})`);

    // Parse PDA public key
    let pdaParsed;
    try {
      pdaParsed = new PublicKey(pda);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pda format',
      });
    }

    // Get escrow data from database
    const betRecord = await getBetByBetId(pda);
    if (!betRecord) {
      return res.status(400).json({
        success: false,
        error: `Bet not found for PDA: ${pda}. The bet may not have been created, or the server was restarted.`,
      });
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
      return res.status(400).json({
        success: false,
        error: 'Bet is already settled',
      });
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

    res.json({
      success: true,
      signature,
      payout: payout.toString(),
      playerWins,
      playerRoll,
      houseRoll,
      totalRoll: playerRoll + houseRoll,
    });
  } catch (error) {
    console.error('Error resolving bet:', error);
    
    // Provide helpful error message for insufficient balance
    if (error.message && error.message.includes('insufficient balance')) {
      const { getHouseKeypair } = await import('../lib/houseWallet.js');
      const { getSolanaConnection } = await import('../lib/solanaClient.js');
      
      const connection = getSolanaConnection();
      const houseKeypair = getHouseKeypair();
      const houseBalance = await connection.getBalance(houseKeypair.publicKey);
      const rpcUrl = process.env.RPC_URL || 'https://api.devnet.solana.com';
      const isDevnet = rpcUrl.toLowerCase().includes('devnet') || rpcUrl.toLowerCase().includes('testnet');
      
      let errorMessage = error.message;
      if (isDevnet) {
        errorMessage += `\n\nThe house account needs SOL to pay winners. `;
        errorMessage += `Current balance: ${(houseBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL. `;
        errorMessage += `Please fund the house account: ${houseKeypair.publicKey.toBase58()}`;
      } else {
        errorMessage += `\n\nHouse account: ${houseKeypair.publicKey.toBase58()}`;
        errorMessage += `\nCurrent balance: ${(houseBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`;
      }
      
      return res.status(500).json({
        success: false,
        error: errorMessage,
        housePubkey: houseKeypair.publicKey.toBase58(),
        houseBalance: houseBalance.toString(),
        houseBalanceSOL: (houseBalance / LAMPORTS_PER_SOL).toFixed(4),
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resolve bet',
    });
  }
}

