import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import { getConfig } from './config';

/**
 * Gets the house public key as a base58 string
 */
export function getHousePubkey(): string {
  const config = getConfig();
  return config.houseKeypair.publicKey.toBase58();
}

/**
 * Gets the current house balance in lamports and SOL
 */
export async function getHouseBalance(connection: Connection): Promise<{
  lamports: number;
  sol: number;
}> {
  const config = getConfig();
  const balance = await connection.getBalance(config.houseKeypair.publicKey);
  return {
    lamports: balance,
    sol: balance / LAMPORTS_PER_SOL,
  };
}

/**
 * Deposits amount from HOUSE keypair to the house vault (for simplicity, HOUSE itself is the vault)
 * In a more complex setup, this would transfer to a separate vault account
 * For now, this is essentially a no-op that logs the deposit
 * 
 * Note: Since HOUSE itself is the vault, we don't actually need to transfer anything.
 * This function exists for API consistency and logging purposes.
 * In production, if you have a separate vault account, you would transfer here.
 */
export async function depositToVault(
  connection: Connection,
  amountLamports: number
): Promise<string> {
  const config = getConfig();
  
  // For simplicity, HOUSE itself is the vault
  // In a real implementation, you might transfer to a separate vault account
  // Since HOUSE is already the vault, there's no actual transfer needed
  // We return a dummy signature for API consistency
  // The actual deposit would need to be done externally (e.g., sending SOL to HOUSE pubkey)
  
  // Generate a dummy transaction signature for logging
  // In practice, deposits to HOUSE should be done by sending SOL directly to the HOUSE pubkey
  // This function just logs the deposit operation
  const dummySignature = `deposit-${Date.now()}-${amountLamports}`;
  
  return dummySignature;
}

/**
 * Withdraws amount from HOUSE to a destination pubkey
 * Admin-only operation
 */
export async function withdrawFromVault(
  connection: Connection,
  toPubkey: string,
  amountLamports: number
): Promise<string> {
  const config = getConfig();
  
  // Parse destination pubkey
  let toPubkeyParsed: PublicKey;
  try {
    toPubkeyParsed = new PublicKey(toPubkey);
  } catch (error) {
    throw new Error(`Invalid destination pubkey: ${toPubkey}`);
  }
  
  // Check house balance
  const houseBalance = await connection.getBalance(config.houseKeypair.publicKey);
  if (houseBalance < amountLamports) {
    throw new Error(
      `Insufficient house balance. Required: ${amountLamports} lamports, Available: ${houseBalance} lamports`
    );
  }
  
  // Create transfer transaction
  const transaction = new Transaction();
  const transferIx = SystemProgram.transfer({
    fromPubkey: config.houseKeypair.publicKey,
    toPubkey: toPubkeyParsed,
    lamports: amountLamports,
  });
  transaction.add(transferIx);
  
  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = config.houseKeypair.publicKey;
  
  // Sign and send
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [config.houseKeypair],
    { commitment: 'confirmed' }
  );
  
  return signature;
}

/**
 * Ensures the house has sufficient liquidity for a payout
 * Throws an informative error if not enough liquidity
 */
export async function ensureLiquidity(
  connection: Connection,
  requiredLamports: number
): Promise<void> {
  const balance = await getHouseBalance(connection);
  
  if (balance.lamports < requiredLamports) {
    const requiredSOL = requiredLamports / LAMPORTS_PER_SOL;
    const availableSOL = balance.sol;
    const config = getConfig();
    
    throw new Error(
      `Insufficient house bankroll. ` +
      `Required: ${requiredSOL.toFixed(4)} SOL (${requiredLamports} lamports), ` +
      `Available: ${availableSOL.toFixed(4)} SOL (${balance.lamports} lamports). ` +
      `Please deposit more SOL to the house account: ${config.houseKeypair.publicKey.toBase58()}`
    );
  }
}

