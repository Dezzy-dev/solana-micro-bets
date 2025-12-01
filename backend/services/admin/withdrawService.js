/**
 * Service for withdrawing from house vault
 */

import { PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { verifyAdminApiKey, getHouseKeypair } from '../../utils/houseWallet.js';
import { getSolanaConnection } from '../../solana/solanaClient.js';

export async function withdrawService(body, apiKey) {
  // Check admin API key
  if (!verifyAdminApiKey(apiKey)) {
    throw new Error('Unauthorized. Valid ADMIN_API_KEY required.');
  }

  const { toPubkey, amountLamports } = body;

  // Validate input
  if (!toPubkey) {
    throw new Error('toPubkey is required');
  }
  if (!amountLamports || typeof amountLamports !== 'number' || amountLamports <= 0) {
    throw new Error('amountLamports must be a positive number');
  }

  // Validate destination pubkey format
  let toPubkeyParsed;
  try {
    toPubkeyParsed = new PublicKey(toPubkey);
  } catch (error) {
    throw new Error('Invalid toPubkey format');
  }

  // Get connection and keypair
  const connection = getSolanaConnection();
  const houseKeypair = getHouseKeypair();

  // Check house balance
  const houseBalance = await connection.getBalance(houseKeypair.publicKey);
  if (houseBalance < amountLamports) {
    const error = new Error(`Insufficient house balance. Required: ${amountLamports} lamports, Available: ${houseBalance} lamports`);
    error.houseBalanceLamports = houseBalance;
    error.houseBalanceSOL = (houseBalance / LAMPORTS_PER_SOL).toFixed(4);
    throw error;
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

  return {
    success: true,
    signature,
    amountLamports,
    toPubkey,
  };
}

