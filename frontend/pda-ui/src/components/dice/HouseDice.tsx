import { useEffect, useState } from 'react';

interface HouseDiceProps {
  value?: number;
  isRolling?: boolean;
  hasWon?: boolean;
}

const DICE_FACES = [
  // Face 1
  <div key="1" className="flex items-center justify-center w-full h-full">
    <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
  </div>,
  // Face 2
  <div key="2" className="flex items-center justify-between w-full h-full p-4">
    <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
  </div>,
  // Face 3
  <div key="3" className="flex flex-col items-center justify-between w-full h-full p-4">
    <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
  </div>,
  // Face 4
  <div key="4" className="grid grid-cols-2 gap-4 w-full h-full p-4">
    <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
  </div>,
  // Face 5
  <div key="5" className="grid grid-cols-3 gap-2 w-full h-full p-4">
    <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)] col-start-2"></div>
    <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
  </div>,
  // Face 6
  <div key="6" className="grid grid-cols-2 gap-3 w-full h-full p-4">
    <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
    <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(196,181,253,0.8)]"></div>
  </div>,
];

export function HouseDice({ value, isRolling = false, hasWon }: HouseDiceProps) {
  const [displayValue, setDisplayValue] = useState<number>(1);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isRolling) {
      setIsAnimating(true);
      // Rapidly change dice face during roll
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 100);
      
      // Stop rolling after animation duration
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setIsAnimating(false);
        if (value !== undefined) {
          setDisplayValue(value);
        }
      }, 1200); // Slightly longer than player dice
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else if (value !== undefined) {
      setDisplayValue(value);
      setIsAnimating(false);
    }
  }, [isRolling, value]);

  const glowColor = hasWon 
    ? 'shadow-[0_0_30px_rgba(255,0,110,0.8),0_0_60px_rgba(255,0,110,0.5)]'
    : 'shadow-[0_0_20px_rgba(157,78,221,0.6),0_0_40px_rgba(157,78,221,0.3)]';

  return (
    <div className="relative">
      <div
        className={`
          relative w-32 h-32 bg-gradient-to-br from-purple-900/50 to-purple-950/50
          border-2 border-purple-400/50 rounded-xl
          backdrop-blur-sm
          flex items-center justify-center
          transition-all duration-500
          ${isAnimating ? 'animate-shake' : ''}
          ${glowColor}
          ${!isRolling && value ? 'animate-pulse-glow' : 'animate-glow'}
        `}
      >
        {/* Glassmorphism effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent rounded-xl"></div>
        
        {/* Dice face */}
        <div className="relative z-10 w-full h-full">
          {DICE_FACES[displayValue - 1]}
        </div>

        {/* Corner accents */}
        <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 border-purple-400/50 rounded-tl-lg"></div>
        <div className="absolute top-1 right-1 w-3 h-3 border-r-2 border-t-2 border-purple-400/50 rounded-tr-lg"></div>
        <div className="absolute bottom-1 left-1 w-3 h-3 border-l-2 border-b-2 border-purple-400/50 rounded-bl-lg"></div>
        <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-purple-400/50 rounded-br-lg"></div>
      </div>
      
      {/* Label */}
      <div className="mt-4 text-center">
        <p className="text-purple-400 font-bold text-lg">HOUSE</p>
        {value && !isRolling && (
          <p className="text-purple-300 text-sm mt-1">Roll: {value}</p>
        )}
      </div>
    </div>
  );
}
