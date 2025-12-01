/**
 * POST /api/admin/withdraw
 * Admin-only: Withdraws from house to destination pubkey
 */

import { PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { verifyAdminApiKey, getHouseKeypair } from '../lib/houseWallet.js';
import { getSolanaConnection } from '../lib/solanaClient.js';

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

    const { toPubkey, amountLamports } = req.body;

    // Validate input
    if (!toPubkey) {
      return res.status(400).json({
        success: false,
        error: 'toPubkey is required',
      });
    }
    if (!amountLamports || typeof amountLamports !== 'number' || amountLamports <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amountLamports must be a positive number',
      });
    }

    // Validate destination pubkey format
    let toPubkeyParsed;
    try {
      toPubkeyParsed = new PublicKey(toPubkey);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid toPubkey format',
      });
    }

    // Get connection and keypair
    const connection = getSolanaConnection();
    const houseKeypair = getHouseKeypair();

    // Check house balance
    const houseBalance = await connection.getBalance(houseKeypair.publicKey);
    if (houseBalance < amountLamports) {
      return res.status(400).json({
        success: false,
        error: `Insufficient house balance. Required: ${amountLamports} lamports, Available: ${houseBalance} lamports`,
        houseBalanceLamports: houseBalance,
        houseBalanceSOL: (houseBalance / LAMPORTS_PER_SOL).toFixed(4),
      });
    }

    // Create transfer transaction
    const transaction = new Transaction();
    const transferIx = SystemProgram.transfer({
      fromPubkey: houseKeypair.publicKey,
      toPubkey: toPubkeyParsed,
      lamports: amountLamports,
    });
    transaction.add(transferIx);

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = houseKeypair.publicKey;

    // Sign and send
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [houseKeypair],
      { commitment: 'confirmed' }
    );

    console.log(`Admin withdrawal: ${amountLamports} lamports to ${toPubkey}. Signature: ${signature}`);

    res.json({
      success: true,
      signature,
      amountLamports,
      toPubkey,
    });
  } catch (error) {
    console.error('Error withdrawing from vault:', error);
    
    // Provide helpful error message for insufficient balance
    if (error.message && error.message.includes('Insufficient')) {
      const connection = getSolanaConnection();
      const houseKeypair = getHouseKeypair();
      const balance = await connection.getBalance(houseKeypair.publicKey);
      return res.status(400).json({
        success: false,
        error: error.message,
        houseBalanceLamports: balance,
        houseBalanceSOL: (balance / LAMPORTS_PER_SOL).toFixed(4),
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to withdraw from vault',
    });
  }
}

