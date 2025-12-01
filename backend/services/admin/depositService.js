/**
 * Service for depositing to house vault
 */

import { verifyAdminApiKey, getHousePubkey } from '../../utils/houseWallet.js';

export async function depositService(body, apiKey) {
  // Check admin API key
  if (!verifyAdminApiKey(apiKey)) {
    throw new Error('Unauthorized. Valid ADMIN_API_KEY required.');
  }

  const { amountLamports } = body;

  // Validate input
  if (!amountLamports || typeof amountLamports !== 'number' || amountLamports <= 0) {
    throw new Error('amountLamports must be a positive number');
  }

  // For this implementation, HOUSE itself is the vault
  // Actual deposits should be done by sending SOL to the HOUSE pubkey
  const housePubkey = getHousePubkey();
  const dummySignature = `deposit-${Date.now()}-${amountLamports}`;

  return {
    success: true,
    signature: dummySignature,
    amountLamports,
    housePubkey,
    note: 'For this implementation, HOUSE itself is the vault. To actually deposit, send SOL to the house pubkey shown above.',
  };
}

