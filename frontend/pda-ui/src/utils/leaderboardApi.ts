// Use relative paths - same domain deployment on Vercel
export interface LeaderboardUser {
  wallet: string;
  total_wins: number;
  total_losses: number;
  total_earned: number;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardUser[];
  count: number;
  orderBy?: 'wins' | 'earned';
  error?: string;
}

/**
 * Get leaderboard - top players by wins or earned
 * @param limit - Number of players to return (default: 20, max: 100)
 * @param orderBy - Order by 'wins' or 'earned' (default: 'wins')
 */
export async function getLeaderboard(
  limit: number = 20,
  orderBy: 'wins' | 'earned' = 'wins'
): Promise<LeaderboardResponse> {
  const limitClamped = Math.min(Math.max(1, limit), 100); // Between 1 and 100
  // Use relative path (same domain) - API_BASE should be empty for same-domain deployment
  const url = `/api/leaderboard?limit=${limitClamped}&orderBy=${orderBy}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = 'Failed to get leaderboard';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `Failed to get leaderboard: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

