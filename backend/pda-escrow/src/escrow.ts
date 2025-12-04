import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  derivePDA,
  serializeEscrowData,
  deserializeEscrowData,
  ACCOUNT_DATA_SIZE,
  calculatePayout,
  EscrowAccountData,
} from './utils';
import { ensureLiquidity } from './house';
import { logHouseTransaction } from './houseLogger';

/**
 * Creates an unsigned transaction for bet creation
 * The player must sign this transaction
 * 
 * Note: We transfer SOL directly to the PDA address. When SOL is transferred to
 * a PDA that doesn't exist, Solana automatically creates a basic rent-exempt account.
 * Without a custom program, we cannot initialize custom data on the PDA, so we
 * track metadata off-chain and return it separately.
 */
export async function createBetTransaction(
  connection: Connection,
  playerPubkey: PublicKey,
  amountLamports: number,
  nonce: number
): Promise<{ transaction: Transaction; pda: PublicKey; bump: number; data: Buffer }> {
  // Derive PDA
  const { pda, bump } = derivePDA(playerPubkey, nonce);

  // Check if PDA already exists
  const accountInfo = await connection.getAccountInfo(pda);
  if (accountInfo !== null) {
    throw new Error(`PDA already exists: ${pda.toBase58()}`);
  }

  // Create escrow data (tracked off-chain since we can't write to PDA without a program)
  const escrowData: EscrowAccountData = {
    player: playerPubkey,
    amount: BigInt(amountLamports),
    settled: false,
    nonce,
    bump,
  };
  const dataBuffer = serializeEscrowData(escrowData);

  // Create transaction
  const transaction = new Transaction();

  // Transfer lamports from player to PDA
  // This will automatically create a basic rent-exempt account if the PDA doesn't exist.
  // NOTE: PDAs cannot be created with SystemProgram.createAccount because they don't have
  // private keys to sign the transaction. By transferring directly, Solana will create
  // a basic account automatically. Without a custom program, we cannot write custom data
  // to this account, so we track the escrow metadata off-chain.
  const transferIx = SystemProgram.transfer({
    fromPubkey: playerPubkey,
    toPubkey: pda,
    lamports: amountLamports,
  });
  transaction.add(transferIx);

  // IMPORTANT: We cannot write custom data to a SystemProgram-owned PDA without a program.
  // The serialized escrow data is returned separately and should be tracked off-chain.
  // When reading account data in resolveBet/cancelBet, we'll use off-chain data storage.

  return {
    transaction,
    pda,
    bump,
    data: dataBuffer,
  };
}

/**
 * Initializes PDA account data after account creation
 * This is a helper function that can be called after the create transaction is confirmed.
 * Note: This requires a program to actually write the data.
 */
export async function initializePdaData(
  connection: Connection,
  pda: PublicKey,
  data: Buffer
): Promise<void> {
  // This function is a placeholder.
  // Without a program, we cannot write to account data.
  // In a real implementation, you would:
  // 1. Use a program to write the data
  // 2. Track the data off-chain
  // 3. Use a different account structure
  
  console.warn('initializePdaData: Data writing requires a program. Data will be tracked off-chain.');
}

/**
 * Resolves a bet: calculates payout, transfers funds, marks as settled
 * @param escrowData - Optional escrow data. If not provided, will try to read from account.
 *                     Use this when account data is not initialized (tracked off-chain).
 */
export async function resolveBet(
  connection: Connection,
  houseKeypair: Keypair,
  pdaPubkey: PublicKey,
  playerRoll: number,
  houseRoll: number,
  winThreshold: number,
  escrowData?: EscrowAccountData
): Promise<{ signature: string; payout: bigint; playerWins: boolean }> {
  // Fetch PDA account to verify it exists and get balance
  const accountInfo = await connection.getAccountInfo(pdaPubkey);
  if (accountInfo === null) {
    throw new Error(`PDA account not found: ${pdaPubkey.toBase58()}`);
  }

  // Get escrow data - use provided data or try to read from account
  let escrowDataFinal: EscrowAccountData;
  if (escrowData) {
    // Use provided escrow data (off-chain tracking)
    escrowDataFinal = escrowData;
    
    // Verify account balance matches bet amount
    const accountBalance = await connection.getBalance(pdaPubkey);
    if (accountBalance < Number(escrowData.amount)) {
      throw new Error(`Account balance (${accountBalance}) is less than expected bet amount (${escrowData.amount})`);
    }
  } else {
    // Try to deserialize account data
    try {
      escrowDataFinal = deserializeEscrowData(accountInfo.data);
    } catch (error) {
      // If data is not initialized, we need escrow data to be provided
      throw new Error(
        `PDA account data not initialized and escrow data not provided. ` +
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Validate
  if (escrowDataFinal.settled) {
    throw new Error('Bet is already settled');
  }

  // Calculate result
  const totalRoll = playerRoll + houseRoll;
  // Player wins if sum >= winThreshold (configurable)
  // Default threshold 9: P(win) ≈ 27.78%, P(lose) ≈ 72.22% (strong house edge)
  // Threshold 8: P(win) ≈ 41.67%, P(lose) ≈ 58.33%
  // Threshold 10: P(win) ≈ 16.67%, P(lose) ≈ 83.33%
  const playerWins = totalRoll >= winThreshold;

  let payout = BigInt(0);
  const transaction = new Transaction();

  if (playerWins) {
    // Calculate payout (5.5x)
    payout = calculatePayout(escrowDataFinal.amount);

    // Ensure house has sufficient liquidity before paying out
    await ensureLiquidity(connection, Number(payout));

    // Transfer payout from house to player
    const payoutIx = SystemProgram.transfer({
      fromPubkey: houseKeypair.publicKey,
      toPubkey: escrowDataFinal.player,
      lamports: Number(payout),
    });
    transaction.add(payoutIx);
  }

  // Mark as settled by updating account data
  // Note: Without a program, we cannot modify account data.
  // We'll track settled state off-chain or use account balance as indicator.
  // For now, we'll just transfer the payout and document the limitation.

  // Send transaction
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [houseKeypair],
    { commitment: 'confirmed' }
  );

  // Log payout transaction if player wins
  if (playerWins && payout > 0) {
    logHouseTransaction({
      type: 'payout',
      amountLamports: Number(payout),
      to: escrowDataFinal.player.toBase58(),
      from: houseKeypair.publicKey.toBase58(),
      txSignature: signature,
      timestamp: new Date().toISOString(),
      note: `Payout for bet PDA: ${pdaPubkey.toBase58()}`,
    });
  }

  console.log(`Bet resolved. Player ${playerWins ? 'wins' : 'loses'}. Payout: ${payout} lamports. Signature: ${signature}`);

  return {
    signature,
    payout: playerWins ? payout : BigInt(0),
    playerWins,
  };
}

/**
 * Cancels a bet if timeout has passed: refunds player, marks as settled
 * 
 * Note: Without a program, we cannot transfer from a SystemProgram-owned PDA.
 * This function implements the logic structure but requires a program for full functionality.
 */
export async function cancelBet(
  connection: Connection,
  houseKeypair: Keypair,
  pdaPubkey: PublicKey,
  betTimeoutSeconds: number,
  createdAtTimestamp?: number // Tracked off-chain
): Promise<{ signature: string }> {
  // Fetch PDA account
  const accountInfo = await connection.getAccountInfo(pdaPubkey);
  if (accountInfo === null) {
    throw new Error(`PDA account not found: ${pdaPubkey.toBase58()}`);
  }

  // Try to deserialize account data
  let escrowData: EscrowAccountData;
  try {
    escrowData = deserializeEscrowData(accountInfo.data);
  } catch (error) {
    throw new Error(
      `PDA account data not initialized. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Validate
  if (escrowData.settled) {
    throw new Error('Bet is already settled');
  }

  // Check timeout
  if (createdAtTimestamp) {
    const now = Math.floor(Date.now() / 1000);
    const age = now - createdAtTimestamp;
    if (age < betTimeoutSeconds) {
      throw new Error(
        `Bet cannot be cancelled yet. Timeout in ${betTimeoutSeconds - age} seconds.`
      );
    }
  } else {
    // Without created_at timestamp, we can't check timeout
    // For MVP, we'll allow cancellation if timestamp is not provided
    console.warn('Created timestamp not provided. Proceeding with cancellation.');
  }

  // Get account balance
  const accountBalance = await connection.getBalance(pdaPubkey);
  const refundAmount = escrowData.amount;

  // Note: We cannot transfer from a SystemProgram-owned PDA without a program.
  // This is a Solana limitation. To implement cancellation, you would need:
  // 1. A program that owns the PDA and can transfer funds
  // 2. Or a different account structure
  
  // For now, we'll throw an error explaining the limitation
  throw new Error(
    'Cancellation requires a program to transfer funds from PDA. ' +
    'Without a program, we cannot transfer from a SystemProgram-owned account. ' +
    'Please implement a program or use an alternative account structure.'
  );
}
