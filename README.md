# 🎲 Solana Micro-Bets dApp

A decentralized micro-betting application built on Solana blockchain, featuring a modern React frontend and Vercel serverless backend. Players can place bets using Solana wallets, with transparent on-chain verification and instant payouts.

## ✨ Features

- 🎮 **Interactive Dice Game**: Roll dice and win with a 5.5x multiplier
- 💰 **Solana Wallet Integration**: Connect with Phantom, Solflare, or any Solana wallet
- 📊 **Real-time Leaderboard**: Track top players by wins and earnings
- 🏠 **Admin Dashboard**: Comprehensive house management with statistics
- 📈 **Bet History**: View all your past bets and outcomes
- 🎯 **PDA Escrow System**: Secure, on-chain bet escrow using Program Derived Addresses
- ⚡ **Serverless Backend**: Fast, scalable API using Vercel serverless functions
- 🎨 **Modern UI**: Beautiful dark theme with smooth animations

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling
- **Solana Wallet Adapter** for wallet integration
- **React Router** for navigation

### Backend
- **Vercel Serverless Functions** for API endpoints
- **Supabase** for database (bets, users, leaderboard)
- **Solana Web3.js** for blockchain interactions
- **PDA Escrow System** for secure bet handling

### Game Mechanics
- Players roll a die (1-6)
- House rolls a die (1-6)
- Total = Player Roll + House Roll (2-12)
- **Player wins if total ≥ 9** (configurable threshold)
- **5.5x payout** for winning bets
- House edge: ~72% (with threshold 9)

## 📁 Project Structure

```
solana-micro-bets/
├── api/                          # Vercel serverless functions
│   ├── admin/                    # Admin endpoints
│   │   ├── house/               # House management
│   │   │   ├── balance.js
│   │   │   ├── deposit.js
│   │   │   ├── withdraw.js
│   │   │   └── profit-loss.js
│   │   └── stats.js             # Detailed statistics
│   ├── bets/                     # Bet endpoints
│   │   ├── create.js
│   │   └── resolve.js
│   ├── house/
│   │   └── max-payout.js        # Public max payout info
│   ├── leaderboard.js           # Leaderboard API
│   ├── history.js               # Bet history API
│   └── cancel-bet.js            # Bet cancellation
│
├── frontend/
│   └── pda-ui/                  # Main React frontend
│       ├── src/
│       │   ├── components/      # React components
│       │   │   ├── AdminStats.tsx
│       │   │   ├── GameArena.tsx
│       │   │   ├── Leaderboard.tsx
│       │   │   └── ...
│       │   ├── pages/           # Page components
│       │   │   ├── AdminDashboard.tsx
│       │   │   ├── game.tsx
│       │   │   └── LandingPage.tsx
│       │   └── utils/           # Utilities
│       │       ├── api.ts
│       │       ├── adminApi.ts
│       │       └── ...
│       └── package.json
│
├── backend/                     # Backend services
│   ├── services/                # Business logic
│   │   ├── bet/                 # Bet services
│   │   ├── admin/               # Admin services
│   │   └── history/              # History services
│   ├── db/                      # Database helpers
│   │   ├── supabaseClient.js
│   │   └── dbHelpers.js
│   ├── solana/                  # Solana utilities
│   │   └── solanaClient.js
│   └── utils/                   # General utilities
│       └── houseWallet.js
│
├── supabase/                    # Database migrations
│   └── migrations/
│       ├── 20240101000000_create_bets_and_users_tables.sql
│       └── 20240102000000_add_nonce_bump_to_bets.sql
│
├── vercel.json                  # Vercel configuration
└── package.json                 # Root dependencies
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Solana Wallet** (Phantom, Solflare, etc.)
- **Supabase Account** (for database)
- **Vercel Account** (for deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Dezzy-dev/solana-micro-bets.git
   cd solana-micro-bets
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend/pda-ui
   npm install
   ```

4. **Set up environment variables**

   Create `.env` file in `frontend/pda-ui/`:
   ```env
   VITE_PUBLIC_API_URL=
   ```
   (Leave empty for relative paths in production)

5. **Set up Supabase**
   - Create a Supabase project
   - Run migrations from `supabase/migrations/`
   - Get your Supabase URL and service role key

6. **Run the frontend**
   ```bash
   cd frontend/pda-ui
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`

### Testing with Vercel Dev

To test serverless functions locally:

```bash
npm install -g vercel
vercel dev
```

## 🌐 Deployment

### Vercel Deployment

1. **Connect your GitHub repository to Vercel**

2. **Configure Vercel settings:**
   - **Root Directory**: Leave empty (project root)
   - **Build Command**: `cd frontend/pda-ui && npm install && npm run build`
   - **Output Directory**: `frontend/pda-ui/dist`

3. **Set Environment Variables in Vercel Dashboard:**

   **Required:**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   HOUSE_KEYPAIR_SECRET_KEY=[1,2,3,4,5,...]  # JSON array as string
   ADMIN_API_KEY=your-secret-admin-key
   RPC_URL=https://api.devnet.solana.com
   WIN_THRESHOLD=9
   DEFAULT_SAFETY_FACTOR=0.9
   BET_TIMEOUT_SECONDS=3600
   ```

   **Important:**
   ```env
   VITE_PUBLIC_API_URL=
   ```
   Leave this **empty** (or delete it) so the frontend uses relative paths.

4. **Deploy**
   - Push to GitHub
   - Vercel will automatically deploy
   - Your app will be live at `https://your-project.vercel.app`

## 📡 API Endpoints

### Public Endpoints

#### `GET /api/leaderboard`
Get top players leaderboard.

**Query Parameters:**
- `limit` (optional): Number of players (default: 20, max: 100)
- `orderBy` (optional): `'wins'` or `'earned'` (default: `'wins'`)

**Response:**
```json
{
  "success": true,
  "leaderboard": [...],
  "count": 20,
  "orderBy": "wins"
}
```

#### `GET /api/house/max-payout`
Get maximum payout configuration (public).

**Response:**
```json
{
  "success": true,
  "maxPayoutSOL": 4.5,
  "houseBalanceSOL": 5.0,
  "safetyFactor": 0.9
}
```

#### `GET /api/history?wallet=<address>`
Get bet history for a wallet.

### Bet Endpoints

#### `POST /api/bets/create`
Create a new bet transaction.

**Request:**
```json
{
  "playerPubkey": "string",
  "amountLamports": 100000000,
  "nonce": 0
}
```

**Response:**
```json
{
  "success": true,
  "transaction": "base64-encoded-transaction",
  "pda": "PDA-address",
  "bump": 255
}
```

#### `POST /api/bets/resolve`
Resolve a bet (house signs and sends).

**Request:**
```json
{
  "pda": "PDA-address",
  "playerRoll": 4
}
```

**Response:**
```json
{
  "success": true,
  "signature": "transaction-signature",
  "payout": "550000000",
  "playerWins": true,
  "playerRoll": 4,
  "houseRoll": 5,
  "totalRoll": 9
}
```

### Admin Endpoints (Require API Key)

All admin endpoints require `x-api-key` header with your `ADMIN_API_KEY`.

#### `GET /api/admin/house/balance`
Get current house balance.

#### `GET /api/admin/stats`
Get detailed house statistics (deposits, losses, profits, player losses).

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalBets": 100,
    "winningBets": 28,
    "losingBets": 72,
    "totalPlayerLosses": 7.2,
    "totalPayouts": 4.4,
    "netProfit": 2.8
  },
  "betStats": [...]
}
```

#### `POST /api/admin/house/deposit`
Deposit funds to house (for demo purposes).

#### `POST /api/admin/house/withdraw`
Withdraw funds from house.

#### `GET /api/admin/house/profit-loss`
Get profit/loss summary.

## 🎮 How to Play

1. **Connect Wallet**: Click "Connect Wallet" and select your Solana wallet
2. **Place Bet**: Enter bet amount (0.01 - 0.5 SOL) and click "Place Bet"
3. **Sign Transaction**: Approve the transaction in your wallet
4. **Roll Dice**: Click "Roll Dice" to generate your roll
5. **Resolve**: The house automatically resolves your bet
6. **Win/Lose**: If total roll ≥ 9, you win 5.5x your bet!

## 🛠️ Admin Panel

Access the admin dashboard at `/admin` with your admin API key.

**Features:**
- View house balance and max payout
- Monitor profit/loss statistics
- See detailed bet statistics:
  - Total player losses (money added to house)
  - Total payouts (money paid to winners)
  - Net profit
  - Win rate
  - Recent bet history
- Deposit/withdraw funds
- View transaction history

## 🔧 Configuration

### Environment Variables

**Vercel Environment Variables:**
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `HOUSE_KEYPAIR_SECRET_KEY`: House wallet keypair as JSON array string
- `ADMIN_API_KEY`: Secret key for admin endpoints
- `RPC_URL`: Solana RPC endpoint (default: devnet)
- `WIN_THRESHOLD`: Minimum total roll for player to win (default: 9)
- `DEFAULT_SAFETY_FACTOR`: Safety factor for max payout (default: 0.9)
- `BET_TIMEOUT_SECONDS`: Bet timeout in seconds (default: 3600)

### Game Configuration

- **Win Threshold**: Minimum total roll (player + house) for player to win
  - `8`: ~41.67% player win rate
  - `9`: ~27.78% player win rate (default)
  - `10`: ~16.67% player win rate
- **Payout Multiplier**: 5.5x for winning bets
- **Max Bet**: 0.5 SOL
- **Min Bet**: 0.01 SOL

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **@solana/wallet-adapter-react** - Wallet integration
- **React Router** - Navigation

### Backend
- **Vercel Serverless Functions** - API endpoints
- **Supabase** - Database (PostgreSQL)
- **@solana/web3.js** - Solana SDK
- **Node.js** - Runtime

### Blockchain
- **Solana Devnet/Mainnet** - Blockchain network
- **PDA Escrow** - Program Derived Addresses for bet escrow
- **System Program** - Solana system program for transfers

## 📊 Database Schema

### `bets` Table
- `bet_id` (PDA address)
- `user_wallet` (player wallet)
- `amount` (bet amount in SOL)
- `user_roll`, `house_roll` (dice rolls)
- `outcome` ('win' or 'lose')
- `tx_signature` (transaction signature)
- `bet_time` (timestamp)
- `nonce`, `bump` (PDA derivation)

### `users` Table
- `wallet` (user wallet address)
- `total_wins`, `total_losses` (counts)
- `total_earned` (net earnings in SOL)
- `created_at`, `updated_at` (timestamps)

## 🔒 Security

- ✅ **Server-side dice generation**: House roll generated server-side
- ✅ **On-chain verification**: All bets verified on Solana blockchain
- ✅ **PDA escrow**: Secure bet escrow using Program Derived Addresses
- ✅ **Admin API key**: Protected admin endpoints
- ✅ **Input validation**: All inputs validated
- ✅ **CORS protection**: Configured CORS headers

## 🐛 Troubleshooting

### Common Issues

**404 Errors on API endpoints:**
- Check that Vercel root directory is set correctly
- Verify serverless functions are in `api/` folder
- Ensure environment variables are set

**Wallet connection issues:**
- Make sure you have a Solana wallet installed
- Check that you're on the correct network (devnet/mainnet)

**Build errors:**
- Ensure all dependencies are installed
- Check Node.js version (v18+)
- Verify TypeScript configuration

**Database errors:**
- Verify Supabase credentials
- Check that migrations have been run
- Ensure service role key has proper permissions

## 📝 Development

### Running Locally

1. **Frontend:**
   ```bash
   cd frontend/pda-ui
   npm run dev
   ```

2. **Test Serverless Functions:**
   ```bash
   vercel dev
   ```

3. **Build:**
   ```bash
   cd frontend/pda-ui
   npm run build
   ```

### Project Scripts

- `npm run dev` - Start development server (in frontend/pda-ui)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `vercel dev` - Test serverless functions locally

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

[Add your license here]

## 🔗 Resources

- [Solana Documentation](https://docs.solana.com/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

## 🙏 Acknowledgments

- Built for the Solana ecosystem
- Uses Solana's high-performance blockchain
- Powered by Vercel serverless functions
- Database by Supabase

---

**Built with ❤️ for the Solana ecosystem**

For questions or support, please open an issue on GitHub.
