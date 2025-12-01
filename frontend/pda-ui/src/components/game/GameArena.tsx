import { PlayerDice } from '../dice/PlayerDice';
import { HouseDice } from '../dice/HouseDice';

interface GameArenaProps {
  playerRoll?: number;
  houseRoll?: number;
  isRolling: boolean;
  playerWins?: boolean;
}

export function GameArena({ playerRoll, houseRoll, isRolling, playerWins }: GameArenaProps) {
  return (
    <div className="relative w-full max-w-4xl mx-auto px-4">
      {/* Glass panel container */}
      <div className="relative bg-gradient-to-br from-cyan-900/20 via-purple-900/20 to-cyan-900/20 backdrop-blur-xl border-2 border-cyan-400/30 rounded-3xl p-6 md:p-12 shadow-[0_0_50px_rgba(0,255,255,0.2)]">
        {/* Animated border glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-cyan-400/20 opacity-50 animate-pulse"></div>
        
        {/* Corner decorations */}
        <div className="absolute top-2 left-2 md:top-4 md:left-4 w-6 h-6 md:w-8 md:h-8 border-l-2 border-t-2 border-cyan-400/50 rounded-tl-lg"></div>
        <div className="absolute top-2 right-2 md:top-4 md:right-4 w-6 h-6 md:w-8 md:h-8 border-r-2 border-t-2 border-cyan-400/50 rounded-tr-lg"></div>
        <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 w-6 h-6 md:w-8 md:h-8 border-l-2 border-b-2 border-cyan-400/50 rounded-bl-lg"></div>
        <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 w-6 h-6 md:w-8 md:h-8 border-r-2 border-b-2 border-cyan-400/50 rounded-br-lg"></div>

        {/* Title */}
        <div className="text-center mb-6 md:mb-12 relative z-10">
          <h2 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 mb-2">
            DICE ARENA
          </h2>
          <div className="h-1 w-20 md:w-32 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto"></div>
        </div>

        {/* Dice container */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-around mb-6 md:mb-8 gap-6 md:gap-0">
          {/* Player Dice */}
          <div className="flex flex-col items-center">
            <PlayerDice 
              value={playerRoll} 
              isRolling={isRolling && playerRoll === undefined}
              hasWon={playerWins === true}
            />
          </div>

          {/* VS Divider */}
          <div className="flex flex-row md:flex-col items-center gap-4 md:gap-0 md:mx-8">
            <div className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 md:mb-4">
              VS
            </div>
            <div className="w-16 md:w-1 h-1 md:h-24 bg-gradient-to-r md:bg-gradient-to-b from-cyan-400/50 via-purple-400/50 to-cyan-400/50 rounded-full"></div>
          </div>

          {/* House Dice */}
          <div className="flex flex-col items-center">
            <HouseDice 
              value={houseRoll} 
              isRolling={isRolling && houseRoll === undefined}
              hasWon={playerWins === false}
            />
          </div>
        </div>

        {/* Results display */}
        {playerRoll !== undefined && houseRoll !== undefined && !isRolling && (
          <div className="mt-6 md:mt-8 text-center relative z-10">
            <div className="inline-block px-4 py-3 md:px-8 md:py-4 bg-black/40 border border-cyan-400/30 rounded-xl backdrop-blur-sm">
              <p className="text-cyan-300 text-sm md:text-lg mb-1">
                Player: <span className="font-bold text-cyan-400">{playerRoll}</span>
              </p>
              <p className="text-purple-300 text-sm md:text-lg mb-2">
                House: <span className="font-bold text-purple-400">{houseRoll}</span>
              </p>
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent my-2"></div>
              <p className="text-lg md:text-xl font-bold text-cyan-400">
                Total: <span className="text-xl md:text-2xl">{playerRoll + houseRoll}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
