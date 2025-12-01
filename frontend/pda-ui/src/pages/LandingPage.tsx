import { Link } from 'react-router-dom';
import { SolanaLogo } from '../components/SolanaLogo';

export function LandingPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div
        className="fixed inset-0"
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #1a0a2e 25%, #000000 50%, #1a0a2e 75%, #000000 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 15s ease infinite',
        }}
      >
        {/* Animated grid */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff08_1px,transparent_1px),linear-gradient(to_bottom,#00ffff08_1px,transparent_1px)] bg-[size:4rem_4rem]"
          style={{
            animation: 'gridPulse 3s ease-in-out infinite',
          }}
        />

        {/* Floating particles */}
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
                  background:
                    Math.random() > 0.7
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
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 py-20">
          <div className="max-w-5xl mx-auto text-center">
            {/* Solana Badge */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <SolanaLogo width={48} height={48} circle={true} />
              <span className="text-cyan-400 font-bold text-lg">Built on Solana</span>
            </div>

            {/* Title */}
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 mb-6 animate-pulse-glow">
              CYBER DICE PROTOCOL
            </h1>

            {/* Tagline */}
            <p className="text-2xl md:text-3xl text-cyan-300/90 font-bold mb-8">
              Provably Fair On-Chain Micro-Betting Powered by Solana
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                to="/game"
                className="px-10 py-5 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 text-black font-black text-xl rounded-xl shadow-[0_0_50px_rgba(0,255,255,0.6)] hover:shadow-[0_0_70px_rgba(0,255,255,0.8)] hover:scale-105 active:scale-95 transition-all duration-300"
              >
                PLAY NOW
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-5 bg-black/60 border-2 border-cyan-400/50 text-cyan-400 font-bold text-xl rounded-xl hover:border-cyan-400 hover:bg-black/80 transition-all duration-300 hover:scale-105"
              >
                VIEW SOURCE
              </a>
            </div>

            {/* Disclaimer */}
            <p className="text-yellow-400/80 text-sm font-semibold">
              ⚠️ Devnet Only – No Real Funds
            </p>

            {/* Scroll indicator */}
            <div className="mt-16 animate-bounce">
              <button
                onClick={() => scrollToSection('what-is')}
                className="text-cyan-400/70 hover:text-cyan-400 transition-colors"
              >
                <svg
                  className="w-8 h-8 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* What is Cyber Dice Protocol */}
        <section id="what-is" className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-black/40 border-2 border-cyan-400/30 rounded-3xl p-8 md:p-12 backdrop-blur-xl">
              <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-6">
                What is Cyber Dice Protocol?
              </h2>
              <div className="space-y-4 text-cyan-300/80 text-lg leading-relaxed">
                <p>
                  Cyber Dice Protocol is a <span className="text-cyan-400 font-bold">fully on-chain, provably fair dice game</span> built natively on Solana.
                  Unlike traditional betting platforms that rely on centralized servers, every aspect of Cyber Dice Protocol
                  operates transparently on the Solana blockchain.
                </p>
                <p>
                  All bets are locked in a <span className="text-purple-400 font-bold">Solana PDA (Program Derived Address) escrow account</span>,
                  ensuring that funds are secured on-chain until the bet is resolved. This decentralized custody model means
                  no single party controls player funds.
                </p>
                <p>
                  Results are resolved by the backend but settled <span className="text-green-400 font-bold">trustlessly via Solana transactions</span>.
                  Every payout is a verifiable on-chain transaction, giving players complete transparency and security.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Solana Features */}
        <section id="solana-features" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-12 text-center">
              Why Solana?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: '⚡',
                  title: 'Ultra-Fast',
                  desc: '400ms block times enable instant transactions',
                },
                {
                  icon: '🔒',
                  title: 'PDA Escrow',
                  desc: 'Decentralized fund custody via Program Derived Addresses',
                },
                {
                  icon: '💰',
                  title: 'Lamport-Precise',
                  desc: 'Exact payouts down to the smallest Solana unit',
                },
                {
                  icon: '👛',
                  title: 'Wallet Integration',
                  desc: 'Phantom, Solflare, Backpack, and more',
                },
                {
                  icon: '🏦',
                  title: 'House Treasury',
                  desc: 'On-chain admin keys for transparent house management',
                },
                {
                  icon: '📊',
                  title: 'Real-Time Balance',
                  desc: 'Instant balance updates via getBalance RPC calls',
                },
                {
                  icon: '💸',
                  title: 'Low Cost',
                  desc: 'Transaction fees under $0.0001',
                },
                {
                  icon: '🚀',
                  title: 'High Throughput',
                  desc: 'Ideal infrastructure for micro-betting',
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-black/40 border-2 border-cyan-400/30 rounded-2xl p-6 backdrop-blur-sm hover:border-cyan-400/50 transition-all duration-300 hover:scale-105"
                >
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-cyan-400 mb-2">{feature.title}</h3>
                  <p className="text-cyan-300/70 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-12 text-center">
              How It Works
            </h2>
            <div className="space-y-6">
              {[
                {
                  step: '1',
                  title: 'Choose Bet Amount',
                  desc: 'Player selects their bet amount from predefined options',
                  borderClass: 'border-cyan-400/30 hover:border-cyan-400/50',
                  titleClass: 'text-cyan-400',
                  textClass: 'text-cyan-300/70',
                  gradientClass: 'from-cyan-500 to-purple-500',
                },
                {
                  step: '2',
                  title: 'Smart Escrow Deposit',
                  desc: 'Bet Create transaction locks funds in a PDA escrow account',
                  borderClass: 'border-purple-400/30 hover:border-purple-400/50',
                  titleClass: 'text-purple-400',
                  textClass: 'text-purple-300/70',
                  gradientClass: 'from-purple-500 to-pink-500',
                },
                {
                  step: '3',
                  title: 'Dice Roll Resolution',
                  desc: 'Server-side dice roll with transparent, verifiable logic',
                  borderClass: 'border-green-400/30 hover:border-green-400/50',
                  titleClass: 'text-green-400',
                  textClass: 'text-green-300/70',
                  gradientClass: 'from-green-500 to-emerald-500',
                },
                {
                  step: '4',
                  title: 'Automatic Payout',
                  desc: 'Winner automatically receives payout from escrow on Solana',
                  borderClass: 'border-yellow-400/30 hover:border-yellow-400/50',
                  titleClass: 'text-yellow-400',
                  textClass: 'text-yellow-300/70',
                  gradientClass: 'from-yellow-500 to-orange-500',
                },
                {
                  step: '5',
                  title: 'House Treasury',
                  desc: 'All losing bets flow into the house treasury account',
                  borderClass: 'border-red-400/30 hover:border-red-400/50',
                  titleClass: 'text-red-400',
                  textClass: 'text-red-300/70',
                  gradientClass: 'from-red-500 to-pink-500',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`bg-black/40 border-2 ${item.borderClass} rounded-2xl p-6 backdrop-blur-sm transition-all duration-300`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${item.gradientClass} flex items-center justify-center text-black font-black text-xl flex-shrink-0`}>
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-2xl font-bold ${item.titleClass} mb-2`}>
                        {item.title}
                      </h3>
                      <p className={`${item.textClass} leading-relaxed`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section id="key-features" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-12 text-center">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: '⚡',
                  title: 'Fast',
                  desc: 'Powered by Solana’s 400ms blocks',
                  gradient: 'from-yellow-400 to-orange-500',
                },
                {
                  icon: '💎',
                  title: 'Cheap',
                  desc: '< $0.0001 transaction cost',
                  gradient: 'from-green-400 to-emerald-500',
                },
                {
                  icon: '🔍',
                  title: 'Transparent',
                  desc: 'Public escrow and house accounts',
                  gradient: 'from-cyan-400 to-blue-500',
                },
                {
                  icon: '🛡️',
                  title: 'Secure',
                  desc: 'Admin keys separated and protected',
                  gradient: 'from-purple-400 to-pink-500',
                },
                {
                  icon: '📖',
                  title: 'Open-Source',
                  desc: 'Code available for audit',
                  gradient: 'from-cyan-400 to-purple-400',
                },
                {
                  icon: '🎲',
                  title: 'Provably Fair',
                  desc: 'On-chain verification of all outcomes',
                  gradient: 'from-green-400 to-cyan-400',
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-black/40 border-2 border-cyan-400/30 rounded-2xl p-6 backdrop-blur-sm hover:border-cyan-400/50 transition-all duration-300 hover:scale-105"
                >
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-3xl mb-4 flex-shrink-0`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-cyan-400 mb-2">{feature.title}</h3>
                  <p className="text-cyan-300/70">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Architecture Diagram */}
        <section id="architecture" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-12 text-center">
              Architecture
            </h2>
            <div className="bg-black/40 border-2 border-cyan-400/30 rounded-3xl p-8 md:p-12 backdrop-blur-xl">
              <div className="space-y-8">
                {/* Flow visualization */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                  {/* Wallet */}
                  <div className="bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-2 border-purple-400/50 rounded-2xl p-6 text-center min-w-[200px]">
                    <div className="text-4xl mb-2">👛</div>
                    <h3 className="font-bold text-purple-400 mb-1">Solana Wallet</h3>
                    <p className="text-xs text-purple-300/70">Player funds</p>
                  </div>

                  {/* Arrow */}
                  <div className="text-cyan-400 text-2xl font-bold">→</div>

                  {/* Backend */}
                  <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400/50 rounded-2xl p-6 text-center min-w-[200px]">
                    <div className="text-4xl mb-2">⚙️</div>
                    <h3 className="font-bold text-cyan-400 mb-1">Backend API</h3>
                    <p className="text-xs text-cyan-300/70">Bet creation & resolution</p>
                  </div>

                  {/* Arrow */}
                  <div className="text-cyan-400 text-2xl font-bold">→</div>

                  {/* PDA Escrow */}
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 rounded-2xl p-6 text-center min-w-[200px]">
                    <div className="text-4xl mb-2">🔒</div>
                    <h3 className="font-bold text-green-400 mb-1">PDA Escrow</h3>
                    <p className="text-xs text-green-300/70">On-chain custody</p>
                  </div>

                  {/* Arrow */}
                  <div className="text-cyan-400 text-2xl font-bold">→</div>

                  {/* Settlement */}
                  <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/50 rounded-2xl p-6 text-center min-w-[200px]">
                    <div className="text-4xl mb-2">✅</div>
                    <h3 className="font-bold text-yellow-400 mb-1">Settlement</h3>
                    <p className="text-xs text-yellow-300/70">Automatic payout</p>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-8 text-center text-cyan-300/80 space-y-2">
                  <p>
                    Player initiates bet from wallet → Backend creates transaction → Funds locked in PDA escrow →
                    Result resolved → Automatic payout on-chain
                  </p>
                  <p className="text-sm text-cyan-300/60">
                    All transactions are verifiable on Solana's public blockchain
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hackathon Disclaimer */}
        <section id="disclaimer" className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-yellow-900/20 border-2 border-yellow-400/50 rounded-3xl p-8 md:p-12 backdrop-blur-xl">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🏆</div>
                <h2 className="text-3xl md:text-4xl font-black text-yellow-400 mb-4">
                  Hackathon Demo
                </h2>
              </div>
              <div className="space-y-4 text-yellow-300/90 text-center">
                <p className="text-lg">
                  This is a hackathon demo running on <span className="font-bold text-yellow-400">Solana Devnet</span>.
                </p>
                <p>
                  All code is <span className="font-bold text-cyan-400">open-source and educational</span>.
                  You can review, audit, and learn from the implementation.
                </p>
                <p className="font-bold text-yellow-400 text-xl">
                  ⚠️ No real-money gambling. Devnet tokens have no value.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t-2 border-cyan-400/20">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              {/* Left: Solana Badge & Copyright */}
              <div className="flex flex-col items-center md:items-start gap-4">
                <div className="flex items-center gap-3">
                  <SolanaLogo width={40} height={40} circle={true} />
                  <span className="text-cyan-400 font-bold">Built on Solana</span>
                </div>
                <p className="text-cyan-300/50 text-sm">
                  © 2025 Cyber Dice Protocol. Open-source demo.
                </p>
              </div>

              {/* Right: Links */}
              <div className="flex flex-wrap justify-center md:justify-end gap-6">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400/70 hover:text-cyan-400 transition-colors flex items-center gap-2"
                >
                  <span className="text-xl">📦</span>
                  <span>GitHub</span>
                </a>
                <a
                  href="https://discord.gg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400/70 hover:text-cyan-400 transition-colors flex items-center gap-2"
                >
                  <span className="text-xl">💬</span>
                  <span>Discord</span>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400/70 hover:text-cyan-400 transition-colors flex items-center gap-2"
                >
                  <span className="text-xl">🐦</span>
                  <span>Twitter</span>
                </a>
                <a
                  href="https://indie.fun"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400/70 hover:text-cyan-400 transition-colors flex items-center gap-2"
                >
                  <span className="text-xl">🎮</span>
                  <span>Indie.fun</span>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

