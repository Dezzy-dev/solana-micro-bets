/**
 * Solana connection client with caching for Vercel serverless
 */

import { Connection } from '@solana/web3.js';

const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';

// Cache the connection instance
let connection = null;

/**
 * Get or create a Solana connection instance
 * Uses singleton pattern for Vercel serverless optimization
 */
export function getSolanaConnection() {
  if (connection) {
    return connection;
  }

  connection = new Connection(RPC_URL, 'confirmed');
  return connection;
}

