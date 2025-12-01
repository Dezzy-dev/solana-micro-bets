/**
 * Service for canceling bets
 */

import { PublicKey } from '@solana/web3.js';
import { getBetTimeoutSeconds } from '../../utils/houseWallet.js';

export async function cancelBetService(body) {
  const { pda, createdAtTimestamp } = body;

  // Validate input
  if (!pda) {
    throw new Error('pda is required');
  }

  // Parse PDA public key
  try {
    new PublicKey(pda);
  } catch (error) {
    throw new Error('Invalid pda format');
  }

  // Note: Cancellation requires a Solana program to transfer funds from PDA accounts.
  // Without a program, we cannot transfer from a SystemProgram-owned account.
  // This service returns an error indicating it's not implemented.
  
  throw new Error('Cancellation requires a Solana program to transfer funds from PDA accounts. Without a program, we cannot transfer from a SystemProgram-owned account. Please implement a program or use an alternative account structure.');
}

