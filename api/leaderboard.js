/**
 * GET /api/leaderboard
 * Returns top 20 users ordered by total_earned DESC
 */

import { getLeaderboard } from '../lib/dbHelpers.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
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

    // Get leaderboard from database
    const leaderboard = await getLeaderboard(limitClamped);

    res.json({
      success: true,
      leaderboard,
      count: leaderboard.length,
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get leaderboard',
    });
  }
}

