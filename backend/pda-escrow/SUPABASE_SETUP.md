# Supabase Integration Setup

This backend now integrates with Supabase for persistent storage of bets and user statistics.

## Environment Variables

Add these to your `.env` file in the `backend` directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Getting Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a project
2. In your project dashboard:
   - **SUPABASE_URL**: Go to Settings → API → Project URL
   - **SUPABASE_SERVICE_ROLE_KEY**: Go to Settings → API → Project API keys → `service_role` key (secret)

⚠️ **Important**: Use the `service_role` key (not the `anon` key) for server-side operations. This key bypasses Row Level Security (RLS).

## Database Migration

Before running the backend, you need to set up the database tables:

1. **Run the migration**:
   - Via Supabase Dashboard: Go to SQL Editor and run the migration file from `supabase/migrations/20240101000000_create_bets_and_users_tables.sql`
   - Via Supabase CLI: `supabase db push` (if using CLI)

2. **Verify tables**:
   - Go to Table Editor in Supabase Dashboard
   - You should see `bets` and `users` tables

## New API Endpoints

### GET /api/history/:wallet

Returns the latest 50 bets for a given wallet address.

**Example Request:**
```bash
GET /api/history/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

**Example Response:**
```json
{
  "success": true,
  "bets": [
    {
      "id": "uuid",
      "bet_id": "PDA_address",
      "user_wallet": "wallet_address",
      "amount": 0.1,
      "user_roll": 4,
      "house_roll": 3,
      "outcome": "win",
      "tx_signature": "transaction_signature",
      "bet_time": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### GET /api/leaderboard

Returns the top 20 users ordered by `total_earned` (descending).

**Query Parameters:**
- `limit` (optional): Number of users to return (default: 20, max: 100)

**Example Request:**
```bash
GET /api/leaderboard?limit=20
```

**Example Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "wallet": "wallet_address",
      "total_wins": 10,
      "total_losses": 5,
      "total_earned": 5.5,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

## Database Schema

### `bets` Table

- `id` (uuid): Primary key, auto-generated
- `bet_id` (text): PDA address (unique identifier for the bet)
- `user_wallet` (text): Player's wallet address
- `amount` (numeric): Bet amount in SOL
- `user_roll` (integer): Player's dice roll (1-6)
- `house_roll` (integer): House's dice roll (1-6)
- `outcome` (text): "win" or "lose"
- `tx_signature` (text): Solana transaction signature
- `bet_time` (timestamp): When the bet was placed

### `users` Table

- `wallet` (text): Primary key, wallet address
- `total_wins` (integer): Total number of wins
- `total_losses` (integer): Total number of losses
- `total_earned` (numeric): Total earned/lost in SOL (can be negative)

## Integration Points

### Bet Creation Flow

When a bet is created (`POST /api/bets/create`):
1. Solana transaction is created
2. Bet record is inserted into `bets` table with:
   - `bet_id`: PDA address
   - `user_wallet`: Player's wallet
   - `amount`: Bet amount in SOL
   - `bet_time`: Current timestamp
   - Other fields initially null

### Bet Resolution Flow

When a bet is resolved (`POST /api/bets/resolve`):
1. Solana transaction is executed
2. Bet record is updated with:
   - `user_roll`, `house_roll`: Dice rolls
   - `outcome`: "win" or "lose"
   - `tx_signature`: Transaction signature
3. User statistics are updated:
   - If win: `total_wins++`, `total_earned += payout`
   - If lose: `total_losses++`, `total_earned -= bet_amount`

## Error Handling

All database operations have error handling:
- Database errors are logged but don't block Solana transactions
- API endpoints return JSON error responses with appropriate HTTP status codes
- Missing Supabase credentials show warnings but don't crash the server (operations will fail gracefully)

## Serverless Compatibility

The Supabase client is configured to be serverless-friendly:
- Creates a new client instance for each request (stateless)
- No persistent connections
- Compatible with Vercel serverless functions

## Troubleshooting

### "Supabase credentials not configured" error

Make sure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in your `.env` file.

### "Failed to insert bet into database" error

Check:
1. Database migration has been run
2. Supabase credentials are correct
3. Network connectivity to Supabase

### User stats not updating

Check:
1. User record exists (it should be auto-created on first bet)
2. Database permissions allow updates
3. Check server logs for specific error messages

