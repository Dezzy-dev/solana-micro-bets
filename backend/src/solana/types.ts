/**
 * Type definitions for Dice Roll Battle game
 */

export interface Bet {
  betId: string;
  amount: number;
  timestamp: number;
}

export interface BetResult {
  betId: string;
  playerRoll: number;
  houseRoll: number;
  outcome: "win" | "lose" | "draw";
  payout: number;
}

