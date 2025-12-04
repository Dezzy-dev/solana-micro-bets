export interface CreateBetRequest {
  playerPubkey: string;
  amountLamports: number;
  nonce: number;
}

export interface CreateBetResponse {
  success: boolean;
  transaction: string; // base64 encoded
  pda: string;
  bump: number;
  dataSize?: number;
  error?: string;
}

export interface ResolveBetRequest {
  pda: string;
  playerRoll: number;
  // houseRoll removed - now generated server-side for security
}

export interface ResolveBetResponse {
  success: boolean;
  signature: string;
  payout: string;
  playerWins: boolean;
  playerRoll: number; // Included in response
  houseRoll: number;  // Server-generated, included in response
  totalRoll: number;
  error?: string;
}

export async function createBet(
  request: CreateBetRequest
): Promise<CreateBetResponse> {
  const response = await fetch('/api/create-bet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create bet');
  }
  return data;
}

export async function resolveBet(
  request: ResolveBetRequest
): Promise<ResolveBetResponse> {
  const response = await fetch('/api/resolve-bet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to resolve bet');
  }
  return data;
}

