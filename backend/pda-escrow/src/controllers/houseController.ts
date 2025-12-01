import { Request, Response } from 'express';
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import { getConfig } from '../config';
import { getHouseBalance as getHouseBalanceService, getHousePubkey } from '../house';
import { logHouseTransaction, getAllLogs } from '../houseLogger';

/**
 * Controller function to get the current house balance
 * Returns the balance in both lamports and SOL
 */
export async function getHouseBalance(req: Request, res: Response): Promise<void> {
  try {
    const config = getConfig();
    const connection = new Connection(config.rpcUrl, 'confirmed');
    
    const balance = await getHouseBalanceService(connection);
    const housePubkey = getHousePubkey();
    
    console.log(`[House Controller] Balance requested. House balance: ${balance.sol.toFixed(4)} SOL (${balance.lamports} lamports)`);
    
    res.json({
      success: true,
      lamports: balance.lamports,
      sol: balance.sol,
      housePubkey: housePubkey,
    });
  } catch (error: any) {
    console.error('[House Controller] Error getting house balance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get house balance',
    });
  }
}

/**
 * Controller function to deposit funds to the house wallet
 * Admin-only function
 * 
 * Note: In Solana, you cannot force a transfer from another account.
 * This function can:
 * 1. Request an airdrop on devnet/testnet
 * 2. Verify that funds were received (check balance increase)
 * 
 * For actual deposits, users should send SOL directly to the house pubkey.
 */
export async function depositToHouseWallet(req: Request, res: Response): Promise<void> {
  try {
    const { amountLamports } = req.body;
    
    // Validate input
    if (!amountLamports || typeof amountLamports !== 'number' || amountLamports <= 0) {
      console.error('[House Controller] Invalid deposit amount:', amountLamports);
      res.status(400).json({
        success: false,
        error: 'amountLamports must be a positive number',
      });
      return;
    }
    
    const config = getConfig();
    const connection = new Connection(config.rpcUrl, 'confirmed');
    const houseKeypair = config.houseKeypair;
    const housePubkey = houseKeypair.publicKey;
    
    // Get current balance before deposit
    const balanceBefore = await getHouseBalanceService(connection);
    
    console.log(`[House Controller] Deposit requested: ${amountLamports} lamports (${(amountLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL)`);
    console.log(`[House Controller] Balance before: ${balanceBefore.sol.toFixed(4)} SOL`);
    
    // Check if we're on devnet/testnet for airdrop capability
    const rpcUrlLower = config.rpcUrl.toLowerCase();
    const isDevnet = rpcUrlLower.includes('devnet') || rpcUrlLower.includes('testnet') || rpcUrlLower.includes('localhost');
    
    let signature: string;
    let depositMethod: string;
    
    if (isDevnet && amountLamports <= 2 * LAMPORTS_PER_SOL) {
      // Try to request an airdrop on devnet (max 2 SOL per request)
      try {
        console.log(`[House Controller] Attempting airdrop on devnet/testnet...`);
        signature = await connection.requestAirdrop(housePubkey, amountLamports);
        await connection.confirmTransaction(signature, 'confirmed');
        depositMethod = 'airdrop';
        console.log(`[House Controller] Airdrop successful. Signature: ${signature}`);
      } catch (airdropError: any) {
        console.error('[House Controller] Airdrop failed:', airdropError.message);
        // Fall through to manual deposit note
        res.status(400).json({
          success: false,
          error: `Airdrop failed: ${airdropError.message}. Please send SOL directly to the house wallet: ${housePubkey.toBase58()}`,
          housePubkey: housePubkey.toBase58(),
          note: 'On devnet, you can also use: solana airdrop <amount> --url <rpc-url> <house-pubkey>',
        });
        return;
      }
    } else {
      // On mainnet or large amounts, deposits must be done externally
      console.warn(`[House Controller] Cannot auto-deposit. Amount: ${(amountLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      res.status(400).json({
        success: false,
        error: 'Automatic deposits are only available on devnet/testnet for amounts <= 2 SOL. Please send SOL directly to the house wallet.',
        housePubkey: housePubkey.toBase58(),
        currentBalance: {
          lamports: balanceBefore.lamports,
          sol: balanceBefore.sol,
        },
      });
      return;
    }
    
    // Get balance after deposit
    const balanceAfter = await getHouseBalanceService(connection);
    
    // Log the deposit transaction
    logHouseTransaction({
      type: 'deposit',
      amountLamports: amountLamports,
      to: housePubkey.toBase58(),
      from: 'system', // Airdrop comes from system
      txSignature: signature,
      timestamp: new Date().toISOString(),
      note: `Deposit via ${depositMethod}`,
    });
    
    console.log(`[House Controller] Deposit completed. Balance after: ${balanceAfter.sol.toFixed(4)} SOL`);
    
    res.json({
      success: true,
      signature: signature,
      amountLamports: amountLamports,
      depositMethod: depositMethod,
      balance: {
        lamports: balanceAfter.lamports,
        sol: balanceAfter.sol,
      },
      balanceBefore: {
        lamports: balanceBefore.lamports,
        sol: balanceBefore.sol,
      },
      housePubkey: housePubkey.toBase58(),
    });
  } catch (error: any) {
    console.error('[House Controller] Error depositing to house wallet:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to deposit to house wallet',
    });
  }
}

/**
 * Controller function to withdraw funds from the house wallet
 * Admin-only function
 * Transfers SOL from house wallet to the specified destination
 */
export async function withdrawFromHouseWallet(req: Request, res: Response): Promise<void> {
  try {
    const { amountLamports, toPubkey } = req.body;
    
    // Validate input
    if (!toPubkey) {
      console.error('[House Controller] Missing toPubkey in withdrawal request');
      res.status(400).json({
        success: false,
        error: 'toPubkey is required',
      });
      return;
    }
    
    if (!amountLamports || typeof amountLamports !== 'number' || amountLamports <= 0) {
      console.error('[House Controller] Invalid withdrawal amount:', amountLamports);
      res.status(400).json({
        success: false,
        error: 'amountLamports must be a positive number',
      });
      return;
    }
    
    // Validate destination pubkey format
    let toPubkeyParsed: PublicKey;
    try {
      toPubkeyParsed = new PublicKey(toPubkey);
    } catch (error) {
      console.error('[House Controller] Invalid toPubkey format:', toPubkey);
      res.status(400).json({
        success: false,
        error: `Invalid toPubkey format: ${toPubkey}`,
      });
      return;
    }
    
    const config = getConfig();
    const connection = new Connection(config.rpcUrl, 'confirmed');
    const houseKeypair = config.houseKeypair;
    const housePubkey = houseKeypair.publicKey;
    
    // Get balance before withdrawal
    const balanceBefore = await getHouseBalanceService(connection);
    
    console.log(`[House Controller] Withdrawal requested: ${amountLamports} lamports (${(amountLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL) to ${toPubkey}`);
    console.log(`[House Controller] Balance before: ${balanceBefore.sol.toFixed(4)} SOL`);
    
    // Check if house has sufficient balance
    if (balanceBefore.lamports < amountLamports) {
      const errorMsg = `Insufficient house balance. Required: ${(amountLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL (${amountLamports} lamports), Available: ${balanceBefore.sol.toFixed(4)} SOL (${balanceBefore.lamports} lamports)`;
      console.error(`[House Controller] ${errorMsg}`);
      res.status(400).json({
        success: false,
        error: errorMsg,
        balance: {
          lamports: balanceBefore.lamports,
          sol: balanceBefore.sol,
        },
        required: {
          lamports: amountLamports,
          sol: amountLamports / LAMPORTS_PER_SOL,
        },
      });
      return;
    }
    
    // Create transfer transaction
    const transaction = new Transaction();
    const transferIx = SystemProgram.transfer({
      fromPubkey: housePubkey,
      toPubkey: toPubkeyParsed,
      lamports: amountLamports,
    });
    transaction.add(transferIx);
    
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = housePubkey;
    
    // Sign and send transaction
    console.log(`[House Controller] Sending withdrawal transaction...`);
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [houseKeypair],
      { commitment: 'confirmed' }
    );
    
    console.log(`[House Controller] Withdrawal transaction sent. Signature: ${signature}`);
    
    // Get balance after withdrawal
    const balanceAfter = await getHouseBalanceService(connection);
    
    // Log the withdrawal transaction
    logHouseTransaction({
      type: 'withdraw',
      amountLamports: amountLamports,
      to: toPubkey,
      from: housePubkey.toBase58(),
      txSignature: signature,
      timestamp: new Date().toISOString(),
      note: 'Admin withdrawal from house wallet',
    });
    
    console.log(`[House Controller] Withdrawal completed. Balance after: ${balanceAfter.sol.toFixed(4)} SOL`);
    
    res.json({
      success: true,
      signature: signature,
      amountLamports: amountLamports,
      toPubkey: toPubkey,
      balance: {
        lamports: balanceAfter.lamports,
        sol: balanceAfter.sol,
      },
      balanceBefore: {
        lamports: balanceBefore.lamports,
        sol: balanceBefore.sol,
      },
      housePubkey: housePubkey.toBase58(),
    });
  } catch (error: any) {
    console.error('[House Controller] Error withdrawing from house wallet:', error);
    
    // Provide more specific error messages
    if (error.message && error.message.includes('insufficient')) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to withdraw from house wallet',
      });
    }
  }
}

/**
 * Controller function to get house profit/loss
 * Calculates from transaction logs
 */
export async function getHouseProfitLoss(req: Request, res: Response): Promise<void> {
  try {
    const logs = getAllLogs();
    const LAMPORTS_PER_SOL = 1_000_000_000;
    
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalPayouts = 0;
    
    for (const log of logs) {
      const amountSOL = log.amountLamports / LAMPORTS_PER_SOL;
      
      if (log.type === 'deposit') {
        totalDeposits += amountSOL;
      } else if (log.type === 'withdraw') {
        totalWithdrawals += amountSOL;
      } else if (log.type === 'payout') {
        totalPayouts += amountSOL;
      }
    }
    
    // Profit/Loss = Deposits - Withdrawals - Payouts
    // Positive = profit, Negative = loss
    const profitLossSOL = totalDeposits - totalWithdrawals - totalPayouts;
    
    console.log(`[House Controller] Profit/Loss calculated. Deposits: ${totalDeposits.toFixed(4)} SOL, Withdrawals: ${totalWithdrawals.toFixed(4)} SOL, Payouts: ${totalPayouts.toFixed(4)} SOL, Net: ${profitLossSOL.toFixed(4)} SOL`);
    
    res.json({
      success: true,
      profitLossSOL: profitLossSOL,
      totalDepositsSOL: totalDeposits,
      totalWithdrawalsSOL: totalWithdrawals,
      totalPayoutsSOL: totalPayouts,
    });
  } catch (error: any) {
    console.error('[House Controller] Error calculating profit/loss:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate profit/loss',
    });
  }
}

