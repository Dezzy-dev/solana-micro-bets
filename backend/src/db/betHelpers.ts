/**
 * Database helper functions for Solana betting game
 * 
 * This file provides type-safe helper functions for interacting with
 * the bets and users tables in Supabase.
 * 
 * Note: Implementation logic will be added later.
 */

/**
 * Type definitions for database entities
 */
export interface Bet {
  id: string; // UUID
  bet_id: string | null;
  user_wallet: string;
  amount: number; // Numeric type in DB
  user_roll: number | null;
  house_roll: number | null;
  outcome: string | null; // 'win' | 'loss' | null
  tx_signature: string | null;
  bet_time: Date;
  created_at: Date;
}

export interface User {
  wallet: string;
  total_wins: number;
  total_losses: number;
  total_earned: number; // Numeric type in DB
  created_at: Date;
  updated_at: Date;
}

/**
 * Input types for creating/updating records
 */
export interface CreateBetInput {
  bet_id?: string;
  user_wallet: string;
  amount: number;
  user_roll?: number;
  house_roll?: number;
  outcome?: 'win' | 'loss';
  tx_signature?: string;
  bet_time?: Date;
}

export interface UpdateBetInput {
  user_roll?: number;
  house_roll?: number;
  outcome?: 'win' | 'loss';
  tx_signature?: string;
}

export interface UserStatsUpdate {
  total_wins?: number;
  total_losses?: number;
  total_earned?: number;
}

/**
 * Insert a new bet into the database
 * 
 * @param betData - The bet data to insert
 * @returns Promise resolving to the created bet record
 */
export async function insertBet(betData: CreateBetInput): Promise<Bet> {
  // TODO: Implement Supabase client call
  throw new Error('Not implemented');
}

/**
 * Update an existing bet with resolution data
 * 
 * @param betId - The UUID of the bet to update
 * @param updateData - The data to update
 * @returns Promise resolving to the updated bet record
 */
export async function updateBet(
  betId: string,
  updateData: UpdateBetInput
): Promise<Bet> {
  // TODO: Implement Supabase client call
  throw new Error('Not implemented');
}

/**
 * Get a bet by its ID (UUID)
 * 
 * @param betId - The UUID of the bet
 * @returns Promise resolving to the bet record or null if not found
 */
export async function getBetById(betId: string): Promise<Bet | null> {
  // TODO: Implement Supabase client call
  throw new Error('Not implemented');
}

/**
 * Get a bet by its bet_id (text identifier)
 * 
 * @param betId - The text identifier of the bet
 * @returns Promise resolving to the bet record or null if not found
 */
export async function getBetByBetId(betId: string): Promise<Bet | null> {
  // TODO: Implement Supabase client call
  throw new Error('Not implemented');
}

/**
 * Get all bets for a specific user wallet
 * 
 * @param wallet - The user's wallet address
 * @param limit - Optional limit on number of results
 * @param offset - Optional offset for pagination
 * @returns Promise resolving to an array of bet records
 */
export async function getBetsByWallet(
  wallet: string,
  limit?: number,
  offset?: number
): Promise<Bet[]> {
  // TODO: Implement Supabase client call
  throw new Error('Not implemented');
}

/**
 * Create a new user record or get existing user
 * 
 * @param wallet - The user's wallet address
 * @returns Promise resolving to the user record
 */
export async function getOrCreateUser(wallet: string): Promise<User> {
  // TODO: Implement Supabase client call with upsert logic
  throw new Error('Not implemented');
}

/**
 * Get user statistics by wallet address
 * 
 * @param wallet - The user's wallet address
 * @returns Promise resolving to the user record or null if not found
 */
export async function getUserByWallet(wallet: string): Promise<User | null> {
  // TODO: Implement Supabase client call
  throw new Error('Not implemented');
}

/**
 * Update user statistics after a bet outcome
 * 
 * @param wallet - The user's wallet address
 * @param statsUpdate - The statistics to update (wins, losses, earned)
 * @returns Promise resolving to the updated user record
 */
export async function updateUserStats(
  wallet: string,
  statsUpdate: UserStatsUpdate
): Promise<User> {
  // TODO: Implement Supabase client call with increment logic
  throw new Error('Not implemented');
}

/**
 * Increment user wins by 1
 * 
 * @param wallet - The user's wallet address
 * @returns Promise resolving to the updated user record
 */
export async function incrementUserWin(wallet: string): Promise<User> {
  // TODO: Implement using updateUserStats or direct query
  throw new Error('Not implemented');
}

/**
 * Increment user losses by 1
 * 
 * @param wallet - The user's wallet address
 * @returns Promise resolving to the updated user record
 */
export async function incrementUserLoss(wallet: string): Promise<User> {
  // TODO: Implement using updateUserStats or direct query
  throw new Error('Not implemented');
}

/**
 * Add amount to user's total earned
 * 
 * @param wallet - The user's wallet address
 * @param amount - The amount to add to total_earned
 * @returns Promise resolving to the updated user record
 */
export async function addToUserEarnings(
  wallet: string,
  amount: number
): Promise<User> {
  // TODO: Implement using updateUserStats or direct query
  throw new Error('Not implemented');
}

/**
 * Get bet history for a user with pagination
 * 
 * @param wallet - The user's wallet address
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of results per page
 * @returns Promise resolving to paginated bet results
 */
export interface PaginatedBets {
  bets: Bet[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getBetHistory(
  wallet: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedBets> {
  // TODO: Implement Supabase client call with pagination
  throw new Error('Not implemented');
}

