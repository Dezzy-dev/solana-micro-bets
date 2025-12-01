import { useEffect } from 'react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    {
      number: 1,
      title: 'Choose your bet amount',
      icon: '💰',
      description: 'Select how much SOL you want to bet from the available options',
    },
    {
      number: 2,
      title: 'Press Roll the Dice',
      icon: '🎲',
      description: 'Initiate the bet by clicking the roll button. Your transaction will be signed.',
    },
    {
      number: 3,
      title: 'Bet enters a PDA escrow',
      icon: '🔒',
      description: 'Your SOL is locked in a Program Derived Address (PDA) escrow account. No one can access it until the bet resolves.',
    },
    {
      number: 4,
      title: 'Player and House roll revealed',
      icon: '🎯',
      description: 'Both dice rolls are generated and displayed. Higher roll wins!',
    },
    {
      number: 5,
      title: 'PDA resolves payout automatically',
      icon: '⚡',
      description: 'If you win, the escrow automatically releases your winnings. No manual intervention needed.',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Side Modal */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg z-[95] bg-gradient-to-br from-cyan-900/40 via-purple-900/40 to-cyan-900/40 backdrop-blur-xl border-l-2 border-cyan-400/50 shadow-[0_0_80px_rgba(0,255,255,0.4)] transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-black/60 backdrop-blur-md border-b border-cyan-400/30 p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400">
                HOW IT WORKS
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg bg-black/60 border border-cyan-400/30 text-cyan-400 hover:border-cyan-400 hover:bg-black/80 transition-all duration-200 flex items-center justify-center font-bold text-xl"
              >
                ×
              </button>
            </div>
            <div className="h-1 w-24 bg-gradient-to-r from-cyan-400 to-transparent" />
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative"
              >
                {/* Step Number Badge */}
                <div className="absolute -left-4 top-0 w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-black font-black text-lg shadow-[0_0_20px_rgba(0,255,255,0.5)] border-2 border-cyan-400">
                  {step.number}
                </div>

                {/* Step Card */}
                <div className="ml-8 bg-black/40 border border-cyan-400/30 rounded-2xl p-6 backdrop-blur-sm hover:border-cyan-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.3)]">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="text-4xl">{step.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-cyan-400 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-cyan-300/70 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Connector Line (except for last step) */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-6 bg-gradient-to-b from-cyan-400/50 to-purple-400/50" />
                )}
              </div>
            ))}

            {/* Additional Info */}
            <div className="mt-8 p-6 bg-black/40 border border-purple-400/30 rounded-2xl backdrop-blur-sm">
              <h3 className="text-xl font-bold text-purple-400 mb-3 flex items-center gap-2">
                <span>💡</span>
                <span>Pro Tip</span>
              </h3>
              <p className="text-purple-300/70 leading-relaxed">
                All bets are secured by Solana's blockchain. The PDA escrow ensures that your funds are safe and automatically distributed based on the game outcome.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-black/60 backdrop-blur-md border-t border-cyan-400/30 p-6">
            <button
              onClick={onClose}
              className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-black text-lg rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.5)] hover:shadow-[0_0_40px_rgba(0,255,255,0.7)] hover:scale-105 active:scale-95 transition-all duration-300"
            >
              GOT IT
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

