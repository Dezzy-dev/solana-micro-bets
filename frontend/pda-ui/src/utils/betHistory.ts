/**
 * Bet History utilities for localStorage
 */

export interface BetHistoryEntry {
  id: string;
  timestamp: number;
  betAmount: number;
  playerRoll: number;
  houseRoll: number;
  result: 'win' | 'lose';
  payout?: number;
  loss?: number;
  escrowAccount?: string;
  transactionSignature?: string;
}

const STORAGE_KEY = 'cyber-dice-bet-history';
const MAX_HISTORY_ENTRIES = 100; // Keep last 100 bets

/**
 * Save a bet to history
 */
export function saveBetToHistory(bet: BetHistoryEntry): void {
  try {
    const history = getBetHistory();
    
    // Add new bet at the beginning (most recent first)
    history.unshift(bet);
    
    // Keep only the last MAX_HISTORY_ENTRIES
    const trimmedHistory = history.slice(0, MAX_HISTORY_ENTRIES);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Error saving bet to history:', error);
  }
}

/**
 * Get all bet history entries (most recent first)
 */
export function getBetHistory(): BetHistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored) as BetHistoryEntry[];
    return history.sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  } catch (error) {
    console.error('Error reading bet history:', error);
    return [];
  }
}

/**
 * Clear all bet history
 */
export function clearBetHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing bet history:', error);
  }
}

/**
 * Get bet statistics
 */
export function getBetStatistics() {
  const history = getBetHistory();
  
  if (history.length === 0) {
    return {
      totalBets: 0,
      totalWins: 0,
      totalLosses: 0,
      winRate: 0,
      totalWon: 0,
      totalLost: 0,
      netProfit: 0,
    };
  }
  
  const wins = history.filter(bet => bet.result === 'win');
  const losses = history.filter(bet => bet.result === 'lose');
  
  const totalWon = wins.reduce((sum, bet) => sum + (bet.payout || 0), 0);
  const totalLost = losses.reduce((sum, bet) => sum + (bet.loss || 0), 0);
  
  return {
    totalBets: history.length,
    totalWins: wins.length,
    totalLosses: losses.length,
    winRate: (wins.length / history.length) * 100,
    totalWon,
    totalLost,
    netProfit: totalWon - totalLost,
  };
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Shorten bet ID (PDA address)
 */
export function shortenBetId(betId: string): string {
  if (!betId || betId.length < 10) return betId;
  return `${betId.slice(0, 4)}...${betId.slice(-4)}`;
}

