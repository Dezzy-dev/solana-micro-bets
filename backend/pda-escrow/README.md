# PDA Escrow Backend

A Solana micro-bets backend using PDA (Program Derived Address) escrow accounts.

## Overview

This backend implements a betting system where:
- Each bet is stored in a PDA account
- Players create bets by transferring SOL to the PDA
- The house resolves bets and pays out winners
- Bets can be cancelled if they timeout

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```
RPC_URL=https://api.devnet.solana.com
PORT=3001
BET_TIMEOUT_SECONDS=3600
DEFAULT_SAFETY_FACTOR=0.9
WIN_THRESHOLD=9
ADMIN_API_KEY=your-secret-admin-api-key-here
```

**Required Environment Variables:**
- `ADMIN_API_KEY` - Required. Secret API key for admin endpoints (withdraw, deposit).
- `DEFAULT_SAFETY_FACTOR` - Optional. Safety factor for max payout calculation (default: 0.9 = 90% of house balance).
- `RPC_URL` - Optional. Solana RPC endpoint (default: https://api.devnet.solana.com).
- `PORT` - Optional. Server port (default: 3001).
- `BET_TIMEOUT_SECONDS` - Optional. Bet timeout in seconds (default: 3600).
- `WIN_THRESHOLD` - Optional. Minimum total roll (playerRoll + houseRoll) for player to win (default: 9). Must be between 2 and 12.
  - Threshold 8: Player wins ~41.67%, House wins ~58.33%
  - Threshold 9: Player wins ~27.78%, House wins ~72.22% (default - strong house edge)
  - Threshold 10: Player wins ~16.67%, House wins ~83.33%

3. Create a `house.json` file with the house keypair (array format):
```json
[1,2,3,...]
```

## Game Mechanics

### How It Works

1. Player places a bet by transferring SOL to a PDA escrow account
2. Both player and house roll dice (1-6 each)
3. Total roll = playerRoll + houseRoll (ranges from 2 to 12)
4. **Player wins if totalRoll >= WIN_THRESHOLD**
5. If player wins, they receive a 5.5x payout from the house

### Win Odds

The win threshold determines the house edge. With two dice (1-6 each):

- **Threshold 8**: Player wins on sums 8, 9, 10, 11, 12
  - Player win rate: ~41.67% (15/36 combinations)
  - House win rate: ~58.33% (21/36 combinations)
  
- **Threshold 9** (Default): Player wins on sums 9, 10, 11, 12
  - Player win rate: ~27.78% (10/36 combinations)
  - House win rate: ~72.22% (26/36 combinations)
  - **Strong house edge - recommended for profitability**

- **Threshold 10**: Player wins on sums 10, 11, 12
  - Player win rate: ~16.67% (6/36 combinations)
  - House win rate: ~83.33% (30/36 combinations)
  - Very strong house edge

### Payout

- Winning players receive **5.5x** their bet amount
- Losing players lose their bet (no refund)
- Payouts come from the house vault account

### Example

Player bets 0.1 SOL:
- Player rolls: 4
- House rolls: 5
- Total roll: 9
- With threshold 9: **Player wins!**
- Payout: 0.1 × 5.5 = **0.55 SOL**

## API Endpoints

### POST /api/bets/create

Creates a new bet. Returns an unsigned transaction that the player must sign.

**Request:**
```json
{
  "playerPubkey": "string",
  "amountLamports": "number",
  "nonce": "number"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": "base64-encoded-transaction",
  "pda": "string",
  "bump": "number"
}
```

### POST /api/bets/resolve

Resolves a bet. The house signs and sends the transaction.

**Request:**
```json
{
  "pda": "string",
  "playerRoll": "number",
  "houseRoll": "number"
}
```

**Response:**
```json
{
  "success": true,
  "signature": "string",
  "payout": "number"
}
```

### POST /api/bets/cancel

Cancels a bet if it has timed out. Refunds the player.

**Request:**
```json
{
  "pda": "string"
}
```

**Response:**
```json
{
  "success": true,
  "signature": "string"
}
```

## House Bankroll System

The backend implements an explicit House Bankroll model where all payouts come from a house vault account. The house keypair (`house.json`) serves as the vault.

### Seeding the House

Before accepting bets, you must fund the house account with SOL. Payouts will be sent from this account to winners.

**Using CLI (Devnet):**
```bash
solana airdrop 5 --url https://api.devnet.solana.com $(solana-keygen pubkey house.json)
```

**Using the Seed Script:**
```bash
# Compile TypeScript first
npm run build

# Run seed script
ts-node scripts/seedHouse.ts
```

The seed script will:
- Check current house balance
- Request an airdrop on devnet/testnet
- Display recommended max payout based on safety factor

### House Endpoints

#### GET /house/balance

Returns the current house balance in lamports and SOL.

**Response:**
```json
{
  "success": true,
  "lamports": 5000000000,
  "sol": 5.0,
  "housePubkey": "string"
}
```

#### GET /house/max-payout

Returns the maximum payout the house can handle based on balance and safety factor.

**Response:**
```json
{
  "success": true,
  "maxPayoutLamports": 4500000000,
  "maxPayoutSOL": 4.5,
  "safetyFactor": 0.9,
  "houseBalanceLamports": 5000000000,
  "houseBalanceSOL": 5.0,
  "housePubkey": "string"
}
```

#### POST /house/deposit

Deposits SOL to the house vault. For this implementation, HOUSE itself is the vault, so this is mainly for logging purposes.

**Request:**
```json
{
  "amountLamports": 1000000000
}
```

**Response:**
```json
{
  "success": true,
  "signature": "transaction-signature",
  "amountLamports": 1000000000,
  "note": "For this implementation, HOUSE itself is the vault. Deposit logged successfully."
}
```

#### POST /house/withdraw

Admin-only endpoint to withdraw SOL from the house vault. Requires `ADMIN_API_KEY` in request header or body.

**Request Headers:**
```
X-Admin-Api-Key: your-admin-api-key
```

**Request Body:**
```json
{
  "toPubkey": "destination-wallet-pubkey",
  "amountLamports": 1000000000
}
```

**Response:**
```json
{
  "success": true,
  "signature": "transaction-signature",
  "amountLamports": 1000000000,
  "toPubkey": "destination-wallet-pubkey"
}
```

**Example with curl:**
```bash
curl -X POST http://localhost:3001/house/withdraw \
  -H "Content-Type: application/json" \
  -H "X-Admin-Api-Key: your-admin-api-key" \
  -d '{
    "toPubkey": "DestinationPubkeyHere",
    "amountLamports": 1000000000
  }'
```

### Liquidity Checks

Before resolving any bet, the system automatically checks if the house has sufficient liquidity using `ensureLiquidity()`. If the house balance is insufficient to cover the payout, the resolve endpoint will return an error:

```json
{
  "success": false,
  "error": "Insufficient house bankroll. Required: 2.7500 SOL (2750000000 lamports), Available: 1.0000 SOL (1000000000 lamports). Please deposit more SOL to the house account: HousePubkeyHere"
}
```

**Important:** Always ensure the house has sufficient balance before accepting bets. Check `/house/max-payout` to see the maximum bet size the house can handle.

### Transaction Logging

All house transactions (deposits, withdrawals, and payouts) are automatically logged to `logs/house-transactions.json`:

```json
[
  {
    "type": "payout",
    "amountLamports": 2750000000,
    "to": "PlayerPubkeyHere",
    "from": "HousePubkeyHere",
    "txSignature": "transaction-signature",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "note": "Payout for bet PDA: PDAPubkeyHere"
  }
]
```

The log file is automatically created in the `logs/` directory and persists across server restarts.

## PDA Account Layout

- `player` (32 bytes): PublicKey
- `amount` (8 bytes): u64 (little-endian)
- `settled` (1 byte): u8 boolean (0 or 1)
- `nonce` (1 byte): u8
- `bump` (1 byte): u8

Total: 43 bytes (plus rent-exempt minimum)

## Running

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

## House Bankroll Best Practices

1. **Seed the house before starting the server:**
   ```bash
   solana airdrop 5 --url https://api.devnet.solana.com $(solana-keygen pubkey house.json)
   ```

2. **Check house balance regularly:**
   ```bash
   curl http://localhost:3001/house/balance
   ```

3. **Monitor max payout capacity:**
   ```bash
   curl http://localhost:3001/house/max-payout
   ```

4. **Ensure sufficient liquidity:** The system will automatically reject bet resolutions if the house doesn't have enough SOL to pay winners. Always maintain a buffer above the maximum potential payout.

5. **Safety factor:** The default safety factor of 0.9 means the house will only use 90% of its balance for payouts, leaving 10% as a buffer. Adjust `DEFAULT_SAFETY_FACTOR` in `.env` if needed.

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

