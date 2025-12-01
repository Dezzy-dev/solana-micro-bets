# Vercel Serverless API

This directory contains all API route handlers for Vercel serverless deployment.

## Structure

```
api/
├── lib/                    # Shared utilities
│   ├── supabaseClient.js   # Cached Supabase client
│   ├── solanaClient.js     # Cached Solana connection
│   ├── houseWallet.js      # House wallet utilities
│   ├── gameLogic.js        # Bet creation/resolution logic
│   └── dbHelpers.js        # Database helper functions
├── bet/
│   ├── create.js          # POST /api/bet/create
│   ├── resolve.js         # POST /api/bet/resolve
│   └── cancel.js          # POST /api/bet/cancel
├── admin/
│   ├── deposit.js         # POST /api/admin/deposit
│   └── withdraw.js        # POST /api/admin/withdraw
├── history/
│   └── [wallet].js        # GET /api/history/:wallet
├── leaderboard.js         # GET /api/leaderboard
└── health.js              # GET /api/health
```

## Environment Variables

Set these in your Vercel project settings:

```env
# Supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Solana
RPC_URL=https://api.devnet.solana.com

# House Wallet (JSON array as string)
HOUSE_KEYPAIR_SECRET_KEY=[1,2,3,4,...]

# Admin
ADMIN_API_KEY=your-admin-api-key

# Optional
DEFAULT_SAFETY_FACTOR=0.9
BET_TIMEOUT_SECONDS=3600
```

## API Endpoints

### Bet Endpoints

- `POST /api/bet/create` - Create a new bet
- `POST /api/bet/resolve` - Resolve a bet
- `POST /api/bet/cancel` - Cancel a bet (returns 501 - requires program)

### Admin Endpoints

- `POST /api/admin/deposit` - Deposit to house (requires `x-admin-api-key` header)
- `POST /api/admin/withdraw` - Withdraw from house (requires `x-admin-api-key` header)

### Query Endpoints

- `GET /api/history/[wallet]` - Get bet history for a wallet
- `GET /api/leaderboard?limit=20` - Get leaderboard
- `GET /api/health` - Health check

## Deployment

1. **Set up environment variables** in Vercel dashboard
2. **Run database migrations** in Supabase (run both migration files)
3. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

## Notes

- All clients are cached (singleton pattern) for optimal serverless performance
- CORS is enabled on all endpoints
- Escrow data is stored in Supabase (not in-memory) for serverless compatibility
- House keypair is loaded from `HOUSE_KEYPAIR_SECRET_KEY` environment variable

