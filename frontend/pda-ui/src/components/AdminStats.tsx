import { useState, useEffect } from 'react';
import { getAdminStats, AdminStatsResponse } from '../utils/adminApi';
import { ErrorToast } from './ErrorToast';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

interface AdminStatsProps {
  apiKey: string;
}

export function AdminStats({ apiKey }: AdminStatsProps) {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await getAdminStats(apiKey);
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin stats');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      setLoading(true);
      loadStats().finally(() => setLoading(false));
    }
  }, [apiKey]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center text-gray-400">Loading statistics...</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const { summary } = stats;
  const netProfitColor = summary.netProfit >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className="space-y-6">
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Player Losses (Deposits to House) */}
        <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-lg p-6 border border-green-700/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Player Losses</h3>
            <div className="text-green-400">💰</div>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {summary.totalPlayerLosses.toFixed(4)} SOL
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Money players lost (added to house wallet)
          </p>
        </div>

        {/* Total Payouts */}
        <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 rounded-lg p-6 border border-red-700/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Total Payouts</h3>
            <div className="text-red-400">💸</div>
          </div>
          <div className="text-2xl font-bold text-red-400">
            {summary.totalPayouts.toFixed(4)} SOL
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Money paid to winning players
          </p>
        </div>

        {/* Net Profit */}
        <div className={`bg-gradient-to-br ${summary.netProfit >= 0 ? 'from-green-900/30 to-green-800/20 border-green-700/50' : 'from-red-900/30 to-red-800/20 border-red-700/50'} rounded-lg p-6 border`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Net Profit</h3>
            <div className={netProfitColor}>
              {summary.netProfit >= 0 ? '📈' : '📉'}
            </div>
          </div>
          <div className={`text-2xl font-bold ${netProfitColor}`}>
            {summary.netProfit >= 0 ? '+' : ''}{summary.netProfit.toFixed(4)} SOL
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Player losses - Payouts
          </p>
        </div>

        {/* Total Bets */}
        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-lg p-6 border border-blue-700/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Total Bets</h3>
            <div className="text-blue-400">🎲</div>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {summary.totalBets}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {summary.winningBets} wins, {summary.losingBets} losses
          </p>
        </div>

        {/* Win Rate */}
        <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-lg p-6 border border-purple-700/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">House Win Rate</h3>
            <div className="text-purple-400">🎯</div>
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {summary.totalBets > 0 
              ? ((summary.losingBets / summary.totalBets) * 100).toFixed(1)
              : '0.0'}%
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Percentage of bets house won
          </p>
        </div>

        {/* Average Bet */}
        <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 rounded-lg p-6 border border-yellow-700/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Avg Player Loss</h3>
            <div className="text-yellow-400">📊</div>
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {summary.losingBets > 0
              ? (summary.totalPlayerLosses / summary.losingBets).toFixed(4)
              : '0.0000'} SOL
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Average amount per losing bet
          </p>
        </div>
      </div>

      {/* Recent Bet Stats Table */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recent Bet Statistics</h2>
          <button
            onClick={loadStats}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {stats.betStats && stats.betStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Time</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Player</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Bet Amount</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Outcome</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Payout</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">House Profit</th>
                </tr>
              </thead>
              <tbody>
                {stats.betStats.map((bet, index) => {
                  const betTime = new Date(bet.betTime);
                  const isWin = bet.outcome === 'win';
                  const profitColor = bet.profit >= 0 ? 'text-green-400' : 'text-red-400';
                  
                  return (
                    <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-3 px-4 text-gray-300">
                        {betTime.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-300 font-mono text-xs">
                        {bet.userWallet.slice(0, 8)}...{bet.userWallet.slice(-6)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300">
                        {bet.betAmount.toFixed(4)} SOL
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          isWin 
                            ? 'bg-green-900/50 text-green-400 border border-green-700' 
                            : 'bg-red-900/50 text-red-400 border border-red-700'
                        }`}>
                          {bet.outcome.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300">
                        {bet.payout > 0 ? `${bet.payout.toFixed(4)} SOL` : '-'}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${profitColor}`}>
                        {bet.profit >= 0 ? '+' : ''}{bet.profit.toFixed(4)} SOL
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            No bet statistics available yet.
          </div>
        )}
      </div>
    </div>
  );
}

