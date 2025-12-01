/**
 * GET /api/health
 * Health check endpoint
 */

import { getHousePubkey } from '../lib/houseWallet.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const rpcUrl = process.env.RPC_URL || 'https://api.devnet.solana.com';
    const housePubkey = getHousePubkey();

    res.json({
      success: true,
      status: 'healthy',
      rpcUrl,
      housePubkey,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Health check failed',
    });
  }
}

