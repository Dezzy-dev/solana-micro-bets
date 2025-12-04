// Use empty string for relative paths (will use Vite proxy in dev)
// In production, set VITE_PUBLIC_API_URL to your backend URL
const API_BASE = import.meta.env.VITE_PUBLIC_API_URL || '';

export interface HouseBalanceResponse {
  success: boolean;
  lamports: number;
  sol: number;
  housePubkey: string;
  error?: string;
}

export interface MaxPayoutResponse {
  success: boolean;
  maxPayoutLamports: number;
  maxPayoutSOL: number;
  safetyFactor: number;
  houseBalanceLamports: number;
  houseBalanceSOL: number;
  housePubkey: string;
  error?: string;
}

export interface DepositRequest {
  amountLamports: number;
}

export interface DepositResponse {
  success: boolean;
  signature?: string;
  amountLamports?: number;
  depositMethod?: string;
  balance?: {
    lamports: number;
    sol: number;
  };
  balanceBefore?: {
    lamports: number;
    sol: number;
  };
  housePubkey?: string;
  error?: string;
}

export interface WithdrawRequest {
  amountLamports: number;
  toPubkey: string;
}

export interface WithdrawResponse {
  success: boolean;
  signature?: string;
  amountLamports?: number;
  toPubkey?: string;
  balance?: {
    lamports: number;
    sol: number;
  };
  balanceBefore?: {
    lamports: number;
    sol: number;
  };
  housePubkey?: string;
  error?: string;
}

export interface ProfitLossResponse {
  success: boolean;
  profitLossSOL: number;
  totalDepositsSOL: number;
  totalWithdrawalsSOL: number;
  totalPayoutsSOL: number;
  error?: string;
}

/**
 * Get house balance (requires admin API key)
 */
export async function getHouseBalance(apiKey: string): Promise<HouseBalanceResponse> {
  const response = await fetch(`${API_BASE}/admin/house/balance`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    // Try to parse error from response
    let errorMessage = 'Failed to get house balance';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If response is not JSON (like a 404 HTML page), use status text
      errorMessage = `Failed to get house balance: ${response.status} ${response.statusText}. Make sure the backend server is running on port 3001.`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

/**
 * Get max payout configuration (public endpoint)
 */
export async function getMaxPayout(): Promise<MaxPayoutResponse> {
  const response = await fetch(`${API_BASE}/house/max-payout`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = 'Failed to get max payout';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `Failed to get max payout: ${response.status} ${response.statusText}. Make sure the backend server is running on port 3001.`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

/**
 * Deposit funds to house wallet (requires admin API key)
 */
export async function depositToHouse(
  apiKey: string,
  request: DepositRequest
): Promise<DepositResponse> {
  const response = await fetch(`${API_BASE}/admin/house/deposit`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to deposit to house wallet';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `Failed to deposit: ${response.status} ${response.statusText}. Make sure the backend server is running on port 3001.`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

/**
 * Withdraw funds from house wallet (requires admin API key)
 */
export async function withdrawFromHouse(
  apiKey: string,
  request: WithdrawRequest
): Promise<WithdrawResponse> {
  const response = await fetch(`${API_BASE}/admin/house/withdraw`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to withdraw from house wallet';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `Failed to withdraw: ${response.status} ${response.statusText}. Make sure the backend server is running on port 3001.`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

/**
 * Get house profit/loss (requires admin API key)
 * This will calculate from transaction logs
 */
export async function getHouseProfitLoss(apiKey: string): Promise<ProfitLossResponse> {
  const response = await fetch(`${API_BASE}/admin/house/profit-loss`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = 'Failed to get profit/loss';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `Failed to get profit/loss: ${response.status} ${response.statusText}. Make sure the backend server is running on port 3001.`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

