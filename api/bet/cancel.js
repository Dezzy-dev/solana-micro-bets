/**
 * POST /api/bet/cancel
 * Cancels a bet if timeout has passed
 */

import { PublicKey } from '@solana/web3.js';
import { getBetTimeoutSeconds } from '../lib/houseWallet.js';

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
    const { pda, createdAtTimestamp } = req.body;

    // Validate input
    if (!pda) {
      return res.status(400).json({
        success: false,
        error: 'pda is required',
      });
    }

    // Parse PDA public key
    try {
      new PublicKey(pda);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pda format',
      });
    }

    // Note: Cancellation requires a Solana program to transfer funds from PDA accounts.
    // Without a program, we cannot transfer from a SystemProgram-owned account.
    // This endpoint returns a 501 Not Implemented error.
    
    return res.status(501).json({
      success: false,
      error: 'Cancellation requires a Solana program to transfer funds from PDA accounts.',
      note: 'Without a program, we cannot transfer from a SystemProgram-owned account. Please implement a program or use an alternative account structure.',
    });
  } catch (error) {
    console.error('Error cancelling bet:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel bet',
    });
  }
}

