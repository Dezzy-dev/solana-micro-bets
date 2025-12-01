/**
 * POST /api/admin/deposit
 * Admin-only: Deposits to house vault
 */

import { verifyAdminApiKey, getHousePubkey } from '../lib/houseWallet.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-api-key');

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
    // Check admin API key
    const apiKey = req.headers['x-admin-api-key'] || req.body.adminApiKey;
    if (!verifyAdminApiKey(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Valid ADMIN_API_KEY required.',
      });
    }

    const { amountLamports } = req.body;

    // Validate input
    if (!amountLamports || typeof amountLamports !== 'number' || amountLamports <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amountLamports must be a positive number',
      });
    }

    // For this implementation, HOUSE itself is the vault
    // Actual deposits should be done by sending SOL to the HOUSE pubkey
    const housePubkey = getHousePubkey();
    const dummySignature = `deposit-${Date.now()}-${amountLamports}`;

    res.json({
      success: true,
      signature: dummySignature,
      amountLamports,
      housePubkey,
      note: 'For this implementation, HOUSE itself is the vault. To actually deposit, send SOL to the house pubkey shown above.',
    });
  } catch (error) {
    console.error('Error depositing to vault:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to deposit to vault',
    });
  }
}

