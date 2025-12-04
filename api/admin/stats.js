/**
 * GET /api/admin/stats
 * Returns detailed house statistics: deposits, losses, profits, player losses
 * Requires admin API key
 */
import { getSupabaseClient } from '../../backend/db/supabaseClient.js';
import { verifyAdminApiKey } from '../../backend/utils/houseWallet.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

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
    // Check admin API key
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (!verifyAdminApiKey(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Valid ADMIN_API_KEY required.',
      });
    }

    const supabase = getSupabaseClient();

    // Get all resolved bets
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('amount, outcome, bet_time, user_wallet')
      .not('outcome', 'is', null)
      .order('bet_time', { ascending: false });

    if (betsError) {
      throw new Error(`Failed to get bets: ${betsError.message}`);
    }

    // Calculate statistics
    let totalPlayerLosses = 0;  // Money players lost (outcome = 'lose')
    let totalPayouts = 0;        // Money paid to winners (outcome = 'win', payout = amount * 5.5)
    let totalBets = bets?.length || 0;
    let winningBets = 0;
    let losingBets = 0;

    // Calculate per-bet statistics
    const betStats = (bets || []).map(bet => {
      const betAmount = parseFloat(bet.amount) || 0;
      let profit = 0;
      let payout = 0;

      if (bet.outcome === 'lose') {
        // Player lost - house keeps the bet amount
        profit = betAmount;
        totalPlayerLosses += betAmount;
        losingBets++;
      } else if (bet.outcome === 'win') {
        // Player won - house pays 5.5x
        payout = betAmount * 5.5;
        profit = -payout; // Negative profit (loss for house)
        totalPayouts += payout;
        winningBets++;
      }

      return {
        betTime: bet.bet_time,
        userWallet: bet.user_wallet,
        betAmount,
        outcome: bet.outcome,
        payout,
        profit,
      };
    });

    // Net profit = player losses - payouts
    const netProfit = totalPlayerLosses - totalPayouts;

    return res.status(200).json({
      success: true,
      summary: {
        totalBets,
        winningBets,
        losingBets,
        totalPlayerLosses,  // Total money players lost (added to house)
        totalPayouts,        // Total money paid to winners
        netProfit,           // Net profit = player losses - payouts
      },
      betStats: betStats.slice(0, 100), // Return last 100 bets
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get admin stats',
    });
  }
}

