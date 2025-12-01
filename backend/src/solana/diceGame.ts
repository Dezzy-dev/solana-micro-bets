import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { Bet, BetResult } from './types';
import * as crypto from 'crypto';

/**
 * Dice Roll Battle Game
 * 
 * A micro-betting game where players roll dice against the house.
 * This is a placeholder implementation using temporary escrow addresses
 * and JavaScript randomness. Ready for Anchor upgrade on Day 3.
 */
export class DiceGame {
  private connection: Connection;
  private wallet: Keypair;
  private bets: Map<string, Bet> = new Map();

  constructor(connection: Connection, wallet: Keypair) {
    this.connection = connection;
    this.wallet = wallet;
  }

  /**
   * Creates a new bet by transferring SOL to a temporary escrow address
   * @param amountLamports - Bet amount in lamports
   * @returns Bet object with betId, amount, and timestamp
   */
  async createBet(amountLamports: number): Promise<Bet> {
    console.log(`\n🎲 Creating bet for ${amountLamports / LAMPORTS_PER_SOL} SOL...`);

    // Generate a unique bet ID
    const betId = crypto.randomBytes(32).toString('hex');
    
    // Create a temporary program-derived address (PDA) as escrow placeholder
    // In a real implementation, this would be a proper PDA derived from the program
    // For now, we'll use a simple keypair as a placeholder
    const escrowKeypair = Keypair.generate();
    const escrowPubkey = escrowKeypair.publicKey;

    // Create transaction to transfer SOL to escrow
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.wallet.publicKey,
        toPubkey: escrowPubkey,
        lamports: amountLamports,
      })
    );

    try {
      // Send and confirm transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.wallet]
      );

      console.log(`✅ Bet created! Bet ID: ${betId}`);
      console.log(`   Escrow address: ${escrowPubkey.toBase58()}`);
      console.log(`   Transaction signature: ${signature}`);

      // Store bet information
      const bet: Bet = {
        betId,
        amount: amountLamports,
        timestamp: Date.now(),
      };

      this.bets.set(betId, bet);

      // Store escrow keypair with bet (in production, this would be handled differently)
      // For now, we'll just store the bet info

      return bet;
    } catch (error) {
      console.error('❌ Error creating bet:', error);
      throw error;
    }
  }

  /**
   * Resolves a bet by rolling dice and determining the outcome
   * @param betId - The bet ID to resolve
   * @returns BetResult with rolls, outcome, and payout
   */
  async resolveBet(betId: string): Promise<BetResult> {
    console.log(`\n🎯 Resolving bet: ${betId}...`);

    const bet = this.bets.get(betId);
    if (!bet) {
      throw new Error(`Bet ${betId} not found`);
    }

    // Generate random dice rolls (1-6) using crypto for better randomness
    const playerRoll = this.rollDice();
    const houseRoll = this.rollDice();

    console.log(`   Player rolled: ${playerRoll}`);
    console.log(`   House rolled: ${houseRoll}`);

    // Determine outcome
    let outcome: "win" | "lose" | "draw";
    let payout: number;

    if (playerRoll > houseRoll) {
      outcome = "win";
      // Player wins: get back bet + winnings (2x bet)
      payout = bet.amount * 2;
    } else if (playerRoll < houseRoll) {
      outcome = "lose";
      // Player loses: no payout
      payout = 0;
    } else {
      outcome = "draw";
      // Draw: player gets bet back (no winnings)
      payout = bet.amount;
    }

    // Simulate settlement transaction
    // In a real implementation, this would transfer from escrow back to player
    // For now, we'll just log the settlement
    console.log(`   Outcome: ${outcome.toUpperCase()}`);
    console.log(`   Payout: ${payout / LAMPORTS_PER_SOL} SOL`);

    // In production, you would:
    // 1. Transfer winnings from escrow to player wallet
    // 2. Transfer house cut to house wallet (if applicable)
    // 3. Close escrow account

    const result: BetResult = {
      betId,
      playerRoll,
      houseRoll,
      outcome,
      payout,
    };

    console.log(`✅ Bet resolved!`);

    return result;
  }

  /**
   * Generates a random dice roll (1-6)
   * Uses crypto.randomInt for cryptographically secure randomness
   */
  private rollDice(): number {
    return crypto.randomInt(1, 7); // 1 to 6 inclusive
  }

  /**
   * Gets all active bets
   */
  getBets(): Bet[] {
    return Array.from(this.bets.values());
  }

  /**
   * Gets a specific bet by ID
   */
  getBet(betId: string): Bet | undefined {
    return this.bets.get(betId);
  }
}

