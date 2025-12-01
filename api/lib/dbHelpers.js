/**
 * Database helper functions using cached Supabase client
 */

import { getSupabaseClient } from './supabaseClient.js';

/**
 * Insert a new bet into the database
 */
export async function insertBet(betData) {
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
    nonce: betData.nonce || null,
    bump: betData.bump || null,
  };

  const { data, error } = await supabase
    .from('bets')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert bet: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing bet with resolution data
 */
export async function updateBetByBetId(betId, updateData) {
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

  return data;
}

/**
 * Get bet by bet_id (PDA address)
 */
export async function getBetByBetId(betId) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('bet_id', betId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get bet: ${error.message}`);
  }

  return data;
}

/**
 * Get bets by wallet
 */
export async function getBetsByWallet(wallet, limit = 50, offset = 0) {
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

  return data || [];
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(limit = 20) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('total_earned', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get leaderboard: ${error.message}`);
  }

  return data || [];
}

/**
 * Get or create user
 */
export async function getOrCreateUser(wallet) {
  const supabase = getSupabaseClient();

  // Try to get existing user
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('wallet', wallet)
    .single();

  if (existingUser) {
    return existingUser;
  }

  // Create new user
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

  return data;
}

/**
 * Increment user win
 */
export async function incrementUserWin(wallet) {
  const supabase = getSupabaseClient();

  // Get current user
  const user = await getOrCreateUser(wallet);

  const { data, error } = await supabase
    .from('users')
    .update({ total_wins: user.total_wins + 1 })
    .eq('wallet', wallet)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to increment wins: ${error.message}`);
  }

  return data;
}

/**
 * Increment user loss
 */
export async function incrementUserLoss(wallet) {
  const supabase = getSupabaseClient();

  // Get current user
  const user = await getOrCreateUser(wallet);

  const { data, error } = await supabase
    .from('users')
    .update({ total_losses: user.total_losses + 1 })
    .eq('wallet', wallet)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to increment losses: ${error.message}`);
  }

  return data;
}

/**
 * Add to user earnings
 */
export async function addToUserEarnings(wallet, amount) {
  const supabase = getSupabaseClient();

  // Get current user
  const user = await getOrCreateUser(wallet);

  const { data, error } = await supabase
    .from('users')
    .update({ total_earned: user.total_earned + amount })
    .eq('wallet', wallet)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update earnings: ${error.message}`);
  }

  return data;
}

