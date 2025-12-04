import { useState, useEffect } from 'react';
import { getLeaderboard, LeaderboardUser } from '../utils/leaderboardApi';

interface LeaderboardProps {
  limit?: number;
}

export function Leaderboard({ limit = 10 }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setError(null);
      const response = await getLeaderboard(limit, 'wins');
      setLeaderboard(response.leaderboard || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard');
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and set up auto-refresh every 10 seconds
  useEffect(() => {
    fetchLeaderboard();
    
    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [limit]);

  const shortenWallet = (wallet: string) => {
    if (wallet.length <= 10) return wallet;
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading && leaderboard.length === 0) {
    return (
      <div className="bg-black/40 border-2 border-cyan-400/30 rounded-2xl p-6 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">🏆 LEADERBOARD</h2>
        <p className="text-cyan-300/50">Loading...</p>
      </div>
    );
  }

  if (error && leaderboard.length === 0) {
    return (
      <div className="bg-black/40 border-2 border-red-400/30 rounded-2xl p-6 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-red-400 mb-4">🏆 LEADERBOARD</h2>
        <p className="text-red-300/50">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border-2 border-cyan-400/30 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400">
          🏆 TOP WINNERS
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-cyan-300/50 text-xs">Auto-refresh 10s</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-400/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {leaderboard.length === 0 ? (
        <p className="text-cyan-300/50 text-center py-8">No players yet. Be the first!</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {leaderboard.map((user, index) => {
            const rank = index + 1;
            const isTopThree = rank <= 3;
            
            return (
              <div
                key={user.wallet}
                className={`
                  flex items-center justify-between p-3 rounded-xl transition-all duration-300
                  ${isTopThree 
                    ? 'bg-gradient-to-r from-yellow-900/30 via-cyan-900/30 to-purple-900/30 border-2 border-cyan-400/50' 
                    : 'bg-black/60 border border-cyan-400/20 hover:border-cyan-400/40'
                  }
                `}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 md:w-10 text-center">
                    <span className={`font-black ${isTopThree ? 'text-2xl' : 'text-cyan-400'}`}>
                      {getRankEmoji(rank)}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm md:text-base text-cyan-300 truncate">
                      {shortenWallet(user.wallet)}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-cyan-300/50">
                      <span>W: {user.total_wins}</span>
                      <span>L: {user.total_losses}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="text-green-400 font-bold text-sm md:text-base">
                    +{user.total_earned.toFixed(2)} SOL
                  </div>
                  <div className="text-cyan-300/50 text-xs">
                    {user.total_wins} {user.total_wins === 1 ? 'win' : 'wins'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading && leaderboard.length > 0 && (
        <div className="mt-4 text-center">
          <span className="text-cyan-300/50 text-xs">Refreshing...</span>
        </div>
      )}
    </div>
  );
}

