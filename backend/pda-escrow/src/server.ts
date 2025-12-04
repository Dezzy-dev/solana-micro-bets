// Load environment variables first, before any other imports
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env file from backend directory (parent of pda-escrow)
// Try multiple locations: first from backend/.env, then fallback to local .env
const backendEnvPath = path.join(__dirname, '../../.env');
const localEnvPath = path.join(__dirname, '../.env');

// Load from backend/.env if it exists, otherwise try local .env
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else {
  // Fallback to default location (current working directory)
  dotenv.config();
}

import express, { Request, Response } from 'express';
import cors from 'cors';
import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getConfig } from './config';
import { createBetTransaction, resolveBet, cancelBet } from './escrow';
import { generateRoll, EscrowAccountData, deserializeEscrowData } from './utils';
import { 
  getHousePubkey, 
  getHouseBalance, 
  depositToVault, 
  withdrawFromVault, 
  ensureLiquidity 
} from './house';
import { logHouseTransaction } from './houseLogger';
import adminRoutes from './routes/adminRoutes';
import {
  insertBet,
  updateBetByBetId,
  getBetsByWallet,
  getLeaderboard,
  getOrCreateUser,
  incrementUserWin,
  incrementUserLoss,
  addToUserEarnings,
} from './db/betHelpers';

const app = express();
app.use(cors({
  origin: 'http://localhost:5173', // Allow requests from Vite dev server
  credentials: true
}));
app.use(express.json());

// Mount admin routes at /admin prefix
// Routes will be available at /admin/house/balance, /admin/house/deposit, /admin/house/withdraw
app.use('/admin', adminRoutes);

// Initialize connection and config
const config = getConfig();
const connection = new Connection(config.rpcUrl, 'confirmed');

// In-memory storage for escrow data (since we can't write to PDA account data without a program)
// Map<PDA address (string) -> EscrowAccountData>
const escrowDataStore = new Map<string, EscrowAccountData>();

/**
 * Ensures the house account has sufficient balance by requesting an airdrop if needed
 * Only works on devnet/testnet
 * 
 * Note: Maximum payout = 0.5 SOL (max bet) * 5.5x = 2.75 SOL
 * So we need at least 3 SOL to cover maximum bets, but 2 SOL works for smaller bets
 */
async function ensureHouseBalance(connection: Connection, housePubkey: PublicKey, rpcUrl: string, minBalanceSOL: number = 1): Promise<void> {
  const balance = await connection.getBalance(housePubkey);
  const balanceSOL = balance / LAMPORTS_PER_SOL;
  
  // Calculate recommended balance (max payout + buffer)
  const maxBetSOL = 0.5; // Maximum bet amount
  const maxPayoutSOL = maxBetSOL * 5.5; // 5.5x multiplier
  const recommendedBalanceSOL = maxPayoutSOL + 0.5; // Add 0.5 SOL buffer = ~3.25 SOL
  
  console.log(`💰 House balance: ${balanceSOL.toFixed(4)} SOL`);
  console.log(`   Recommended: ${recommendedBalanceSOL.toFixed(2)} SOL (to cover max payout of ${maxPayoutSOL.toFixed(2)} SOL)`);
  
  if (balanceSOL < minBalanceSOL) {
    console.warn(`⚠️  House balance is very low (${balanceSOL.toFixed(4)} SOL). Minimum recommended: ${minBalanceSOL} SOL`);
  } else if (balanceSOL < recommendedBalanceSOL) {
    console.warn(`⚠️  House balance may be insufficient for maximum bets. Current: ${balanceSOL.toFixed(4)} SOL, Recommended: ${recommendedBalanceSOL.toFixed(2)} SOL`);
    console.log(`   Small bets will work fine. For max bets (0.5 SOL), please fund to at least ${recommendedBalanceSOL.toFixed(2)} SOL`);
  }
  
  // Only attempt airdrop if balance is very low (< 1 SOL)
  if (balanceSOL < minBalanceSOL) {
    // Check if we're on devnet/testnet by checking the RPC URL
    const rpcUrlLower = rpcUrl.toLowerCase();
    const isDevnet = rpcUrlLower.includes('devnet') || rpcUrlLower.includes('testnet') || rpcUrlLower.includes('localhost');
    
    if (!isDevnet) {
      console.warn(`⚠️  Not on devnet/testnet. Please manually fund the house account.`);
      return;
    }
    
    console.log(`📤 Attempting to request airdrop (may be rate-limited)...`);
    
    try {
      // Only try one airdrop request (2 SOL max per request)
      const airdropAmount = 2; // Devnet limit
      const signature = await connection.requestAirdrop(housePubkey, airdropAmount * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature, 'confirmed');
      
      const newBalance = await connection.getBalance(housePubkey);
      console.log(`✅ Airdrop successful! New balance: ${(newBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    } catch (error: any) {
      // Handle rate limiting gracefully - don't fail server startup
      if (error.message && error.message.includes('429')) {
        console.warn(`⚠️  Airdrop rate-limited (429). This is normal on devnet.`);
        console.warn(`   Your current balance (${balanceSOL.toFixed(4)} SOL) is sufficient for testing smaller bets.`);
        console.warn(`   To fund manually, visit: https://faucet.solana.com/`);
        console.warn(`   Or use CLI: solana airdrop 2 ${housePubkey.toBase58()}`);
      } else {
        console.warn(`⚠️  Airdrop failed: ${error.message}`);
        console.warn(`   Your current balance (${balanceSOL.toFixed(4)} SOL) should work for testing.`);
      }
    }
  }
  
  console.log(`✅ Server will start with current balance. House can pay winners up to ${(balanceSOL / 5.5).toFixed(4)} SOL bets.`);
}

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * POST /api/bets/create
 * Creates a new bet transaction (unsigned, for player to sign)
 */
app.post('/api/bets/create', async (req: Request, res: Response) => {
  try {
    const { playerPubkey, amountLamports, nonce } = req.body;

    // Validate input
    if (!playerPubkey) {
      return res.status(400).json({
        success: false,
        error: 'playerPubkey is required',
      });
    }
    if (!amountLamports || typeof amountLamports !== 'number' || amountLamports <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amountLamports must be a positive number',
      });
    }
    if (nonce === undefined || typeof nonce !== 'number' || nonce < 0 || nonce > 255) {
      return res.status(400).json({
        success: false,
        error: 'nonce must be a number between 0 and 255',
      });
    }

    // Parse player public key
    let playerPubkeyParsed: PublicKey;
    try {
      playerPubkeyParsed = new PublicKey(playerPubkey);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid playerPubkey format',
      });
    }

    // Create bet transaction
    const { transaction, pda, bump, data } = await createBetTransaction(
      connection,
      playerPubkeyParsed,
      amountLamports,
      nonce
    );

    // Store escrow data in memory (since we can't write to PDA account data without a program)
    const escrowData = deserializeEscrowData(data);
    escrowDataStore.set(pda.toBase58(), escrowData);

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = playerPubkeyParsed;

    // Serialize transaction to base64
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    const pdaAddress = pda.toBase58();
    const amountSOL = amountLamports / LAMPORTS_PER_SOL;
    const playerWallet = playerPubkeyParsed.toBase58();

    console.log(`Created bet transaction for player ${playerWallet}, PDA: ${pdaAddress}`);

    // Insert bet into Supabase database
    try {
      // Ensure user exists first (required for foreign key constraint)
      await getOrCreateUser(playerWallet);
      
      // Now insert the bet
      await insertBet({
        bet_id: pdaAddress, // Use PDA address as bet_id
        user_wallet: playerWallet,
        amount: amountSOL, // Store in SOL (numeric type in DB)
        bet_time: new Date(),
        // user_roll, house_roll, outcome, tx_signature will be null initially
      });
      console.log(`✅ Bet record created in database for PDA: ${pdaAddress}`);
    } catch (dbError: any) {
      // Log database error but don't fail the bet creation
      // The Solana transaction can still proceed
      console.error('⚠️  Failed to insert bet into database:', dbError.message);
      // Continue with response - bet creation on Solana is more critical
    }

    res.json({
      success: true,
      transaction: serializedTransaction.toString('base64'),
      pda: pdaAddress,
      bump,
      // Include data for reference (client may need this for off-chain tracking)
      dataSize: data.length,
    });
  } catch (error: any) {
    console.error('Error creating bet:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create bet transaction',
    });
  }
});

/**
 * POST /api/bets/resolve
 * Resolves a bet (house signs and sends transaction)
 */
app.post('/api/bets/resolve', async (req: Request, res: Response) => {
  try {
    const { pda, playerRoll } = req.body;

    // Validate input
    if (!pda) {
      return res.status(400).json({
        success: false,
        error: 'pda is required',
      });
    }
    if (playerRoll === undefined || typeof playerRoll !== 'number' || playerRoll < 1 || playerRoll > 6) {
      return res.status(400).json({
        success: false,
        error: 'playerRoll must be a number between 1 and 6',
      });
    }

    // Generate house roll SERVER-SIDE (secure, can't be manipulated by client)
    const houseRoll = generateRoll();
    console.log(`🎲 Server-generated house roll: ${houseRoll} (Player roll: ${playerRoll})`);

    // Parse PDA public key
    let pdaParsed: PublicKey;
    try {
      pdaParsed = new PublicKey(pda);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pda format',
      });
    }

    // Get escrow data from in-memory store
    const escrowData = escrowDataStore.get(pda);
    if (!escrowData) {
      return res.status(400).json({
        success: false,
        error: `Escrow data not found for PDA: ${pda}. The bet may not have been created through this server, or the server was restarted.`,
      });
    }

    // Resolve bet (pass escrow data since account data may not be initialized)
    const { signature, payout, playerWins } = await resolveBet(
      connection,
      config.houseKeypair,
      pdaParsed,
      playerRoll,
      houseRoll,
      config.winThreshold, // Pass win threshold from config
      escrowData // Pass escrow data from in-memory store
    );

    // Mark as settled in the store
    escrowData.settled = true;
    escrowDataStore.set(pda, escrowData);

    const pdaAddress = pdaParsed.toBase58();
    const playerWallet = escrowData.player.toBase58();
    const outcome: 'win' | 'lose' = playerWins ? 'win' : 'lose';
    const payoutLamports = Number(payout);
    const payoutSOL = payoutLamports / LAMPORTS_PER_SOL;
    const betAmountSOL = Number(escrowData.amount) / LAMPORTS_PER_SOL;

    console.log(`Resolved bet ${pdaAddress}. Player ${outcome}. Signature: ${signature}`);

    // Update bet in Supabase database
    try {
      await updateBetByBetId(pdaAddress, {
        user_roll: playerRoll,
        house_roll: houseRoll,
        outcome: outcome,
        tx_signature: signature,
      });
      console.log(`✅ Bet updated in database for PDA: ${pdaAddress}`);

      // Update user statistics
      try {
        // Ensure user exists
        await getOrCreateUser(playerWallet);

        if (playerWins) {
          // Player wins: increment wins and add payout to total_earned
          await incrementUserWin(playerWallet);
          await addToUserEarnings(playerWallet, payoutSOL);
          console.log(`✅ Updated user stats: ${playerWallet} - Win, +${payoutSOL} SOL`);
        } else {
          // Player loses: increment losses and subtract bet amount from total_earned
          await incrementUserLoss(playerWallet);
          await addToUserEarnings(playerWallet, -betAmountSOL);
          console.log(`✅ Updated user stats: ${playerWallet} - Loss, -${betAmountSOL} SOL`);
        }
      } catch (userError: any) {
        console.error('⚠️  Failed to update user stats:', userError.message);
        // Don't fail the response - bet resolution was successful
      }
    } catch (dbError: any) {
      console.error('⚠️  Failed to update bet in database:', dbError.message);
      // Don't fail the response - Solana transaction was successful
    }

    res.json({
      success: true,
      signature,
      payout: payout.toString(),
      playerWins,
      playerRoll, // Include player roll in response
      houseRoll,  // Include server-generated house roll in response
      totalRoll: playerRoll + houseRoll,
    });
  } catch (error: any) {
    console.error('Error resolving bet:', error);
    
    // Provide helpful error message for insufficient balance
    if (error.message && error.message.includes('insufficient balance')) {
      const houseBalance = await connection.getBalance(config.houseKeypair.publicKey);
      const rpcUrl = config.rpcUrl.toLowerCase();
      const isDevnet = rpcUrl.includes('devnet') || rpcUrl.includes('testnet');
      
      let errorMessage = error.message;
      if (isDevnet) {
        errorMessage += `\n\nThe house account needs SOL to pay winners. `;
        errorMessage += `Current balance: ${(houseBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL. `;
        errorMessage += `Please restart the server to automatically request an airdrop, `;
        errorMessage += `or manually fund: ${config.houseKeypair.publicKey.toBase58()}`;
      } else {
        errorMessage += `\n\nHouse account: ${config.houseKeypair.publicKey.toBase58()}`;
        errorMessage += `\nCurrent balance: ${(houseBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`;
      }
      
      return res.status(500).json({
        success: false,
        error: errorMessage,
        housePubkey: config.houseKeypair.publicKey.toBase58(),
        houseBalance: houseBalance.toString(),
        houseBalanceSOL: (houseBalance / LAMPORTS_PER_SOL).toFixed(4),
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resolve bet',
    });
  }
});

/**
 * POST /api/bets/cancel
 * Cancels a bet if timeout has passed
 */
app.post('/api/bets/cancel', async (req: Request, res: Response) => {
  try {
    const { pda, createdAtTimestamp } = req.body;

    // Validate input
    if (!pda) {
      return res.status(400).json({
        success: false,
        error: 'pda is required',
      });
    }

    // Parse PDA public key
    let pdaParsed: PublicKey;
    try {
      pdaParsed = new PublicKey(pda);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pda format',
      });
    }

    // Cancel bet
    // Note: This will throw an error explaining that a program is needed
    // In a real implementation, you would implement the cancellation logic
    const { signature } = await cancelBet(
      connection,
      config.houseKeypair,
      pdaParsed,
      config.betTimeoutSeconds,
      createdAtTimestamp
    );

    console.log(`Cancelled bet ${pdaParsed.toBase58()}. Signature: ${signature}`);

    res.json({
      success: true,
      signature,
    });
  } catch (error: any) {
    console.error('Error cancelling bet:', error);
    
    // If it's the expected limitation error, return it with a specific status
    if (error.message && error.message.includes('requires a program')) {
      return res.status(501).json({
        success: false,
        error: error.message,
        note: 'Cancellation requires a Solana program to transfer funds from PDA accounts.',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel bet',
    });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    rpcUrl: config.rpcUrl,
    housePubkey: config.houseKeypair.publicKey.toBase58(),
  });
});

/**
 * GET /api/history/:wallet
 * Returns latest 50 bets for a given wallet
 */
app.get('/api/history/:wallet', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;

    // Validate wallet format
    if (!wallet) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
    }

    // Try to validate as a Solana public key
    try {
      new PublicKey(wallet);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
      });
    }

    // Get bets from database
    const bets = await getBetsByWallet(wallet, 50);

    res.json({
      success: true,
      bets,
      count: bets.length,
    });
  } catch (error: any) {
    console.error('Error getting bet history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get bet history',
    });
  }
});

/**
 * GET /api/leaderboard
 * Returns top users ordered by wins (default) or earned
 * Query params:
 *   - limit: number of users to return (default: 20, max: 100)
 *   - orderBy: 'wins' or 'earned' (default: 'wins')
 */
app.get('/api/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const limitClamped = Math.min(Math.max(1, limit), 100); // Between 1 and 100
    
    const orderBy = (req.query.orderBy as string) === 'earned' ? 'earned' : 'wins';

    // Get leaderboard from database
    const leaderboard = await getLeaderboard(limitClamped, orderBy);

    res.json({
      success: true,
      leaderboard,
      count: leaderboard.length,
      orderBy,
    });
  } catch (error: any) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get leaderboard',
    });
  }
});

/**
 * GET /house/balance
 * Returns current house balance (lamports + SOL)
 */
app.get('/house/balance', async (req: Request, res: Response) => {
  try {
    const balance = await getHouseBalance(connection);
    res.json({
      success: true,
      lamports: balance.lamports,
      sol: balance.sol,
      housePubkey: getHousePubkey(),
    });
  } catch (error: any) {
    console.error('Error getting house balance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get house balance',
    });
  }
});

/**
 * GET /house/max-payout
 * Returns max payout based on house balance and safety factor
 */
app.get('/house/max-payout', async (req: Request, res: Response) => {
  try {
    const balance = await getHouseBalance(connection);
    const maxPayoutLamports = Math.floor(balance.lamports * config.safetyFactor);
    const maxPayoutSOL = maxPayoutLamports / LAMPORTS_PER_SOL;
    
    res.json({
      success: true,
      maxPayoutLamports,
      maxPayoutSOL,
      safetyFactor: config.safetyFactor,
      houseBalanceLamports: balance.lamports,
      houseBalanceSOL: balance.sol,
      housePubkey: getHousePubkey(),
    });
  } catch (error: any) {
    console.error('Error calculating max payout:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate max payout',
    });
  }
});

/**
 * POST /house/deposit
 * Deposits to house vault (for demo purposes, this is a no-op if HOUSE==vault)
 */
app.post('/house/deposit', async (req: Request, res: Response) => {
  try {
    const { amountLamports } = req.body;

    // Validate input
    if (!amountLamports || typeof amountLamports !== 'number' || amountLamports <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amountLamports must be a positive number',
      });
    }

    // For simplicity, HOUSE itself is the vault, so this is essentially a no-op
    // But we still log it and return a transaction signature
    // Note: Actual deposits should be done by sending SOL to the HOUSE pubkey
    const signature = await depositToVault(connection, amountLamports);
    
    // Log the deposit
    logHouseTransaction({
      type: 'deposit',
      amountLamports,
      to: getHousePubkey(),
      from: getHousePubkey(),
      txSignature: signature,
      timestamp: new Date().toISOString(),
      note: 'Deposit to house vault (HOUSE==vault). Actual deposit should be done by sending SOL to HOUSE pubkey.',
    });

    res.json({
      success: true,
      signature,
      amountLamports,
      housePubkey: getHousePubkey(),
      note: 'For this implementation, HOUSE itself is the vault. To actually deposit, send SOL to the house pubkey shown above.',
    });
  } catch (error: any) {
    console.error('Error depositing to vault:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to deposit to vault',
    });
  }
});

/**
 * POST /house/withdraw
 * Admin-only: Withdraws from house to destination pubkey
 * Protected with ADMIN_API_KEY
 */
app.post('/house/withdraw', async (req: Request, res: Response) => {
  try {
    // Check admin API key
    const apiKey = req.headers['x-admin-api-key'] || req.body.adminApiKey;
    if (!apiKey || apiKey !== config.adminApiKey) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Valid ADMIN_API_KEY required.',
      });
    }

    const { toPubkey, amountLamports } = req.body;

    // Validate input
    if (!toPubkey) {
      return res.status(400).json({
        success: false,
        error: 'toPubkey is required',
      });
    }
    if (!amountLamports || typeof amountLamports !== 'number' || amountLamports <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amountLamports must be a positive number',
      });
    }

    // Validate destination pubkey format
    try {
      new PublicKey(toPubkey);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid toPubkey format',
      });
    }

    // Withdraw from vault
    const signature = await withdrawFromVault(connection, toPubkey, amountLamports);
    
    // Log the withdrawal
    logHouseTransaction({
      type: 'withdraw',
      amountLamports,
      to: toPubkey,
      from: getHousePubkey(),
      txSignature: signature,
      timestamp: new Date().toISOString(),
      note: 'Admin withdrawal from house vault',
    });

    console.log(`Admin withdrawal: ${amountLamports} lamports to ${toPubkey}. Signature: ${signature}`);

    res.json({
      success: true,
      signature,
      amountLamports,
      toPubkey,
    });
  } catch (error: any) {
    console.error('Error withdrawing from vault:', error);
    
    // Provide helpful error message for insufficient balance
    if (error.message && error.message.includes('Insufficient')) {
      const balance = await getHouseBalance(connection);
      return res.status(400).json({
        success: false,
        error: error.message,
        houseBalanceLamports: balance.lamports,
        houseBalanceSOL: balance.sol,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to withdraw from vault',
    });
  }
});

// Start server
const PORT = config.port;

// Initialize house balance before starting server
(async () => {
  try {
    await ensureHouseBalance(connection, config.houseKeypair.publicKey, config.rpcUrl, 1); // Minimum 1 SOL
  } catch (error) {
    console.error('Failed to check house balance:', error);
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 PDA Escrow Backend running on port ${PORT}`);
    console.log(`📡 RPC URL: ${config.rpcUrl}`);
    console.log(`🏠 House Pubkey: ${config.houseKeypair.publicKey.toBase58()}`);
    console.log(`⏱️  Bet Timeout: ${config.betTimeoutSeconds} seconds`);
    console.log(`🎲 Win Threshold: ${config.winThreshold} (Player wins if totalRoll >= ${config.winThreshold})`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  POST /api/bets/create`);
    console.log(`  POST /api/bets/resolve`);
    console.log(`  POST /api/bets/cancel`);
    console.log(`  GET  /api/history/:wallet`);
    console.log(`  GET  /api/leaderboard`);
    console.log(`  GET  /health`);
    console.log(`  GET  /house/balance`);
    console.log(`  GET  /house/max-payout`);
    console.log(`  POST /house/deposit`);
    console.log(`  POST /house/withdraw (requires ADMIN_API_KEY)`);
    console.log(`\nAdmin endpoints (requires x-api-key header):`);
    console.log(`  GET  /admin/house/balance`);
    console.log(`  POST /admin/house/deposit`);
    console.log(`  POST /admin/house/withdraw\n`);
  });
})();

