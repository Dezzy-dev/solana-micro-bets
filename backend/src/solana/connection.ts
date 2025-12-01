import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Connection configuration for Solana devnet
 */
const DEVNET_URL = 'https://api.devnet.solana.com';
const WALLET_FILE = path.join(__dirname, '../../wallet.json');

/**
 * Creates a connection to Solana devnet
 */
export function getConnection(): Connection {
  console.log(`Connecting to Solana devnet: ${DEVNET_URL}`);
  return new Connection(DEVNET_URL, 'confirmed');
}

/**
 * Loads a keypair from wallet.json or creates a new one if missing
 */
export function loadOrCreateWallet(): Keypair {
  let keypair: Keypair;

  if (fs.existsSync(WALLET_FILE)) {
    // Load existing wallet
    const walletData = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf-8'));
    const secretKey = Uint8Array.from(walletData);
    keypair = Keypair.fromSecretKey(secretKey);
    console.log(`Loaded existing wallet: ${keypair.publicKey.toBase58()}`);
  } else {
    // Create new wallet
    keypair = Keypair.generate();
    const secretKey = Array.from(keypair.secretKey);
    fs.writeFileSync(WALLET_FILE, JSON.stringify(secretKey, null, 2));
    console.log(`Created new wallet: ${keypair.publicKey.toBase58()}`);
    console.log(`Wallet saved to: ${WALLET_FILE}`);
  }

  return keypair;
}

/**
 * Requests an airdrop of SOL from devnet to the specified public key
 * Includes retry logic for rate-limited requests
 * @param connection - Solana connection
 * @param publicKey - Public key to receive the airdrop
 * @param amount - Amount in SOL (default: 1 SOL, max 2 SOL per request on devnet)
 */
export async function requestAirdrop(
  connection: Connection,
  publicKey: PublicKey,
  amount: number = 1
): Promise<string> {
  // Devnet has a limit of 2 SOL per airdrop request
  const maxAmount = 2;
  const requestAmount = Math.min(amount, maxAmount);
  const lamports = requestAmount * LAMPORTS_PER_SOL;
  
  // Get balance before airdrop
  const balanceBefore = await connection.getBalance(publicKey);
  console.log(`\n💰 Devnet Balance BEFORE airdrop: ${balanceBefore / LAMPORTS_PER_SOL} SOL`);
  console.log(`📤 Requesting airdrop of ${requestAmount} SOL from devnet to ${publicKey.toBase58()}...`);
  
  // Retry logic for airdrop requests (devnet can be rate-limited)
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        const waitTime = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
        console.log(`   ⏳ Retry attempt ${attempt}/${maxRetries} after ${waitTime/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      const signature = await connection.requestAirdrop(publicKey, lamports);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Get balance after airdrop
      const balanceAfter = await connection.getBalance(publicKey);
      console.log(`✅ Airdrop confirmed! Transaction: ${signature}`);
      console.log(`💰 Devnet Balance AFTER airdrop: ${balanceAfter / LAMPORTS_PER_SOL} SOL`);
      console.log(`📈 Balance change: +${(balanceAfter - balanceBefore) / LAMPORTS_PER_SOL} SOL`);
      
      return signature;
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || 'Unknown error';
      console.log(`   ⚠️  Attempt ${attempt} failed: ${errorMsg}`);
      
      // If it's a rate limit or internal error, retry
      if (attempt < maxRetries && (
        errorMsg.includes('Internal error') ||
        errorMsg.includes('rate limit') ||
        errorMsg.includes('429')
      )) {
        continue;
      }
      
      // For other errors or final attempt, throw
      throw error;
    }
  }
  
  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Airdrop failed after all retries');
}

