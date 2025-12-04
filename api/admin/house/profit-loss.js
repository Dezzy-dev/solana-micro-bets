/**
 * GET /api/admin/house/profit-loss
 * Returns house profit/loss from transaction logs
 * Requires admin API key
 */
import { getSupabaseClient } from '../../../backend/db/supabaseClient.js';
import { verifyAdminApiKey } from '../../../backend/utils/houseWallet.js';

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
      .select('amount, outcome')
      .not('outcome', 'is', null);

    if (betsError) {
      throw new Error(`Failed to get bets: ${betsError.message}`);
    }

    // Calculate totals
    let totalDeposits = 0; // Player losses (when outcome = 'lose')
    let totalPayouts = 0;   // Player winnings (when outcome = 'win', payout = amount * 5.5)

    if (bets && bets.length > 0) {
      bets.forEach(bet => {
        if (bet.outcome === 'lose') {
          // Player lost - this is house profit (deposit)
          totalDeposits += parseFloat(bet.amount) || 0;
        } else if (bet.outcome === 'win') {
          // Player won - calculate payout (5.5x bet amount)
          const betAmount = parseFloat(bet.amount) || 0;
          const payout = betAmount * 5.5;
          totalPayouts += payout;
        }
      });
    }

    // Profit/Loss = Deposits (player losses) - Payouts (player winnings)
    // Positive = profit, Negative = loss
    const profitLossSOL = totalDeposits - totalPayouts;

    return res.status(200).json({
      success: true,
      profitLossSOL: profitLossSOL,
      totalDepositsSOL: totalDeposits,
      totalPayoutsSOL: totalPayouts,
      totalBets: bets?.length || 0,
    });
  } catch (error) {
    console.error('Profit/Loss Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate profit/loss',
    });
  }
}

