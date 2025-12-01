/**
 * POST /api/bet/create
 * Creates a new bet transaction (unsigned, for player to sign)
 */

import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createBetTransaction } from '../lib/gameLogic.js';
import { insertBet, getOrCreateUser } from '../lib/dbHelpers.js';

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
    const { playerPubkey, amountLamports, nonce } = req.body;

    // Validate input
    if (!playerPubkey) {
      return res.status(400).json({
        success: false,
        error: 'playerPubkey is required',
      });
    }
    if (!amountLamports || typeof amountLamports !== 'number' || amountLamports <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amountLamports must be a positive number',
      });
    }
    if (nonce === undefined || typeof nonce !== 'number' || nonce < 0 || nonce > 255) {
      return res.status(400).json({
        success: false,
        error: 'nonce must be a number between 0 and 255',
      });
    }

    // Parse player public key
    let playerPubkeyParsed;
    try {
      playerPubkeyParsed = new PublicKey(playerPubkey);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid playerPubkey format',
      });
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

    res.json({
      success: true,
      transaction,
      pda: pdaAddress,
      bump,
    });
  } catch (error) {
    console.error('Error creating bet:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create bet transaction',
    });
  }
}

