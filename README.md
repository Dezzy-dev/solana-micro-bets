# Solana Micro-Bets dApp

A decentralized micro-betting application built on Solana blockchain, featuring a React frontend and Node.js/Express backend.

## 🚀 Project Overview

Solana Micro-Bets is a fast, low-cost betting platform leveraging Solana's high-performance blockchain. Users can place micro-bets with minimal transaction fees and near-instant settlement.

## 📁 Folder Structure

```
solana-micro-bets/
├── frontend/                 # React + Vite frontend application
│   ├── src/
│   │   ├── App.jsx          # Main React component
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # Global styles
│   ├── index.html           # HTML template
│   ├── vite.config.js       # Vite configuration
│   └── package.json         # Frontend dependencies
│
├── backend/                  # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── index.ts         # Express server entry point
│   │   ├── routes/
│   │   │   └── bet.ts       # Betting routes
│   │   └── services/
│   │       ├── solana.ts    # Solana blockchain integration
│   │       ├── rng.ts       # Random number generation
│   │       └── payout.ts    # Payout processing
│   ├── tsconfig.json        # TypeScript configuration
│   └── package.json         # Backend dependencies
│
└── README.md                 # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Solana CLI** (optional, for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd solana-micro-bets
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Environment Setup**
   
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=3000
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   # Add other environment variables as needed
   ```

## 🏃 Running the Application

### Development Mode

**Frontend:**
```bash
cd frontend
npm run dev
```
The frontend will be available at `http://localhost:5173` (default Vite port).

**Backend:**
```bash
cd backend
npm run dev
```
The backend API will be available at `http://localhost:3000`.

### Production Build

**Frontend:**
```bash
cd frontend
npm run build      # Build for production
npm run preview    # Preview production build
```

**Backend:**
```bash
cd backend
npm run build      # Compile TypeScript
npm start          # Run production server
```

## 📡 API Endpoints

### Base URL
- Development: `http://localhost:3000`
- Production: (configure as needed)

### Available Endpoints

- `GET /` - Health check endpoint
  - Returns: `"Micro-Bets backend running"`

- `POST /api/bet` - Place a bet
  - Returns: `{message: "bet endpoint working"}`

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Modern ES6+** - JavaScript features

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **@solana/web3.js** - Solana blockchain SDK
- **@solana/actions** - Solana Actions SDK

## 🎯 Hackathon Context

<!-- TODO: Add hackathon details -->
- **Event:** [Hackathon Name]
- **Track:** [Track/Category]
- **Theme:** [Theme if applicable]
- **Submission Date:** [Date]
- **Team:** [Team Name/Members]

### Project Goals
- [ ] Implement Solana wallet integration
- [ ] Create betting mechanism with on-chain verification
- [ ] Implement secure random number generation
- [ ] Build payout system
- [ ] Design intuitive user interface
- [ ] Add real-time bet status updates

### Key Features
- Fast transaction processing on Solana
- Low-cost micro-betting
- Transparent and verifiable outcomes
- Secure smart contract integration

## 🔒 Security Considerations

- All sensitive operations should be verified on-chain
- Never store private keys in the backend
- Use proper wallet integration patterns
- Validate all user inputs
- Implement rate limiting for API endpoints

## 📝 Development Notes

- The backend uses TypeScript for type safety
- Frontend uses Vite for fast development and optimized builds
- All Solana interactions should go through the backend services
- RNG service should use verifiable randomness (e.g., Switchboard, Pyth)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

[Add your license here]

## 🔗 Resources

- [Solana Documentation](https://docs.solana.com/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

---

**Built with ❤️ for the Solana ecosystem**

