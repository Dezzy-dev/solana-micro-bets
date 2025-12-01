import { useEffect } from 'react';

interface ResultOverlayProps {
  playerWins: boolean;
  amount: number;
  playerRoll: number;
  houseRoll: number;
  escrowAccount?: string;
  transactionSignature?: string;
  onClose: () => void;
}

export function ResultOverlay({ 
  playerWins, 
  amount, 
  playerRoll,
  houseRoll,
  escrowAccount,
  transactionSignature, 
  onClose 
}: ResultOverlayProps) {
  const isWin = playerWins;
  
  // Auto-close after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  const colorClass = isWin 
    ? 'from-green-500/20 via-cyan-500/20 to-green-500/20 border-green-400/50'
    : 'from-red-500/20 via-pink-500/20 to-red-500/20 border-red-400/50';
  
  const glowColor = isWin
    ? 'shadow-[0_0_60px_rgba(0,255,136,0.6),0_0_120px_rgba(0,255,136,0.3)]'
    : 'shadow-[0_0_60px_rgba(255,0,110,0.6),0_0_120px_rgba(255,0,110,0.3)]';

  const textGradient = isWin
    ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-400 to-green-400'
    : 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-pink-400 to-red-400';

  const shortAddress = (addr: string) => {
    if (!addr) return 'N/A';
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
      onClick={onClose}
    >
      {/* Explosion animation for wins */}
      {isWin && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 animate-neonExplosion">
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(0, 255, 136, 0.3) 0%, rgba(0, 255, 255, 0.2) 40%, transparent 70%)'
              }}
            />
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-2xl"
              style={{
                background: 'radial-gradient(circle, rgba(0, 255, 255, 0.4) 0%, rgba(0, 255, 136, 0.3) 50%, transparent 70%)'
              }}
            />
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-xl"
              style={{
                background: 'radial-gradient(circle, rgba(0, 255, 136, 0.5) 0%, transparent 70%)'
              }}
            />
          </div>
        </div>
      )}

      {/* Red pulse animation for losses */}
      {!isWin && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 animate-redPulse">
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-2xl"
              style={{
                background: 'radial-gradient(circle, rgba(255, 0, 110, 0.2) 0%, rgba(255, 0, 110, 0.1) 50%, transparent 70%)'
              }}
            />
          </div>
        </div>
      )}

      <div 
        className={`
          relative bg-gradient-to-br ${colorClass}
          border-2 ${glowColor}
          backdrop-blur-xl rounded-3xl p-8 md:p-12 max-w-lg w-full mx-4
          ${isWin ? 'animate-neonGlow' : 'animate-redGlow'}
          cursor-default
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner decorations */}
        <div className={`absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 ${isWin ? 'border-green-400' : 'border-red-400'} rounded-tl-lg`} />
        <div className={`absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 ${isWin ? 'border-green-400' : 'border-red-400'} rounded-tr-lg`} />
        <div className={`absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 ${isWin ? 'border-green-400' : 'border-red-400'} rounded-bl-lg`} />
        <div className={`absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 ${isWin ? 'border-green-400' : 'border-red-400'} rounded-br-lg`} />

        {/* Result text */}
        <div className="text-center mb-6">
          <h2 className={`text-5xl md:text-6xl font-black mb-4 ${textGradient}`}>
            {isWin ? 'YOU WIN' : 'YOU LOST'}
          </h2>
          {isWin && (
            <p className={`text-3xl md:text-4xl font-bold mb-2 ${textGradient}`}>
              +{amount.toFixed(4)} SOL
            </p>
          )}
          <div className={`h-1 w-48 ${isWin ? 'bg-gradient-to-r from-transparent via-green-400 to-transparent' : 'bg-gradient-to-r from-transparent via-red-400 to-transparent'} mx-auto`} />
        </div>

        {/* Roll details */}
        <div className="mb-6 p-4 bg-black/40 rounded-xl border border-cyan-400/30">
          <div className="flex justify-between items-center mb-2">
            <p className="text-cyan-300 text-sm">Player Roll:</p>
            <p className="text-cyan-400 font-bold text-lg">{playerRoll}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-purple-300 text-sm">House Roll:</p>
            <p className="text-purple-400 font-bold text-lg">{houseRoll}</p>
          </div>
        </div>

        {/* Escrow Account */}
        {escrowAccount && (
          <div className="mb-4 p-4 bg-black/40 rounded-xl border border-cyan-400/30">
            <p className="text-cyan-300 text-xs mb-1">Escrow Account:</p>
            <p className="text-cyan-400 text-xs font-mono break-all">
              {escrowAccount}
            </p>
          </div>
        )}

        {/* Transaction signature link */}
        {transactionSignature && (
          <div className="mb-6 p-4 bg-black/40 rounded-xl border border-cyan-400/30">
            <p className="text-cyan-300 text-xs mb-1">Tx Signature:</p>
            <a
              href={`https://solscan.io/tx/${transactionSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 text-xs font-mono break-all underline transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {shortAddress(transactionSignature)}
            </a>
          </div>
        )}

        {/* Close hint */}
        <p className="text-center text-cyan-300/50 text-xs mb-4">
          Click anywhere or wait 4 seconds to close
        </p>

        {/* Close button */}
        <button
          onClick={onClose}
          className={`
            w-full py-4 px-8 rounded-xl font-bold text-lg
            transition-all duration-300
            ${isWin 
              ? 'bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-black shadow-[0_0_20px_rgba(0,255,136,0.5)]' 
              : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white shadow-[0_0_20px_rgba(255,0,110,0.5)]'
            }
            hover:scale-105 active:scale-95
          `}
        >
          CONTINUE
        </button>
      </div>
    </div>
  );
}
