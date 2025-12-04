# 🏆 JUDGES TESTING GUIDE
## Cyber Dice Protocol - Solana Micro-Betting dApp

> **Quick Start:** This guide will help you test the project in ~15 minutes

---

## 📋 QUICK OVERVIEW

**What This Project Does:**
- Decentralized dice betting game on Solana blockchain
- Players place bets using SOL (Solana's native currency)
- Bets are locked in PDA (Program Derived Address) escrow accounts on-chain
- Real-time leaderboard showing top winners (auto-refreshes every 10 seconds)
- Admin panel for house management
- All transactions are verifiable on Solana devnet

**Tech Stack:**
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Blockchain:** Solana (devnet)
- **Database:** Supabase (PostgreSQL)

---

## ⚡ PREREQUISITES (5 minutes)

### Required Software:
1. **Node.js** v18+ - [Download here](https://nodejs.org/)
   ```bash
   node --version  # Should show v18 or higher
   ```

2. **Solana Wallet Extension** (Phantom recommended)
   - Install from: [phantom.app](https://phantom.app/)
   - Create a devnet wallet (Settings → Developer Mode → Change Network → Devnet)

3. **Git** (to clone repository)
   ```bash
   git --version
   ```

### Optional but Helpful:
- A Supabase account (free tier is fine) for database
- Basic understanding of Solana devnet

---

## 🚀 SETUP INSTRUCTIONS (10 minutes)

### Step 1: Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/Dezzy-dev/solana-micro-bets.git
cd solana-micro-bets

# Install Frontend Dependencies
cd frontend/pda-ui
npm install

# Install Backend Dependencies
cd ../../backend/pda-escrow
npm install
```

### Step 2: Supabase Setup (3 minutes)

The project uses Supabase for storing bet history and leaderboard data.

**Option A: Quick Setup (Recommended for Testing)**
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **Settings → API** and copy:
   - **Project URL** (SUPABASE_URL)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY) - ⚠️ Use service_role, not anon key!

**Set up Database Tables:**
1. In Supabase Dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase/migrations/20240101000000_create_bets_and_users_tables.sql`
3. Click "Run" to create the tables
4. Also run `supabase/migrations/20240102000000_add_nonce_bump_to_bets.sql` if present

**Option B: Skip Database (Limited Features)**
- The app will work without Supabase, but leaderboard and bet history won't persist
- You'll see warnings in console, but core betting functionality works

### Step 3: Configure Environment (3 minutes)

**Backend Configuration** (`backend/pda-escrow/.env`):

```env
# Solana Configuration
RPC_URL=https://api.devnet.solana.com
PORT=3001

# Supabase Configuration (get from Supabase dashboard)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Game Configuration
WIN_THRESHOLD=9
BET_TIMEOUT_SECONDS=3600
DEFAULT_SAFETY_FACTOR=0.9

# Admin Configuration (choose any secret string)
ADMIN_API_KEY=judge-test-key-2024
```

**Create House Keypair:**
The backend needs a house wallet. Check if `backend/pda-escrow/house.json` exists. If not:

```bash
cd backend/pda-escrow
# Generate a new keypair (or use the provided one)
solana-keygen new --outfile house.json --no-bip39-passphrase
```

### Step 4: Fund the House Wallet (2 minutes)

The house wallet needs SOL to pay winners. On devnet:

```bash
# Get the house wallet address
cd backend/pda-escrow
solana-keygen pubkey house.json

# Request airdrop (2 SOL per request, may need multiple)
solana airdrop 2 <HOUSE_WALLET_ADDRESS> --url https://api.devnet.solana.com
```

Or use the faucet: https://faucet.solana.com/ (paste house wallet address)

**Note:** You need at least 2-3 SOL in the house wallet to test with max bets (0.5 SOL).

---

## 🎮 RUNNING THE APPLICATION (2 minutes)

### Terminal 1: Start Backend

```bash
cd backend/pda-escrow
npm run dev
```

**Expected Output:**
```
🚀 PDA Escrow Backend running on port 3001
📡 RPC URL: https://api.devnet.solana.com
🏠 House Pubkey: <address>
🎲 Win Threshold: 9 (Player wins if totalRoll >= 9)
```

**Check:** Open http://localhost:3001/health in browser - should return success

### Terminal 2: Start Frontend

```bash
cd frontend/pda-ui
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Open in Browser:** http://localhost:5173

---

## ✅ TESTING CHECKLIST

### Core Features to Test:

#### ✅ **1. Wallet Connection**
- [ ] Open http://localhost:5173 in browser
- [ ] Click "Connect Wallet" button
- [ ] Select Phantom wallet
- [ ] Approve connection
- [ ] Wallet address appears in header

#### ✅ **2. Place a Bet**
- [ ] Select bet amount (0.05, 0.1, 0.25, or 0.5 SOL)
- [ ] Click "ROLL THE DICE" button
- [ ] Approve transaction in wallet
- [ ] Wait for confirmation
- [ ] Dice animation plays
- [ ] Result appears (win/lose)
- [ ] If win: payout is received

#### ✅ **3. Verify On-Chain Transaction**
- [ ] After placing bet, check Solana Explorer
- [ ] Copy transaction signature from result overlay
- [ ] Visit: https://explorer.solana.com/tx/<signature>?cluster=devnet
- [ ] Verify:
  - Transaction confirmed
  - SOL transferred to PDA account
  - If win: payout transaction visible

#### ✅ **4. Leaderboard** (Requires Supabase)
- [ ] Leaderboard visible on right side (or bottom on mobile)
- [ ] Shows top 10 players by wins
- [ ] Auto-refreshes every 10 seconds (watch the green dot)
- [ ] Displays wallet address, wins, losses, total earned
- [ ] Top 3 players show medals 🥇🥈🥉

#### ✅ **5. Bet History**
- [ ] Click "📊 HISTORY" button (when wallet connected)
- [ ] Modal shows your recent bets
- [ ] Each bet shows: amount, outcome, rolls, timestamp
- [ ] Transaction links work

#### ✅ **6. Admin Panel**
- [ ] Navigate to http://localhost:5173/admin
- [ ] Enter admin API key (from .env: `ADMIN_API_KEY`)
- [ ] View house balance, max payout, profit/loss
- [ ] Test deposit (uses airdrop on devnet)
- [ ] Check house statistics

---

## 🎯 KEY FEATURES TO DEMONSTRATE

### 1. **On-Chain Escrow System** ⭐⭐⭐
- **What:** Each bet locks SOL in a PDA account on-chain
- **How to Show:**
  1. Place a bet
  2. Copy the PDA address from result overlay
  3. Check on Solana Explorer: https://explorer.solana.com/address/<PDA_ADDRESS>?cluster=devnet
  4. Verify account exists and contains bet amount

### 2. **Provably Fair Gameplay** ⭐⭐⭐
- **What:** House roll is server-generated (secure, cannot be manipulated)
- **How to Show:**
  1. Play multiple rounds
  2. Check console logs in backend terminal
  3. Show: "🎲 Server-generated house roll: X"
  4. Explain: House roll generated server-side for security

### 3. **Real-Time Leaderboard** ⭐⭐
- **What:** Auto-updating leaderboard of top winners (refreshes every 10 seconds)
- **How to Show:**
  1. Make multiple bets from different wallets
  2. Watch leaderboard update automatically
  3. Show the refresh indicator (green pulsing dot)
  4. Point out medals for top 3 players

### 4. **Admin Dashboard** ⭐⭐
- **What:** Full house management interface
- **How to Show:**
  1. Log into admin panel (use ADMIN_API_KEY from .env)
  2. Show house balance tracking
  3. Display profit/loss calculations
  4. Demonstrate deposit functionality

### 5. **Modern User Experience** ⭐
- **What:** Polished, responsive UI with smooth animations
- **How to Show:**
  1. Navigate through onboarding modal
  2. Show dice rolling animations
  3. Demonstrate responsive design (resize browser)
  4. Show toast notifications for errors/success

---

## 🔍 JUDGING CRITERIA ALIGNMENT

### **Technical Innovation:**
- ✅ PDA escrow accounts for trustless betting
- ✅ On-chain transaction verification
- ✅ Server-side secure randomness
- ✅ Type-safe TypeScript throughout
- ✅ Configurable win threshold (house edge control)

### **Blockchain Integration:**
- ✅ Native Solana wallet connection
- ✅ Real on-chain transactions (devnet)
- ✅ Transaction signatures stored and verifiable
- ✅ Uses Solana's low-cost, fast transaction model
- ✅ PDA accounts for escrow without custom program

### **User Experience:**
- ✅ Modern, responsive UI
- ✅ Smooth animations and feedback
- ✅ Clear onboarding flow
- ✅ Real-time updates (leaderboard auto-refresh)
- ✅ Mobile-friendly design

### **Completeness:**
- ✅ Full betting flow (create → resolve → payout)
- ✅ Admin panel for management
- ✅ Leaderboard system with auto-refresh
- ✅ Bet history tracking
- ✅ Error handling throughout
- ✅ House edge configuration

---

## 🐛 TROUBLESHOOTING

### Backend won't start:
- **Check:** Node.js version (need v18+)
- **Check:** `.env` file exists in `backend/pda-escrow/`
- **Check:** `house.json` file exists
- **Error:** "ADMIN_API_KEY required" → Add to .env file
- **Error:** "House keypair not found" → Check house.json exists

### Frontend shows 404 errors:
- **Check:** Backend is running on port 3001
- **Check:** Vite proxy configured correctly
- **Fix:** Restart frontend dev server

### Wallet connection fails:
- **Check:** Phantom wallet extension installed
- **Check:** Wallet is set to Devnet (not Mainnet)
- **Fix:** Settings → Developer Mode → Change Network → Devnet

### Can't place bets:
- **Check:** Wallet has SOL (get from faucet)
- **Check:** House wallet has SOL (for payouts)
- **Check:** Backend logs for errors
- **Fix:** Request airdrop: https://faucet.solana.com/

### Leaderboard empty:
- **Expected:** If no bets placed yet, shows "No players yet"
- **If using Supabase:** Check database connection in backend logs
- **If not using Supabase:** Leaderboard won't work (this is expected)

### Database errors:
- **Check:** Supabase credentials in .env
- **Check:** Migration ran successfully
- **Fix:** Re-run migration SQL in Supabase dashboard

### Admin panel shows "Cannot GET /admin":
- **Fix:** Access via frontend route: http://localhost:5173/admin (not backend URL)

---

## 📊 DEMO SCENARIO (Recommended Flow)

### **5-Minute Demo Script:**

1. **Introduction (30s)**
   - "This is a decentralized dice betting game on Solana"
   - "Bets are locked in PDA escrow accounts on-chain"
   - "Leaderboard auto-refreshes every 10 seconds"

2. **Wallet Connection (30s)**
   - Connect Phantom wallet
   - Show wallet address appears

3. **Place a Bet (2 min)**
   - Select bet amount
   - Place bet and approve transaction
   - Show transaction on Solana Explorer
   - Show result (win/lose)
   - If win: show payout received

4. **Verify On-Chain (1 min)**
   - Copy PDA address from result
   - Open in Solana Explorer
   - Show SOL is locked in PDA account
   - Show payout transaction if win

5. **Leaderboard (30s)**
   - Point out auto-refreshing leaderboard
   - Show top players with medals
   - Mention 10-second auto-refresh

6. **Admin Panel (30s)**
   - Quick login (use ADMIN_API_KEY)
   - Show house balance and stats

---

## 📝 NOTES FOR JUDGES

### **What Makes This Special:**
1. **Real On-Chain Transactions:** Not a simulation - actual Solana transactions
2. **PDA Escrow:** Uses Solana's Program Derived Addresses for trustless escrow
3. **Provably Fair:** Server-side randomness prevents manipulation
4. **Complete System:** Full betting system with admin panel and leaderboard
5. **Production-Ready Code:** TypeScript, error handling, logging throughout
6. **Auto-Refreshing Leaderboard:** Real-time updates every 10 seconds
7. **House Edge Control:** Configurable win threshold for profitability

### **Known Limitations (For Hackathon Context):**
- Uses devnet (not mainnet) - standard for hackathons
- House roll generated server-side (could be upgraded to VRF in production)
- Supabase for off-chain data storage (can be upgraded to on-chain storage)
- Hybrid model: Escrow on-chain, resolution off-chain (documented in README)

### **Quick Test Without Full Setup:**
If time is limited, you can:
1. Just verify the code quality (TypeScript, structure, error handling)
2. Check the README files for architecture decisions
3. Review the on-chain transaction examples in code comments
4. Check the leaderboard component auto-refresh implementation

---

## 📞 SUPPORT

If you encounter issues:
1. Check console logs (both frontend and backend)
2. Verify all environment variables are set
3. Ensure Supabase migration ran successfully
4. Check that house wallet has SOL for payouts

**Common Commands:**
```bash
# Check if backend is running
curl http://localhost:3001/health

# Check backend logs for errors
# (Look at terminal where backend is running)

# Check frontend console
# (Open browser DevTools → Console)
```

---

## ✅ QUICK VERIFICATION

Run these to verify everything works:

```bash
# Backend health check
curl http://localhost:3001/health

# Leaderboard endpoint
curl http://localhost:3001/api/leaderboard

# Frontend loads
# Open: http://localhost:5173
```

---

## 🎲 TESTING TIPS

1. **Start Small:** Use 0.05 SOL bets for testing
2. **Multiple Wallets:** Test with 2-3 different wallets to populate leaderboard
3. **Check Explorer:** Always verify transactions on Solana Explorer
4. **Watch Console:** Backend logs show server-generated rolls
5. **Leaderboard Timing:** Wait 10+ seconds to see auto-refresh in action

---

**Thank you for reviewing our project! 🎲🚀**

---

## 📚 ADDITIONAL RESOURCES

- **Main README:** See `README.md` for project overview
- **Backend README:** See `backend/pda-escrow/README.md` for detailed backend docs
- **Supabase Setup:** See `backend/pda-escrow/SUPABASE_SETUP.md` for database setup
- **Repository:** https://github.com/Dezzy-dev/solana-micro-bets

