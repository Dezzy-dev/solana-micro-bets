import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Buffer } from 'buffer';
import { createBet, resolveBet } from '../utils/api';
import { derivePDA } from '../utils/PDA';
import { GameArena } from '../components/game/GameArena';
import { ResultOverlay } from '../components/game/ResultOverlay';
import { ErrorToast } from '../components/ErrorToast';
import { SuccessToast } from '../components/SuccessToast';
import { FirstTimeHeroModal, hasSeenOnboarding } from '../components/onboarding/FirstTimeHeroModal';
import { HowItWorksModal } from '../components/onboarding/HowItWorksModal';
import { BetHistoryModal } from '../components/game/BetHistoryModal';
import { saveBetToHistory } from '../utils/betHistory';
import { Leaderboard } from '../components/Leaderboard';

const BET_AMOUNTS = [0.05, 0.1, 0.25, 0.5];

export function Game() {
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [betAmount, setBetAmount] = useState<number>(0.1);
  const [isRolling, setIsRolling] = useState(false);
  const [playerRoll, setPlayerRoll] = useState<number | undefined>(undefined);
  const [houseRoll, setHouseRoll] = useState<number | undefined>(undefined);
  const [playerWins, setPlayerWins] = useState<boolean | undefined>(undefined);
  const [showResult, setShowResult] = useState(false);
  const [transactionSignature, setTransactionSignature] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [nonce, setNonce] = useState<number>(0);
  const [escrowAccount, setEscrowAccount] = useState<string | undefined>(undefined);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showBetHistory, setShowBetHistory] = useState(false);

  // Check if user has seen onboarding on mount
  useEffect(() => {
    if (!hasSeenOnboarding()) {
      setShowFirstTimeModal(true);
    }
  }, []);

  // Generate nonce on mount and when bet completes
  useEffect(() => {
    setNonce(Math.floor(Math.random() * 256));
  }, [showResult]);

  // Fetch balance when wallet is connected
  useEffect(() => {
    if (publicKey) {
      fetchBalance();
      const interval = setInterval(fetchBalance, 5000);
      return () => clearInterval(interval);
    } else {
      setBalance(null);
    }
  }, [publicKey]);

  const fetchBalance = async () => {
    if (!publicKey) return;
    try {
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const rollDice = (): number => {
    return Math.floor(Math.random() * 6) + 1;
  };

  const handleRoll = async () => {
    if (!publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setError(null);
    setSuccess(null);
    setPlayerRoll(undefined);
    setHouseRoll(undefined);
    setPlayerWins(undefined);
    setShowResult(false);
    setTransactionSignature(undefined);
    setEscrowAccount(undefined);
    setIsRolling(true);
    setLoading(true);

    try {
      // Check balance
      const currentBalance = await connection.getBalance(publicKey);
      const balanceSOL = currentBalance / LAMPORTS_PER_SOL;
      const requiredBalance = betAmount + 0.002; // bet + rent + fees

      if (balanceSOL < requiredBalance) {
        setError(`Insufficient balance! You have ${balanceSOL.toFixed(4)} SOL, but need ${requiredBalance.toFixed(4)} SOL.`);
        setIsRolling(false);
        setLoading(false);
        return;
      }

      setBalance(balanceSOL);

      // Step 1: Create bet transaction (PDA escrow)
      setSuccess('Creating bet transaction...');
      
      // Derive PDA for this bet
      const { pda } = derivePDA(publicKey, nonce);
      setEscrowAccount(pda.toBase58());

      // Call backend to create bet transaction
      const createBetResponse = await createBet({
        playerPubkey: publicKey.toBase58(),
        amountLamports: Math.floor(betAmount * LAMPORTS_PER_SOL),
        nonce: nonce,
      });

      // Deserialize transaction
      const transactionBuffer = Buffer.from(createBetResponse.transaction, 'base64');
      let transaction = Transaction.from(transactionBuffer);

      // Get fresh blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = publicKey;

      // Sign and send transaction
      setSuccess('Signing transaction...');
      let signature: string;

      if (signTransaction) {
        try {
          const signedTx = await signTransaction(transaction);
          signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: false,
            maxRetries: 3,
          });
        } catch (signErr: any) {
          if (sendTransaction) {
            signature = await sendTransaction(transaction, connection, {
              skipPreflight: false,
              maxRetries: 3,
            });
          } else {
            throw new Error('No transaction signing method available');
          }
        }
      } else if (sendTransaction) {
        signature = await sendTransaction(transaction, connection, {
          skipPreflight: false,
          maxRetries: 3,
        });
      } else {
        throw new Error('No transaction signing method available from wallet');
      }

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Verify PDA account was created
      let accountExists = false;
      for (let i = 0; i < 10; i++) {
        const accountInfo = await connection.getAccountInfo(pda);
        if (accountInfo !== null) {
          accountExists = true;
          break;
        }
        // Wait 500ms before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!accountExists) {
        throw new Error('PDA account was not created. Please try again.');
      }
      
      setSuccess('Bet created! Rolling dice...');

      // Step 2: Generate player roll (client-side for display)
      const generatedPlayerRoll = rollDice();

      // Show rolling animation for player dice
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Set player dice value
      setPlayerRoll(generatedPlayerRoll);
      
      // Show house dice rolling animation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Resolve bet (call backend - server generates house roll securely)
      setSuccess('Resolving bet...');
      
      const resolveBetResponse = await resolveBet({
        pda: pda.toBase58(),
        playerRoll: generatedPlayerRoll,
        // houseRoll removed - server generates it securely
      });

      // Use server-generated house roll from response
      const serverHouseRoll = resolveBetResponse.houseRoll;
      const serverPlayerRoll = resolveBetResponse.playerRoll;
      
      // Update dice displays with server-confirmed values
      setPlayerRoll(serverPlayerRoll);
      setHouseRoll(serverHouseRoll);

      // Wait for dice animations to complete
      await new Promise(resolve => setTimeout(resolve, 800));

      const winner = resolveBetResponse.playerWins;
      
      setPlayerWins(winner);
      setTransactionSignature(resolveBetResponse.signature);
      setShowResult(true);
      setIsRolling(false);

      // Update balance
      await fetchBalance();

      // Save bet to history (use server-confirmed values)
      const totalPayoutSOL = winner ? parseFloat(resolveBetResponse.payout) / LAMPORTS_PER_SOL : 0;
      const netProfitSOL = winner ? totalPayoutSOL - betAmount : 0;
      saveBetToHistory({
        id: pda.toBase58(),
        timestamp: Date.now(),
        betAmount: betAmount,
        playerRoll: serverPlayerRoll,
        houseRoll: serverHouseRoll,
        result: winner ? 'win' : 'lose',
        payout: winner ? netProfitSOL : undefined, // Net profit (total payout - bet amount)
        loss: winner ? undefined : betAmount,
        escrowAccount: pda.toBase58(),
        transactionSignature: resolveBetResponse.signature,
      });

      if (winner) {
        setSuccess(`You won! Payout: ${totalPayoutSOL.toFixed(4)} SOL`);
      } else {
        setSuccess('Bet resolved. Better luck next time!');
      }

    } catch (err: any) {
      console.error('Error in game flow:', err);
      let errorMessage = 'Failed to complete bet';
      
      if (err?.message?.includes('User rejected') || err?.message?.includes('User cancelled')) {
        errorMessage = 'Transaction was cancelled';
      } else if (err?.message?.includes('insufficient')) {
        errorMessage = `Insufficient balance. You need ${(betAmount + 0.002).toFixed(4)} SOL (bet + fees)`;
      } else {
        errorMessage = err?.message || 'An error occurred. Please try again.';
      }

      setError(errorMessage);
      setIsRolling(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #000000 0%, #1a0a2e 25%, #000000 50%, #1a0a2e 75%, #000000 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
      }}
    >
      {/* Animated background grid */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff08_1px,transparent_1px),linear-gradient(to_bottom,#00ffff08_1px,transparent_1px)] bg-[size:4rem_4rem]"
        style={{
          animation: 'gridPulse 3s ease-in-out infinite',
        }}
      ></div>
      
      {/* Floating particles effect - animated stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => {
          const delay = Math.random() * 5;
          const duration = 10 + Math.random() * 20;
          const startX = Math.random() * 100;
          const startY = Math.random() * 100;
          
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${startX}%`,
                top: `${startY}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                background: Math.random() > 0.7 
                  ? 'radial-gradient(circle, rgba(157,78,221,0.8) 0%, rgba(157,78,221,0) 70%)'
                  : 'radial-gradient(circle, rgba(0,255,255,0.8) 0%, rgba(0,255,255,0) 70%)',
                animation: `floatParticle ${duration}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
                boxShadow: '0 0 4px rgba(0, 255, 255, 0.5)',
              }}
            ></div>
          );
        })}
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 mb-1 md:mb-2">
              CYBER DICE PROTOCOL
            </h1>
            <p className="text-cyan-300/70 text-xs md:text-sm">Powered by PDA Escrow</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
            {/* Help/Onboarding Button - "?" */}
            <button
              onClick={() => setShowFirstTimeModal(true)}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-black/60 border-2 border-cyan-400/50 text-cyan-400 font-bold text-lg md:text-xl rounded-lg hover:border-cyan-400 hover:bg-black/80 transition-all duration-300 hover:scale-105 flex-shrink-0"
              title="How to play"
            >
              ?
            </button>
            {/* Bet History Button */}
            {publicKey && (
              <button
                onClick={() => setShowBetHistory(true)}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-black/60 border-2 border-purple-400/50 text-purple-400 font-bold text-xs md:text-sm rounded-lg hover:border-purple-400 hover:bg-black/80 transition-all duration-300 hover:scale-105 flex items-center gap-1 md:gap-2 flex-shrink-0"
              >
                <span>📊</span>
                <span className="hidden sm:inline">HISTORY</span>
              </button>
            )}
            {/* How It Works Button */}
            <button
              onClick={() => setShowHowItWorks(true)}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-black/60 border-2 border-cyan-400/50 text-cyan-400 font-bold text-xs md:text-sm rounded-lg hover:border-cyan-400 hover:bg-black/80 transition-all duration-300 hover:scale-105 flex-shrink-0"
            >
              <span className="hidden sm:inline">HOW IT WORKS</span>
              <span className="sm:hidden">HOW</span>
            </button>
            {balance !== null && publicKey && (
              <div className="px-3 py-1.5 md:px-4 md:py-2 bg-black/40 border border-cyan-400/30 rounded-lg backdrop-blur-sm flex-shrink-0">
                <p className="text-cyan-400 text-xs md:text-sm">
                  <span className="hidden sm:inline">Balance: </span>
                  <span className="font-bold">{balance.toFixed(4)} SOL</span>
                </p>
              </div>
            )}
            <div className="flex-shrink-0">
              <WalletMultiButton className="!bg-gradient-to-r !from-cyan-500 !to-purple-500 hover:!from-cyan-400 hover:!to-purple-400 !text-black !font-bold !rounded-lg !border-2 !border-cyan-400/50 !text-xs md:!text-sm" />
            </div>
          </div>
        </header>

        {/* Wallet connection prompt with leaderboard */}
        {!publicKey && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mt-10 md:mt-20">
            <div className="lg:col-span-2 flex items-center justify-center">
              <div className="max-w-md w-full text-center px-4">
                <div className="bg-gradient-to-br from-cyan-900/30 via-purple-900/30 to-cyan-900/30 backdrop-blur-xl border-2 border-cyan-400/50 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(0,255,255,0.3)]">
                  <div className="text-5xl md:text-6xl mb-4 md:mb-6">🎲</div>
                  <h2 className="text-2xl md:text-3xl font-bold text-cyan-400 mb-3 md:mb-4">Connect Your Wallet</h2>
                  <p className="text-cyan-300/70 text-sm md:text-base mb-6 md:mb-8">Connect your Solana wallet to start playing Cyber Dice Protocol</p>
                  <div className="flex justify-center">
                    <WalletMultiButton className="!bg-gradient-to-r !from-cyan-500 !to-purple-500 hover:!from-cyan-400 hover:!to-purple-400 !text-black !font-bold !rounded-lg !border-2 !border-cyan-400/50 !px-6 md:!px-8 !py-3 md:!py-4 !text-sm md:!text-lg" />
                  </div>
                </div>
              </div>
            </div>
            {/* Leaderboard - visible even when not connected */}
            <div className="lg:col-span-1">
              <Leaderboard limit={10} />
            </div>
          </div>
        )}

        {/* Game interface */}
        {publicKey && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Main game area - takes 2 columns on large screens */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              {/* Bet amount selector */}
              <div className="max-w-2xl mx-auto">
              <div className="bg-black/40 border border-cyan-400/30 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
                <p className="text-cyan-300 text-center mb-3 md:mb-4 font-semibold text-sm md:text-base">SELECT BET AMOUNT</p>
                <div className="flex justify-center gap-2 md:gap-4 flex-wrap">
                  {BET_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setBetAmount(amount)}
                      disabled={isRolling || loading}
                      className={`
                        px-4 py-2 md:px-8 md:py-4 rounded-xl font-bold text-sm md:text-lg transition-all duration-300
                        ${
                          betAmount === amount
                            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-black shadow-[0_0_30px_rgba(0,255,255,0.5)] scale-105'
                            : 'bg-black/60 border-2 border-cyan-400/30 text-cyan-400 hover:border-cyan-400/50 hover:bg-black/80'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {amount} SOL
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dice Arena */}
            <GameArena
              playerRoll={playerRoll}
              houseRoll={houseRoll}
              isRolling={isRolling}
              playerWins={playerWins}
            />

            {/* Roll button */}
            <div className="flex justify-center px-4">
              <button
                onClick={handleRoll}
                disabled={!publicKey || isRolling || loading || (balance !== null && balance < betAmount + 0.002)}
                className={`
                  px-8 py-4 md:px-16 md:py-6 rounded-2xl font-black text-lg md:text-2xl
                  transition-all duration-300 w-full max-w-md md:w-auto
                  ${
                    !publicKey || isRolling || loading || (balance !== null && balance < betAmount + 0.002)
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 text-black shadow-[0_0_40px_rgba(0,255,255,0.6)] hover:shadow-[0_0_60px_rgba(0,255,255,0.8)] hover:scale-105 active:scale-95 animate-pulse-glow'
                  }
                `}
              >
                {isRolling || loading ? 'ROLLING...' : 'ROLL THE DICE'}
              </button>
            </div>
            </div>

            {/* Leaderboard - takes 1 column on large screens */}
            <div className="lg:col-span-1">
              <Leaderboard limit={10} />
            </div>
          </div>
        )}
      </div>

      {/* First Time Hero Modal / Onboarding Modal */}
      {showFirstTimeModal && (
        <FirstTimeHeroModal
          onClose={() => setShowFirstTimeModal(false)}
        />
      )}

      {/* How It Works Modal */}
      <HowItWorksModal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />

      {/* Bet History Modal */}
      <BetHistoryModal
        isOpen={showBetHistory}
        onClose={() => setShowBetHistory(false)}
      />

      {/* Result Overlay */}
      {showResult && playerWins !== undefined && playerRoll !== undefined && houseRoll !== undefined && (
        <ResultOverlay
          playerWins={playerWins}
          amount={betAmount}
          playerRoll={playerRoll}
          houseRoll={houseRoll}
          escrowAccount={escrowAccount}
          transactionSignature={transactionSignature}
          onClose={() => {
            setShowResult(false);
            setPlayerRoll(undefined);
            setHouseRoll(undefined);
            setPlayerWins(undefined);
            setEscrowAccount(undefined);
          }}
        />
      )}

      {/* Toast notifications */}
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
      {success && <SuccessToast message={success} onClose={() => setSuccess(null)} />}
    </div>
  );
}
