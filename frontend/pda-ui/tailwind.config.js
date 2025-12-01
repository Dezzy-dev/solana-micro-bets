/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#00ffff',
          green: '#00ff88',
          purple: '#9d4edd',
          pink: '#ff006e',
        },
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'neonExplosion': 'neonExplosion 1.5s ease-out forwards',
        'neonGlow': 'neonGlow 2s ease-in-out infinite',
        'redPulse': 'redPulse 1s ease-in-out infinite',
        'redGlow': 'redGlow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 255, 255, 0.5), 0 0 10px rgba(0, 255, 255, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px) rotate(-5deg)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(10px) rotate(5deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 20px rgba(0, 255, 136, 0.5)' },
          '50%': { opacity: 0.7, boxShadow: '0 0 40px rgba(0, 255, 136, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
