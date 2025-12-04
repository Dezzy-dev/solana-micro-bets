/**
 * GET /api/admin/house/balance
 * Returns current house balance (lamports + SOL)
 * Requires admin API key
 */
import { getSolanaConnection } from '../../../backend/solana/solanaClient.js';
import { getHouseKeypair, verifyAdminApiKey } from '../../../backend/utils/houseWallet.js';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

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
    // Check admin API key
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (!verifyAdminApiKey(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Valid ADMIN_API_KEY required.',
      });
    }

    const connection = getSolanaConnection();
    const houseKeypair = getHouseKeypair();
    const balance = await connection.getBalance(houseKeypair.publicKey);

    return res.status(200).json({
      success: true,
      lamports: balance,
      sol: balance / LAMPORTS_PER_SOL,
      housePubkey: houseKeypair.publicKey.toBase58(),
    });
  } catch (error) {
    console.error('Get House Balance Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get house balance',
    });
  }
}

