import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  getHouseBalance,
  getMaxPayout,
  depositToHouse,
  withdrawFromHouse,
  getHouseProfitLoss,
  HouseBalanceResponse,
  MaxPayoutResponse,
  ProfitLossResponse,
} from '../utils/adminApi';
import { ErrorToast } from '../components/ErrorToast';
import { SuccessToast } from '../components/SuccessToast';

const ADMIN_KEY_STORAGE = 'admin-api-key-session'; // Session storage, not localStorage

export function AdminDashboard() {
  const [apiKey, setApiKey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // House data state
  const [houseBalance, setHouseBalance] = useState<HouseBalanceResponse | null>(null);
  const [maxPayout, setMaxPayout] = useState<MaxPayoutResponse | null>(null);
  const [profitLoss, setProfitLoss] = useState<ProfitLossResponse | null>(null);

  // Form state
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawTo, setWithdrawTo] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  // Check if already authenticated on mount
  useEffect(() => {
    const storedKey = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (storedKey) {
      setApiKey(storedKey);
      setIsAuthenticated(true);
      loadData(storedKey);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Please enter an admin API key');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Test the API key by trying to get house balance
      await getHouseBalance(apiKey);
      // If successful, store it in session storage
      sessionStorage.setItem(ADMIN_KEY_STORAGE, apiKey);
      setIsAuthenticated(true);
      await loadData(apiKey);
    } catch (err: any) {
      setError(err.message || 'Invalid admin API key');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setIsAuthenticated(false);
    setApiKey('');
    setHouseBalance(null);
    setMaxPayout(null);
    setProfitLoss(null);
  };

  const loadData = async (key: string) => {
    setRefreshing(true);
    setError(null);
    try {
      // Load all data in parallel
      const [balance, payout, profitLossData] = await Promise.all([
        getHouseBalance(key),
        getMaxPayout(),
        getHouseProfitLoss(key),
      ]);

      setHouseBalance(balance);
      setMaxPayout(payout);
      setProfitLoss(profitLossData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (isAuthenticated && apiKey) {
      loadData(apiKey);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount.trim()) {
      setError('Please enter a deposit amount');
      return;
    }

    const amountSOL = parseFloat(depositAmount);
    if (isNaN(amountSOL) || amountSOL <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    const amountLamports = Math.floor(amountSOL * LAMPORTS_PER_SOL);

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await depositToHouse(apiKey, { amountLamports });
      setSuccess(`Deposit successful! Transaction: ${response.signature}`);
      setDepositAmount('');
      // Refresh data
      await loadData(apiKey);
    } catch (err: any) {
      setError(err.message || 'Failed to deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount.trim() || !withdrawTo.trim()) {
      setError('Please enter both withdrawal amount and destination address');
      return;
    }

    const amountSOL = parseFloat(withdrawAmount);
    if (isNaN(amountSOL) || amountSOL <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    // Basic pubkey validation
    if (withdrawTo.length < 32 || withdrawTo.length > 44) {
      setError('Please enter a valid Solana address');
      return;
    }

    const amountLamports = Math.floor(amountSOL * LAMPORTS_PER_SOL);

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await withdrawFromHouse(apiKey, {
        amountLamports,
        toPubkey: withdrawTo.trim(),
      });
      setSuccess(`Withdrawal successful! Transaction: ${response.signature}`);
      setWithdrawAmount('');
      setWithdrawTo('');
      // Refresh data
      await loadData(apiKey);
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw');
    } finally {
      setLoading(false);
    }
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #1a0a2e 25%, #000000 50%, #1a0a2e 75%, #000000 100%)',
        }}
      >
        <div className="w-full max-w-md mx-4">
          <div className="bg-black/80 border-2 border-cyan-400/50 rounded-3xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(0,255,255,0.3)]">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 mb-2 text-center">
              ADMIN ACCESS
            </h1>
            <p className="text-cyan-300/70 text-sm text-center mb-6">
              Enter your admin API key to continue
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Admin API Key"
                  className="w-full px-4 py-3 bg-black/60 border-2 border-cyan-400/30 text-cyan-300 rounded-xl focus:border-cyan-400 focus:outline-none transition-all"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 text-black font-bold rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.5)] hover:shadow-[0_0_40px_rgba(0,255,255,0.7)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'AUTHENTICATING...' : 'LOGIN'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-cyan-400/70 hover:text-cyan-400 text-sm transition-colors"
              >
                ← Back to Game
              </Link>
            </div>
          </div>
        </div>

        {error && <ErrorToast message={error} onClose={() => setError(null)} />}
      </div>
    );
  }

  // Main admin dashboard
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #000000 0%, #1a0a2e 25%, #000000 50%, #1a0a2e 75%, #000000 100%)',
      }}
    >
      {/* Animated background grid */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff08_1px,transparent_1px),linear-gradient(to_bottom,#00ffff08_1px,transparent_1px)] bg-[size:4rem_4rem]"
        style={{
          animation: 'gridPulse 3s ease-in-out infinite',
        }}
      ></div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 mb-2">
              ADMIN DASHBOARD
            </h1>
            <p className="text-cyan-300/70 text-sm">House Management Portal</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="px-4 py-2 bg-black/60 border-2 border-cyan-400/50 text-cyan-400 font-bold text-sm rounded-lg hover:border-cyan-400 hover:bg-black/80 transition-all duration-300 disabled:opacity-50"
            >
              {refreshing ? 'REFRESHING...' : '🔄 REFRESH'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-black/60 border-2 border-red-400/50 text-red-400 font-bold text-sm rounded-lg hover:border-red-400 hover:bg-black/80 transition-all duration-300"
            >
              LOGOUT
            </button>
            <Link
              to="/"
              className="px-4 py-2 bg-black/60 border-2 border-purple-400/50 text-purple-400 font-bold text-sm rounded-lg hover:border-purple-400 hover:bg-black/80 transition-all duration-300"
            >
              ← GAME
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* House Balance */}
          <div className="bg-black/40 border-2 border-cyan-400/30 rounded-2xl p-6 backdrop-blur-sm hover:border-cyan-400/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-cyan-400 font-bold text-sm uppercase">House Balance</h3>
              <span className="text-2xl">💰</span>
            </div>
            {houseBalance ? (
              <div>
                <p className="text-3xl font-black text-cyan-400 mb-1">
                  {houseBalance.sol.toFixed(4)} SOL
                </p>
                <p className="text-cyan-300/50 text-xs">{houseBalance.lamports.toLocaleString()} lamports</p>
                <p className="text-cyan-300/50 text-xs mt-2 font-mono truncate">
                  {houseBalance.housePubkey}
                </p>
              </div>
            ) : (
              <p className="text-cyan-300/50">Loading...</p>
            )}
          </div>

          {/* Max Payout */}
          <div className="bg-black/40 border-2 border-purple-400/30 rounded-2xl p-6 backdrop-blur-sm hover:border-purple-400/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-purple-400 font-bold text-sm uppercase">Max Payout</h3>
              <span className="text-2xl">🎯</span>
            </div>
            {maxPayout ? (
              <div>
                <p className="text-3xl font-black text-purple-400 mb-1">
                  {maxPayout.maxPayoutSOL.toFixed(4)} SOL
                </p>
                <p className="text-purple-300/50 text-xs">
                  Safety Factor: {(maxPayout.safetyFactor * 100).toFixed(0)}%
                </p>
              </div>
            ) : (
              <p className="text-purple-300/50">Loading...</p>
            )}
          </div>

          {/* Profit/Loss */}
          <div className="bg-black/40 border-2 border-green-400/30 rounded-2xl p-6 backdrop-blur-sm hover:border-green-400/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-green-400 font-bold text-sm uppercase">Net P/L</h3>
              <span className="text-2xl">📊</span>
            </div>
            {profitLoss ? (
              <div>
                <p
                  className={`text-3xl font-black mb-1 ${
                    profitLoss.profitLossSOL >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {profitLoss.profitLossSOL >= 0 ? '+' : ''}
                  {profitLoss.profitLossSOL.toFixed(4)} SOL
                </p>
                <p className="text-green-300/50 text-xs">
                  Deposits: {profitLoss.totalDepositsSOL.toFixed(4)} | Payouts: {profitLoss.totalPayoutsSOL.toFixed(4)}
                </p>
              </div>
            ) : (
              <p className="text-green-300/50">Loading...</p>
            )}
          </div>

          {/* Total Withdrawals */}
          <div className="bg-black/40 border-2 border-yellow-400/30 rounded-2xl p-6 backdrop-blur-sm hover:border-yellow-400/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-yellow-400 font-bold text-sm uppercase">Withdrawals</h3>
              <span className="text-2xl">💸</span>
            </div>
            {profitLoss ? (
              <div>
                <p className="text-3xl font-black text-yellow-400 mb-1">
                  {profitLoss.totalWithdrawalsSOL.toFixed(4)} SOL
                </p>
                <p className="text-yellow-300/50 text-xs">Total withdrawn</p>
              </div>
            ) : (
              <p className="text-yellow-300/50">Loading...</p>
            )}
          </div>
        </div>

        {/* Action Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deposit Panel */}
          <div className="bg-black/40 border-2 border-cyan-400/30 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Deposit Funds</h2>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-cyan-300/70 text-sm mb-2">Amount (SOL)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-black/60 border-2 border-cyan-400/30 text-cyan-300 rounded-xl focus:border-cyan-400 focus:outline-none transition-all"
                  disabled={loading}
                />
                <p className="text-cyan-300/50 text-xs mt-2">
                  Note: On devnet, deposits use airdrop (max 2 SOL per request)
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || !depositAmount.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.5)] hover:shadow-[0_0_40px_rgba(0,255,255,0.7)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'PROCESSING...' : 'DEPOSIT'}
              </button>
            </form>
          </div>

          {/* Withdraw Panel */}
          <div className="bg-black/40 border-2 border-red-400/30 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Withdraw Funds</h2>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-red-300/70 text-sm mb-2">Amount (SOL)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-black/60 border-2 border-red-400/30 text-red-300 rounded-xl focus:border-red-400 focus:outline-none transition-all"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-red-300/70 text-sm mb-2">Destination Address</label>
                <input
                  type="text"
                  value={withdrawTo}
                  onChange={(e) => setWithdrawTo(e.target.value)}
                  placeholder="Solana public key"
                  className="w-full px-4 py-3 bg-black/60 border-2 border-red-400/30 text-red-300 rounded-xl focus:border-red-400 focus:outline-none transition-all font-mono text-sm"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !withdrawAmount.trim() || !withdrawTo.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-black font-bold rounded-xl shadow-[0_0_30px_rgba(255,0,0,0.5)] hover:shadow-[0_0_40px_rgba(255,0,0,0.7)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'PROCESSING...' : 'WITHDRAW'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
      {success && <SuccessToast message={success} onClose={() => setSuccess(null)} />}
    </div>
  );
}

