/**
 * GET /api/leaderboard
 * Returns top users ordered by wins (default) or earned
 * Query params:
 *   - limit: number of users to return (default: 20, max: 100)
 *   - orderBy: 'wins' or 'earned' (default: 'wins')
 */
import { getSupabaseClient } from '../backend/db/supabaseClient.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const limit = parseInt(req.query.limit) || 20;
    const limitClamped = Math.min(Math.max(1, limit), 100); // Between 1 and 100
    
    const orderBy = req.query.orderBy === 'earned' ? 'earned' : 'wins';

    const supabase = getSupabaseClient();
    const orderField = orderBy === 'wins' ? 'total_wins' : 'total_earned';

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order(orderField, { ascending: false })
      .limit(limitClamped);

    if (error) {
      throw new Error(`Failed to get leaderboard: ${error.message}`);
    }

    return res.status(200).json({
      success: true,
      leaderboard: data || [],
      count: (data || []).length,
      orderBy,
    });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get leaderboard',
    });
  }
}

