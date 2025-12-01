/**
 * Database helper functions for Solana betting game
 * 
 * This file provides type-safe helper functions for interacting with
 * the bets and users tables in Supabase.
 */

import { getSupabaseClient } from './supabaseClient';

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
  outcome: string | null; // 'win' | 'lose' | null
  tx_signature: string | null;
  bet_time: string; // ISO timestamp string from DB
  created_at: string; // ISO timestamp string from DB
}

export interface User {
  wallet: string;
  total_wins: number;
  total_losses: number;
  total_earned: number; // Numeric type in DB
  created_at: string; // ISO timestamp string from DB
  updated_at: string; // ISO timestamp string from DB
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
  outcome?: 'win' | 'lose';
  tx_signature?: string;
  bet_time?: Date;
}

export interface UpdateBetInput {
  user_roll?: number;
  house_roll?: number;
  outcome?: 'win' | 'lose';
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
  const supabase = getSupabaseClient();

  const insertData = {
    bet_id: betData.bet_id || null,
    user_wallet: betData.user_wallet,
    amount: betData.amount,
    user_roll: betData.user_roll || null,
    house_roll: betData.house_roll || null,
    outcome: betData.outcome || null,
    tx_signature: betData.tx_signature || null,
    bet_time: betData.bet_time ? betData.bet_time.toISOString() : new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('bets')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert bet: ${error.message}`);
  }

  return data as Bet;
}

/**
 * Update an existing bet with resolution data by bet_id (PDA address)
 * 
 * @param betId - The bet_id (PDA address) of the bet to update
 * @param updateData - The data to update
 * @returns Promise resolving to the updated bet record
 */
export async function updateBetByBetId(
  betId: string,
  updateData: UpdateBetInput
): Promise<Bet> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('bets')
    .update(updateData)
    .eq('bet_id', betId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update bet: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Bet with bet_id ${betId} not found`);
  }

  return data as Bet;
}

/**
 * Get a bet by its ID (UUID)
 * 
 * @param betId - The UUID of the bet
 * @returns Promise resolving to the bet record or null if not found
 */
export async function getBetById(betId: string): Promise<Bet | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('id', betId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to get bet: ${error.message}`);
  }

  return data as Bet;
}

/**
 * Get a bet by its bet_id (text identifier, typically PDA address)
 * 
 * @param betId - The text identifier of the bet
 * @returns Promise resolving to the bet record or null if not found
 */
export async function getBetByBetId(betId: string): Promise<Bet | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('bet_id', betId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to get bet: ${error.message}`);
  }

  return data as Bet;
}

/**
 * Get all bets for a specific user wallet
 * 
 * @param wallet - The user's wallet address
 * @param limit - Optional limit on number of results (default: 50)
 * @param offset - Optional offset for pagination
 * @returns Promise resolving to an array of bet records
 */
export async function getBetsByWallet(
  wallet: string,
  limit: number = 50,
  offset: number = 0
): Promise<Bet[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('user_wallet', wallet)
    .order('bet_time', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to get bets: ${error.message}`);
  }

  return (data || []) as Bet[];
}

/**
 * Create a new user record or get existing user
 * 
 * @param wallet - The user's wallet address
 * @returns Promise resolving to the user record
 */
export async function getOrCreateUser(wallet: string): Promise<User> {
  const supabase = getSupabaseClient();

  // Try to get existing user
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('wallet', wallet)
    .single();

  if (existingUser) {
    return existingUser as User;
  }

  // Create new user if doesn't exist
  const { data, error } = await supabase
    .from('users')
    .insert({
      wallet,
      total_wins: 0,
      total_losses: 0,
      total_earned: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return data as User;
}

/**
 * Get user statistics by wallet address
 * 
 * @param wallet - The user's wallet address
 * @returns Promise resolving to the user record or null if not found
 */
export async function getUserByWallet(wallet: string): Promise<User | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet', wallet)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to get user: ${error.message}`);
  }

  return data as User;
}

/**
 * Update user statistics after a bet outcome
 * Increments wins/losses and updates total_earned
 * 
 * @param wallet - The user's wallet address
 * @param statsUpdate - The statistics to update (wins, losses, earned)
 * @returns Promise resolving to the updated user record
 */
export async function updateUserStats(
  wallet: string,
  statsUpdate: UserStatsUpdate
): Promise<User> {
  const supabase = getSupabaseClient();

  // Ensure user exists first
  await getOrCreateUser(wallet);

  // Get current user stats
  const user = await getUserByWallet(wallet);
  if (!user) {
    throw new Error('User not found');
  }

  // Build update object with manual increments
  const updateData: Record<string, number> = {};
  
  if (statsUpdate.total_wins !== undefined) {
    updateData.total_wins = user.total_wins + statsUpdate.total_wins;
  }

  if (statsUpdate.total_losses !== undefined) {
    updateData.total_losses = user.total_losses + statsUpdate.total_losses;
  }

  if (statsUpdate.total_earned !== undefined) {
    updateData.total_earned = user.total_earned + statsUpdate.total_earned;
  }

  // Perform update
  if (Object.keys(updateData).length > 0) {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('wallet', wallet)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user stats: ${error.message}`);
    }

    return data as User;
  }

  return user;
}

/**
 * Increment user wins by 1
 * 
 * @param wallet - The user's wallet address
 * @returns Promise resolving to the updated user record
 */
export async function incrementUserWin(wallet: string): Promise<User> {
  const supabase = getSupabaseClient();

  // Ensure user exists
  await getOrCreateUser(wallet);

  // Get current wins and increment
  const user = await getUserByWallet(wallet);
  if (!user) {
    throw new Error('Failed to get user');
  }

  const { data, error } = await supabase
    .from('users')
    .update({ total_wins: user.total_wins + 1 })
    .eq('wallet', wallet)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to increment wins: ${error.message}`);
  }

  return data as User;
}

/**
 * Increment user losses by 1
 * 
 * @param wallet - The user's wallet address
 * @returns Promise resolving to the updated user record
 */
export async function incrementUserLoss(wallet: string): Promise<User> {
  const supabase = getSupabaseClient();

  // Ensure user exists
  await getOrCreateUser(wallet);

  // Get current losses and increment
  const user = await getUserByWallet(wallet);
  if (!user) {
    throw new Error('Failed to get user');
  }

  const { data, error } = await supabase
    .from('users')
    .update({ total_losses: user.total_losses + 1 })
    .eq('wallet', wallet)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to increment losses: ${error.message}`);
  }

  return data as User;
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
  const supabase = getSupabaseClient();

  // Ensure user exists
  await getOrCreateUser(wallet);

  // Get current earnings and add
  const user = await getUserByWallet(wallet);
  if (!user) {
    throw new Error('Failed to get user');
  }

  const { data, error } = await supabase
    .from('users')
    .update({ total_earned: user.total_earned + amount })
    .eq('wallet', wallet)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update earnings: ${error.message}`);
  }

  return data as User;
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
  const supabase = getSupabaseClient();

  const offset = (page - 1) * pageSize;

  // Get total count
  const { count, error: countError } = await supabase
    .from('bets')
    .select('*', { count: 'exact', head: true })
    .eq('user_wallet', wallet);

  if (countError) {
    throw new Error(`Failed to get bet count: ${countError.message}`);
  }

  const total = count || 0;

  // Get bets with pagination
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('user_wallet', wallet)
    .order('bet_time', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    throw new Error(`Failed to get bet history: ${error.message}`);
  }

  return {
    bets: (data || []) as Bet[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get leaderboard - top users by total_earned
 * 
 * @param limit - Number of top users to return (default: 20)
 * @returns Promise resolving to array of user records
 */
export async function getLeaderboard(limit: number = 20): Promise<User[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('total_earned', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get leaderboard: ${error.message}`);
  }

  return (data || []) as User[];
}

