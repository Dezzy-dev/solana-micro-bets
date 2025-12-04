# PDA Escrow UI

A React TypeScript frontend for the Solana PDA Escrow micro-bets application.

## Features

- **Phantom Wallet Integration**: Connect and sign transactions using Phantom wallet
- **Place Bets**: Create new bets with amount and nonce
- **Resolve Bets**: Admin panel to resolve bets and pay out winners
- **Dark Theme**: Minimal, modern dark UI with clean typography

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```env
VITE_API_URL=http://localhost:3001
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## API Endpoints

The frontend communicates with the backend API at the URL specified in `VITE_API_URL`.

### POST /api/bets/create

Creates a new bet transaction. Returns an unsigned transaction that the user must sign.

**Request:**
```typescript
{
  playerPubkey: string;    // Player's public key
  amountLamports: number;  // Bet amount in lamports
  nonce: number;           // Nonce (0-255)
}
```

**Response:**
```typescript
{
  success: boolean;
  transaction: string;      // Base64-encoded transaction
  pda: string;             // PDA address
  bump: number;            // Bump seed
  dataSize?: number;       // Account data size
}
```

**Usage:**
- User enters bet amount (SOL) and nonce
- Frontend calls this endpoint
- Receives unsigned transaction
- User signs transaction with wallet
- Transaction is sent to Solana network

### POST /api/bets/resolve

Resolves a bet. The house signs and sends the transaction.

**Request:**
```typescript
{
  pda: string;        // Bet PDA address
  playerRoll: number; // Player's roll (1-6)
  houseRoll: number;  // House's roll (1-6)
}
```

**Response:**
```typescript
{
  success: boolean;
  signature: string;      // Transaction signature
  payout: string;         // Payout amount in lamports (if player wins)
  playerWins: boolean;    // Whether player won
  totalRoll: number;      // Sum of playerRoll + houseRoll
}
```

**Usage:**
- Admin enters bet PDA and both rolls
- Frontend calls this endpoint
- Backend resolves bet and sends transaction
- Response includes outcome and transaction signature

### POST /api/bets/cancel

Cancels a bet if timeout has passed. Refunds the player.

**Request:**
```typescript
{
  pda: string;
  createdAtTimestamp?: number; // Optional: bet creation timestamp
}
```

**Response:**
```typescript
{
  success: boolean;
  signature: string;
}
```

**Note:** Cancellation requires a Solana program to transfer funds from PDA accounts. This feature may not be fully functional without a program.

## Project Structure

```
src/
  ├── components/
  │   ├── WalletContextProvider.tsx  # Wallet adapter setup
  │   ├── ErrorToast.tsx             # Error notification component
  │   └── SuccessToast.tsx           # Success notification component
  ├── pages/
  │   ├── PlaceBet.tsx               # Bet creation page
  │   └── AdminResolve.tsx           # Bet resolution page
  ├── utils/
  │   ├── PDA.ts                     # Client-side PDA derivation
  │   └── api.ts                     # API client functions
  ├── App.tsx                        # Main app component with routing
  ├── main.tsx                       # Entry point
  └── index.css                      # Global styles
```

## Wallet Integration

The app uses `@solana/wallet-adapter-react` for wallet integration:

- **Phantom Wallet**: Primary wallet adapter
- **Auto-connect**: Automatically reconnects to previously connected wallet
- **Transaction Signing**: Users sign transactions directly in their wallet

## Betting Rules

- **Player Wins**: If `playerRoll + houseRoll >= WIN_THRESHOLD` (default: 9, configurable on backend)
  - Default threshold 9: Player wins ~27.78%, House wins ~72.22% (strong house edge)
  - Threshold can be configured via `WIN_THRESHOLD` environment variable on backend
- **Payout**: 5.5x the bet amount if player wins
- **Nonce**: Must be unique per player (0-255)

## Development

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Inline styles with dark theme
- **Routing**: React Router DOM

## Environment Variables

- `VITE_API_URL`: Backend API base URL (default: `http://localhost:3001`)

=============================

⚠️ IMPORTANT ARCHITECTURE NOTE

=============================

This hackathon version uses a "hybrid on-chain escrow model":

1. **User bets ARE stored on-chain**  

   - Funds are transferred from the player's wallet to a **PDA escrow account**.

   - The PDA address uses deterministic seeds:

       ["microbet", playerPubkey, nonce_u8]

2. **Game resolution is performed off-chain by the house authority**

   - A server keypair `house.json` signs the settlement transaction.

   - The house only controls:

       - payout distribution

       - setting `settled = true` on the Bet PDA

3. **Why hybrid?**

   - Fast development for hackathon.

   - UI is clean and fully functional.

   - PDA escrow & lamport locking prove real Solana use-case.

4. **Post-hackathon upgrade**

   This backend can be replaced with an Anchor program:

   - On-chain settlement

   - VRF randomness for houseRoll

   - Escrow controlled only by smart contract

   - DAO can replace house authority with multisig

This README section MUST remain in the repository to clearly state architecture decisions.

