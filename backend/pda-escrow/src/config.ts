import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Keypair } from '@solana/web3.js';

dotenv.config();

export interface Config {
  rpcUrl: string;
  port: number;
  betTimeoutSeconds: number;
  houseKeypair: Keypair;
  safetyFactor: number;
  adminApiKey: string;
}

const HOUSE_KEYPAIR_FILE = path.join(__dirname, '../house.json');

function loadHouseKeypair(): Keypair {
  if (!fs.existsSync(HOUSE_KEYPAIR_FILE)) {
    throw new Error(
      `House keypair file not found at ${HOUSE_KEYPAIR_FILE}. ` +
      `Please create a house.json file with the keypair array.`
    );
  }

  try {
    const keypairData = JSON.parse(fs.readFileSync(HOUSE_KEYPAIR_FILE, 'utf-8'));
    const secretKey = Uint8Array.from(keypairData);
    const keypair = Keypair.fromSecretKey(secretKey);
    console.log(`✅ Loaded house keypair: ${keypair.publicKey.toBase58()}`);
    return keypair;
  } catch (error: any) {
    throw new Error(`Failed to load house keypair: ${error.message}`);
  }
}

export function getConfig(): Config {
  const rpcUrl = process.env.RPC_URL || 'https://api.devnet.solana.com';
  const port = parseInt(process.env.PORT || '3001', 10);
  const betTimeoutSeconds = parseInt(process.env.BET_TIMEOUT_SECONDS || '3600', 10);
  
  // Safety factor for max payout calculation (default 0.9 = 90% of balance)
  const safetyFactor = parseFloat(process.env.DEFAULT_SAFETY_FACTOR || '0.9');
  if (isNaN(safetyFactor) || safetyFactor <= 0 || safetyFactor > 1) {
    throw new Error('DEFAULT_SAFETY_FACTOR must be a number between 0 and 1');
  }
  
  // Admin API key for protected endpoints
  const adminApiKey = process.env.ADMIN_API_KEY;
  if (!adminApiKey || adminApiKey.trim() === '') {
    throw new Error('ADMIN_API_KEY environment variable is required. Please set it in .env file.');
  }

  return {
    rpcUrl,
    port,
    betTimeoutSeconds,
    houseKeypair: loadHouseKeypair(),
    safetyFactor,
    adminApiKey: adminApiKey.trim(),
  };
}

