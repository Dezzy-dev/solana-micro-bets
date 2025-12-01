/**
 * House wallet utilities for Vercel serverless
 */

import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Cache the house keypair
let houseKeypair = null;

/**
 * Load house keypair from environment variable
 * Expects HOUSE_KEYPAIR_SECRET_KEY as JSON array string in env
 */
export function getHouseKeypair() {
  if (houseKeypair) {
    return houseKeypair;
  }

  const houseKeypairEnv = process.env.HOUSE_KEYPAIR_SECRET_KEY;
  if (!houseKeypairEnv) {
    throw new Error(
      'HOUSE_KEYPAIR_SECRET_KEY environment variable is required. ' +
      'Set it to a JSON array string like "[1,2,3,...]".'
    );
  }

  try {
    const secretKeyArray = JSON.parse(houseKeypairEnv);
    const secretKey = Uint8Array.from(secretKeyArray);
    houseKeypair = Keypair.fromSecretKey(secretKey);
    return houseKeypair;
  } catch (error) {
    throw new Error(`Failed to load house keypair: ${error.message}`);
  }
}

/**
 * Get house public key as base58 string
 */
export function getHousePubkey() {
  return getHouseKeypair().publicKey.toBase58();
}

/**
 * Get safety factor from env (default 0.9)
 */
export function getSafetyFactor() {
  const safetyFactor = parseFloat(process.env.DEFAULT_SAFETY_FACTOR || '0.9');
  if (isNaN(safetyFactor) || safetyFactor <= 0 || safetyFactor > 1) {
    return 0.9; // Default
  }
  return safetyFactor;
}

/**
 * Get bet timeout from env (default 3600 seconds)
 */
export function getBetTimeoutSeconds() {
  return parseInt(process.env.BET_TIMEOUT_SECONDS || '3600', 10);
}

/**
 * Get admin API key from env
 */
export function getAdminApiKey() {
  const key = process.env.ADMIN_API_KEY;
  if (!key || key.trim() === '') {
    throw new Error('ADMIN_API_KEY environment variable is required');
  }
  return key.trim();
}

/**
 * Verify admin API key
 */
export function verifyAdminApiKey(providedKey) {
  if (!providedKey) {
    return false;
  }
  return providedKey === getAdminApiKey();
}

