/**
 * Service for getting bet history
 */

import { PublicKey } from '@solana/web3.js';
import { getBetsByWallet } from '../../db/dbHelpers.js';

export async function getHistoryService(wallet) {
  // Validate wallet format
  if (!wallet) {
    throw new Error('Wallet address is required');
  }

  // Try to validate as a Solana public key
  try {
    new PublicKey(wallet);
  } catch (error) {
    throw new Error('Invalid wallet address format');
  }

  // Get bets from database
  const bets = await getBetsByWallet(wallet, 50);

  return {
    success: true,
    bets,
    count: bets.length,
  };
}

