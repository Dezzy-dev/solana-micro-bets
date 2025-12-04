/**
 * POST /api/resolve-bet
 * Resolves a bet (house signs and sends transaction)
 */

import { resolveBetService } from '../backend/services/bet/resolveBetService.js';
import { getHouseKeypair } from '../backend/utils/houseWallet.js';
import { getSolanaConnection } from '../backend/solana/solanaClient.js';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const result = await resolveBetService(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Resolve Bet Error:', error);
    
    // Handle validation errors
    if (error.message.includes('required') || error.message.includes('must be') || error.message.includes('Invalid') || error.message.includes('not found') || error.message.includes('already settled')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    
    // Handle insufficient balance error with helpful message
    if (error.message && error.message.includes('insufficient balance')) {
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
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to resolve bet',
    });
  }
}

