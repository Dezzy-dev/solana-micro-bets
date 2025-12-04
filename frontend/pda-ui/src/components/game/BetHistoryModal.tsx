import { useEffect, useState } from 'react';
import {
  getBetHistory,
  clearBetHistory,
  getBetStatistics,
  formatTimestamp,
  shortenBetId,
  BetHistoryEntry,
} from '../../utils/betHistory';

interface BetHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BetHistoryModal({ isOpen, onClose }: BetHistoryModalProps) {
  const [history, setHistory] = useState<BetHistoryEntry[]>([]);
  const [stats, setStats] = useState(getBetStatistics());

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const loadHistory = () => {
    const betHistory = getBetHistory();
    setHistory(betHistory);
    setStats(getBetStatistics());
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all bet history? This cannot be undone.')) {
      clearBetHistory();
      loadHistory();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative bg-gradient-to-br from-cyan-900/40 via-purple-900/40 to-cyan-900/40 backdrop-blur-xl border-2 border-cyan-400/50 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-[0_0_80px_rgba(0,255,255,0.4)] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Corner decorations */}
          <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-cyan-400/50 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-cyan-400/50 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-cyan-400/50 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-cyan-400/50 rounded-br-lg" />

          {/* Header */}
          <div className="sticky top-0 bg-black/60 backdrop-blur-md border-b border-cyan-400/30 p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400">
                BET HISTORY
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg bg-black/60 border border-cyan-400/30 text-cyan-400 hover:border-cyan-400 hover:bg-black/80 transition-all duration-200 flex items-center justify-center font-bold text-xl"
              >
                ×
              </button>
            </div>
            <div className="h-1 w-24 bg-gradient-to-r from-cyan-400 to-transparent" />
          </div>

          {/* Statistics */}
          {stats.totalBets > 0 && (
            <div className="p-6 border-b border-cyan-400/30 bg-black/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-black/40 border border-cyan-400/30 rounded-lg">
                  <p className="text-cyan-300/70 text-xs mb-1">Total Bets</p>
                  <p className="text-cyan-400 font-bold text-lg">{stats.totalBets}</p>
                </div>
                <div className="text-center p-3 bg-black/40 border border-cyan-400/30 rounded-lg">
                  <p className="text-cyan-300/70 text-xs mb-1">Win Rate</p>
                  <p className="text-green-400 font-bold text-lg">{stats.winRate.toFixed(1)}%</p>
                </div>
                <div className="text-center p-3 bg-black/40 border border-cyan-400/30 rounded-lg">
                  <p className="text-cyan-300/70 text-xs mb-1">Wins / Losses</p>
                  <p className="text-cyan-400 font-bold text-lg">
                    {stats.totalWins} / {stats.totalLosses}
                  </p>
                </div>
                <div className="text-center p-3 bg-black/40 border border-cyan-400/30 rounded-lg">
                  <p className="text-cyan-300/70 text-xs mb-1">Net Profit</p>
                  <p
                    className={`font-bold text-lg ${
                      stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {stats.netProfit >= 0 ? '+' : ''}
                    {stats.netProfit.toFixed(4)} SOL
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
            {history.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-cyan-300/70 text-lg">No bet history yet</p>
                <p className="text-cyan-400/50 text-sm mt-2">Your bets will appear here after you play</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((bet) => (
                  <BetHistoryItem key={bet.id} bet={bet} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {history.length > 0 && (
            <div className="sticky bottom-0 bg-black/60 backdrop-blur-md border-t border-cyan-400/30 p-4 flex justify-between items-center">
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 bg-black/60 border border-red-400/30 text-red-400 font-bold text-sm rounded-lg hover:border-red-400 hover:bg-black/80 transition-all duration-300"
              >
                CLEAR HISTORY
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold text-sm rounded-lg shadow-[0_0_30px_rgba(0,255,255,0.5)] hover:shadow-[0_0_40px_rgba(0,255,255,0.7)] hover:scale-105 active:scale-95 transition-all duration-300"
              >
                CLOSE
              </button>
            </div>
          )}

          {history.length === 0 && (
            <div className="sticky bottom-0 bg-black/60 backdrop-blur-md border-t border-cyan-400/30 p-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold text-sm rounded-lg shadow-[0_0_30px_rgba(0,255,255,0.5)] hover:shadow-[0_0_40px_rgba(0,255,255,0.7)] hover:scale-105 active:scale-95 transition-all duration-300"
              >
                CLOSE
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function BetHistoryItem({ bet }: { bet: BetHistoryEntry }) {
  const isWin = bet.result === 'win';

  return (
    <div
      className={`bg-black/40 border rounded-xl p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
        isWin
          ? 'border-green-400/30 hover:border-green-400/50'
          : 'border-red-400/30 hover:border-red-400/50'
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
        {/* Bet ID */}
        <div className="md:col-span-1">
          <p className="text-cyan-300/50 text-xs mb-1">Bet ID</p>
          <p className="text-cyan-400 font-mono text-xs">
            {bet.escrowAccount ? shortenBetId(bet.escrowAccount) : 'N/A'}
          </p>
        </div>

        {/* Timestamp */}
        <div className="md:col-span-1">
          <p className="text-cyan-300/50 text-xs mb-1">Time</p>
          <p className="text-cyan-300 text-xs">{formatTimestamp(bet.timestamp)}</p>
        </div>

        {/* Bet Amount */}
        <div className="md:col-span-1">
          <p className="text-cyan-300/50 text-xs mb-1">Bet</p>
          <p className="text-cyan-400 font-bold">{bet.betAmount.toFixed(4)} SOL</p>
        </div>

        {/* Rolls */}
        <div className="md:col-span-1">
          <p className="text-cyan-300/50 text-xs mb-1">Rolls</p>
          <p className="text-cyan-400 font-bold">
            <span className="text-cyan-400">{bet.playerRoll}</span>
            <span className="text-cyan-300/50 mx-1">vs</span>
            <span className="text-purple-400">{bet.houseRoll}</span>
          </p>
        </div>

        {/* Result */}
        <div className="md:col-span-1">
          <p className="text-cyan-300/50 text-xs mb-1">Result</p>
          <p
            className={`font-bold ${
              isWin
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400'
                : 'text-red-400'
            }`}
          >
            {isWin ? 'WIN' : 'LOSE'}
          </p>
        </div>

        {/* Payout/Loss */}
        <div className="md:col-span-1 text-right">
          <p className="text-cyan-300/50 text-xs mb-1">Amount</p>
          {isWin && bet.payout !== undefined ? (
            <p className="text-green-400 font-bold">+{bet.payout.toFixed(4)} SOL</p>
          ) : bet.loss !== undefined ? (
            <p className="text-red-400 font-bold">-{bet.loss.toFixed(4)} SOL</p>
          ) : (
            <p className="text-gray-400 text-xs">-</p>
          )}
        </div>
      </div>
    </div>
  );
}

