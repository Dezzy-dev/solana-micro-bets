# Vercel Serverless Deployment Guide

## Quick Start

### 1. Install Dependencies

At the **project root**, install dependencies:

```bash
npm install @solana/web3.js @supabase/supabase-js
```

### 2. Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

#### Required Variables:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
HOUSE_KEYPAIR_SECRET_KEY=[1,2,3,4,5,...]  # JSON array as string
ADMIN_API_KEY=your-secret-admin-key
```

#### Optional Variables:

```env
RPC_URL=https://api.devnet.solana.com
DEFAULT_SAFETY_FACTOR=0.9
BET_TIMEOUT_SECONDS=3600
```

### 3. Run Database Migrations

In Supabase Dashboard → SQL Editor, run these migrations in order:

1. `supabase/migrations/20240101000000_create_bets_and_users_tables.sql`
2. `supabase/migrations/20240102000000_add_nonce_bump_to_bets.sql`

### 4. Get House Keypair

Convert your `house.json` file to environment variable format:

**If you have `backend/pda-escrow/house.json`:**

```bash
# Read the file and copy the JSON array
cat backend/pda-escrow/house.json
# Copy the entire array [1,2,3,...] as a string value
```

In Vercel, set `HOUSE_KEYPAIR_SECRET_KEY` to the JSON array string (including brackets).

### 5. Deploy

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Deploy
vercel --prod
```

Or push to GitHub and connect your repo to Vercel for automatic deployments.

## API Route Mapping

The routes map as follows:

| Original Express Route | Vercel API Route | File Location |
|----------------------|------------------|---------------|
| `POST /api/bets/create` | `POST /api/bet/create` | `api/bet/create.js` |
| `POST /api/bets/resolve` | `POST /api/bet/resolve` | `api/bet/resolve.js` |
| `POST /api/bets/cancel` | `POST /api/bet/cancel` | `api/bet/cancel.js` |
| `GET /api/history/:wallet` | `GET /api/history/[wallet]` | `api/history/[wallet].js` |
| `GET /api/leaderboard` | `GET /api/leaderboard` | `api/leaderboard.js` |
| `POST /house/deposit` | `POST /api/admin/deposit` | `api/admin/deposit.js` |
| `POST /house/withdraw` | `POST /api/admin/withdraw` | `api/admin/withdraw.js` |
| `GET /health` | `GET /api/health` | `api/health.js` |

## Frontend Updates Needed

Update your frontend API base URL:

```typescript
// Change from:
const API_BASE_URL = 'http://localhost:3001';

// To:
const API_BASE_URL = process.env.VITE_API_URL || 'https://your-vercel-app.vercel.app/api';
```

And update route paths:

- `/api/bets/create` → `/api/bet/create`
- `/api/bets/resolve` → `/api/bet/resolve`
- `/api/bets/cancel` → `/api/bet/cancel`
- `/api/history/:wallet` → `/api/history/[wallet]`

## Testing Locally

```bash
# Install Vercel CLI
npm install -g vercel

# Run local dev server
vercel dev

# Your API will be available at:
# http://localhost:3000/api/...
```

## Troubleshooting

### "Supabase credentials not configured"
- Check environment variables are set in Vercel
- Redeploy after adding environment variables

### "Failed to load house keypair"
- Ensure `HOUSE_KEYPAIR_SECRET_KEY` is set as a JSON array string
- Format: `[1,2,3,4,...]` (exactly as in house.json)

### "Bet not found" errors
- Ensure database migrations have been run
- Check Supabase connection in Vercel logs

### CORS errors
- All endpoints have CORS enabled
- Check frontend is using correct API URL

## Architecture Notes

### Serverless Optimizations

1. **Cached Clients**: All clients (Supabase, Solana) are cached as singletons
2. **Stateless**: No in-memory storage - everything uses Supabase
3. **Cold Starts**: First request may be slower, subsequent requests are fast

### Escrow Data Storage

Escrow data (nonce, bump) is now stored in the `bets` table instead of in-memory. This makes it serverless-compatible.

### Environment Variables

All sensitive keys are loaded from environment variables:
- House keypair: `HOUSE_KEYPAIR_SECRET_KEY`
- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Admin: `ADMIN_API_KEY`

