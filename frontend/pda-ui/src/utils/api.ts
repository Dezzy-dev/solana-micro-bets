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
  const response = await fetch('/api/bets/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    // Try to parse error from response
    let errorMessage = 'Failed to create bet';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If response is not JSON (like a 404 HTML page), use status text
      errorMessage = `Failed to create bet: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

export async function resolveBet(
  request: ResolveBetRequest
): Promise<ResolveBetResponse> {
  const response = await fetch('/api/bets/resolve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    // Try to parse error from response
    let errorMessage = 'Failed to resolve bet';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If response is not JSON (like a 404 HTML page), use status text
      errorMessage = `Failed to resolve bet: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

