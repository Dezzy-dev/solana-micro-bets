const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  const response = await fetch(`${API_BASE_URL}/admin/house/balance`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to get house balance');
  }
  return data;
}

/**
 * Get max payout configuration (public endpoint)
 */
export async function getMaxPayout(): Promise<MaxPayoutResponse> {
  const response = await fetch(`${API_BASE_URL}/house/max-payout`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to get max payout');
  }
  return data;
}

/**
 * Deposit funds to house wallet (requires admin API key)
 */
export async function depositToHouse(
  apiKey: string,
  request: DepositRequest
): Promise<DepositResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/house/deposit`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to deposit to house wallet');
  }
  return data;
}

/**
 * Withdraw funds from house wallet (requires admin API key)
 */
export async function withdrawFromHouse(
  apiKey: string,
  request: WithdrawRequest
): Promise<WithdrawResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/house/withdraw`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to withdraw from house wallet');
  }
  return data;
}

/**
 * Get house profit/loss (requires admin API key)
 * This will calculate from transaction logs
 */
export async function getHouseProfitLoss(apiKey: string): Promise<ProfitLossResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/house/profit-loss`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to get profit/loss');
  }
  return data;
}

