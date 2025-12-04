/**
 * GET /api/house/max-payout
 * Returns max payout based on house balance and safety factor
 * Public endpoint (no auth required)
 */
import { getSolanaConnection } from '../../backend/solana/solanaClient.js';
import { getHouseKeypair, getSafetyFactor } from '../../backend/utils/houseWallet.js';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const connection = getSolanaConnection();
    const houseKeypair = getHouseKeypair();
    const safetyFactor = getSafetyFactor();
    
    const balance = await connection.getBalance(houseKeypair.publicKey);
    const maxPayoutLamports = Math.floor(balance * safetyFactor);
    const maxPayoutSOL = maxPayoutLamports / LAMPORTS_PER_SOL;

    return res.status(200).json({
      success: true,
      maxPayoutLamports,
      maxPayoutSOL,
      safetyFactor,
      houseBalanceLamports: balance,
      houseBalanceSOL: balance / LAMPORTS_PER_SOL,
      housePubkey: houseKeypair.publicKey.toBase58(),
    });
  } catch (error) {
    console.error('Max Payout Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate max payout',
    });
  }
}

