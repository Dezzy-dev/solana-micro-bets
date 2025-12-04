import { useEffect, useState } from 'react';

interface FirstTimeHeroModalProps {
  onClose: () => void;
}

const ONBOARDING_STORAGE_KEY = 'cyber-dice-onboarding-completed';
const MIN_BET = 0.05;
const MAX_BET = 0.5;
const MAX_PAYOUT = MAX_BET * 5.5; // 5.5x multiplier

export function FirstTimeHeroModal({ onClose }: FirstTimeHeroModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay for entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade out
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(26, 10, 46, 0.98) 50%, rgba(0, 0, 0, 0.98) 100%)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Animated background grid */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff08_1px,transparent_1px),linear-gradient(to_bottom,#00ffff08_1px,transparent_1px)] bg-[size:4rem_4rem]"
        style={{
          animation: 'gridPulse 3s ease-in-out infinite',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => {
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
            />
          );
        })}
      </div>

      {/* Modal Content */}
      <div className="relative z-10 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div 
          className={`bg-gradient-to-br from-cyan-900/30 via-purple-900/30 to-cyan-900/30 backdrop-blur-xl border-2 border-cyan-400/50 rounded-3xl p-6 md:p-12 shadow-[0_0_80px_rgba(0,255,255,0.4)] transition-transform duration-300 ${
            isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
          }`}
        >
          {/* Corner decorations */}
          <div className="absolute top-4 left-4 w-6 h-6 md:w-8 md:h-8 border-l-2 border-t-2 border-cyan-400/50 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-6 h-6 md:w-8 md:h-8 border-r-2 border-t-2 border-cyan-400/50 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-6 h-6 md:w-8 md:h-8 border-l-2 border-b-2 border-cyan-400/50 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-6 h-6 md:w-8 md:h-8 border-r-2 border-b-2 border-cyan-400/50 rounded-br-lg" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-lg bg-black/60 border border-cyan-400/30 text-cyan-400 hover:border-cyan-400 hover:bg-black/80 transition-all duration-200 flex items-center justify-center font-bold text-xl z-10"
          >
            ×
          </button>

          {/* Title */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 mb-3 md:mb-4">
              CYBER DICE PROTOCOL
            </h1>
            <div className="h-1 w-32 md:w-48 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto mb-3 md:mb-4" />
            <p className="text-base md:text-xl text-cyan-300/80 font-medium px-4">
              Trustless micro-betting powered by Solana PDA escrow
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-4 md:space-y-6 mb-6 md:mb-10">
            {/* What the game is */}
            <section className="bg-black/40 border border-cyan-400/30 rounded-2xl p-4 md:p-6 backdrop-blur-sm hover:border-cyan-400/50 transition-colors">
              <div className="flex items-start gap-3 md:gap-4 mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-black font-black text-lg md:text-xl flex-shrink-0">
                  🎲
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-cyan-400 mb-2">What is Cyber Dice Protocol?</h3>
                  <p className="text-cyan-300/70 leading-relaxed text-sm md:text-base">
                    A decentralized dice game where you roll against the house. Your bet is secured in a 
                    <span className="text-cyan-400 font-semibold"> Program Derived Address (PDA) escrow</span> on Solana, 
                    ensuring your funds are safe until the game resolves. Win or lose, the outcome is transparent and automated.
                  </p>
                </div>
              </div>
            </section>

            {/* How dice roll works */}
            <section className="bg-black/40 border border-purple-400/30 rounded-2xl p-4 md:p-6 backdrop-blur-sm hover:border-purple-400/50 transition-colors">
              <div className="flex items-start gap-3 md:gap-4 mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-black font-black text-lg md:text-xl flex-shrink-0">
                  ⚔️
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-purple-400 mb-2">How the Dice Roll Works</h3>
                  <div className="space-y-2 text-sm md:text-base">
                    <p className="text-purple-300/70 leading-relaxed">
                      Both you and the house roll a 6-sided die (1-6). Your rolls are combined to create a total.
                    </p>
                    <div className="bg-black/40 rounded-lg p-3 border border-purple-400/20">
                      <p className="text-purple-300/90 font-semibold mb-1">Winning Condition:</p>
                      <p className="text-purple-400 font-bold text-lg">
                        If <span className="text-cyan-400">(Your Roll + House Roll) ≥ 9</span> → You Win!
                      </p>
                      <p className="text-purple-300/70 text-xs mt-1">Otherwise, the house wins. (Threshold configurable by house)</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* PDA Escrow */}
            <section className="bg-black/40 border border-cyan-400/30 rounded-2xl p-4 md:p-6 backdrop-blur-sm hover:border-cyan-400/50 transition-colors">
              <div className="flex items-start gap-3 md:gap-4 mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-green-500 flex items-center justify-center text-black font-black text-lg md:text-xl flex-shrink-0">
                  🔒
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-cyan-400 mb-2">Bets Locked in PDA Escrow</h3>
                  <p className="text-cyan-300/70 leading-relaxed text-sm md:text-base">
                    When you place a bet, your SOL is transferred to a <span className="text-cyan-400 font-semibold">PDA (Program Derived Address)</span> escrow account. 
                    This account is cryptographically derived and can only be controlled by the escrow program rules — 
                    <span className="text-green-400 font-semibold">not by the backend, not by the house</span>. Your funds are locked until the bet resolves.
                  </p>
                </div>
              </div>
            </section>

            {/* Player Wins */}
            <section className="bg-black/40 border border-green-400/30 rounded-2xl p-4 md:p-6 backdrop-blur-sm hover:border-green-400/50 transition-colors">
              <div className="flex items-start gap-3 md:gap-4 mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-r from-green-500 to-cyan-500 flex items-center justify-center text-black font-black text-lg md:text-xl flex-shrink-0">
                  ⚡
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-green-400 mb-2">If You Win</h3>
                  <p className="text-green-300/70 leading-relaxed text-sm md:text-base">
                    When you win, the house transfers <span className="text-green-400 font-semibold">5.5x your bet amount</span> directly to your wallet. 
                    This payout comes from the house bankroll, not from the escrow. Your original bet remains in the escrow 
                    and is returned as part of your winnings. Payouts are instant and automatic.
                  </p>
                </div>
              </div>
            </section>

            {/* Player Loses */}
            <section className="bg-black/40 border border-red-400/30 rounded-2xl p-4 md:p-6 backdrop-blur-sm hover:border-red-400/50 transition-colors">
              <div className="flex items-start gap-3 md:gap-4 mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-black font-black text-lg md:text-xl flex-shrink-0">
                  💸
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-red-400 mb-2">If You Lose</h3>
                  <p className="text-red-300/70 leading-relaxed text-sm md:text-base">
                    If the house wins, your bet amount in the escrow account goes to the house. The escrow is settled, 
                    and the SOL you bet is transferred to the house wallet. <span className="text-red-400 font-semibold">No payout is made to you.</span>
                  </p>
                </div>
              </div>
            </section>

            {/* Limits */}
            <section className="bg-black/40 border border-cyan-400/30 rounded-2xl p-4 md:p-6 backdrop-blur-sm hover:border-cyan-400/50 transition-colors">
              <div className="flex items-start gap-3 md:gap-4 mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-black font-black text-lg md:text-xl flex-shrink-0">
                  📊
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-cyan-400 mb-2">Betting Limits</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    <div className="bg-black/40 rounded-lg p-3 border border-cyan-400/20">
                      <p className="text-cyan-300/70 text-xs mb-1">Minimum Bet</p>
                      <p className="text-cyan-400 font-bold text-lg">{MIN_BET} SOL</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 border border-cyan-400/20">
                      <p className="text-cyan-300/70 text-xs mb-1">Maximum Bet</p>
                      <p className="text-cyan-400 font-bold text-lg">{MAX_BET} SOL</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 border border-green-400/20 sm:col-span-2">
                      <p className="text-green-300/70 text-xs mb-1">Maximum Payout (5.5x)</p>
                      <p className="text-green-400 font-bold text-lg">{MAX_PAYOUT} SOL</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Safety */}
            <section className="bg-black/40 border border-yellow-400/30 rounded-2xl p-4 md:p-6 backdrop-blur-sm hover:border-yellow-400/50 transition-colors">
              <div className="flex items-start gap-3 md:gap-4 mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-black font-black text-lg md:text-xl flex-shrink-0">
                  ⚠️
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-yellow-400 mb-2">Safety & Important Notes</h3>
                  <div className="space-y-2 text-sm md:text-base">
                    <div className="bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-3">
                      <p className="text-yellow-300/90 font-semibold mb-1">⚠️ Devnet Only</p>
                      <p className="text-yellow-300/70 leading-relaxed">
                        This application runs on <span className="text-yellow-400 font-semibold">Solana Devnet</span>. 
                        No real funds are at risk. All SOL used is test tokens that have no monetary value.
                      </p>
                    </div>
                    <div className="bg-cyan-900/20 border border-cyan-400/30 rounded-lg p-3">
                      <p className="text-cyan-300/90 font-semibold mb-1">🔓 Open Source</p>
                      <p className="text-cyan-300/70 leading-relaxed">
                        The escrow logic is transparent and open-source. You can verify how bets are secured and resolved 
                        by reviewing the codebase. All transactions are on-chain and verifiable.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Close Button */}
          <div className="flex justify-center">
            <button
              onClick={handleClose}
              className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 text-black font-black text-base md:text-lg rounded-xl shadow-[0_0_40px_rgba(0,255,255,0.6)] hover:shadow-[0_0_60px_rgba(0,255,255,0.8)] hover:scale-105 active:scale-95 transition-all duration-300"
            >
              I UNDERSTAND
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper function to check if user has seen onboarding
 * Can be used to conditionally show the modal
 */
export function hasSeenOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
}

/**
 * Helper function to reset onboarding (for testing)
 */
export function resetOnboarding(): void {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
}
