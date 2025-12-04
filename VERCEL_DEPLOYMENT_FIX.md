# Vercel Deployment Fix

## Problem
- Frontend calls `/api/bets/create`, `/api/bets/resolve`, `/api/leaderboard`
- Getting 404 errors: `/api/api/leaderboard` (double `/api/`)
- Backend not deployed as separate service

## Solution: Use Vercel Serverless Functions (FREE & FAST)

### ✅ Files Created

1. **`api/bets/create.js`** - Handles bet creation
2. **`api/bets/resolve.js`** - Handles bet resolution  
3. **`api/leaderboard.js`** - Returns leaderboard data

### 🔧 Vercel Environment Variables

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and set:

#### Required:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

HOUSE_KEYPAIR_SECRET_KEY=[1,2,3,4,5,...]
# ^ Copy the array from backend/pda-escrow/house.json as a string

ADMIN_API_KEY=solana-micro-bet12
RPC_URL=https://api.devnet.solana.com

WIN_THRESHOLD=9
DEFAULT_SAFETY_FACTOR=0.9
BET_TIMEOUT_SECONDS=3600
```

#### Important for Frontend:
```env
VITE_PUBLIC_API_URL=
```
**Leave this EMPTY** (or delete it) so the frontend uses relative paths like `/api/...`

### 📝 Steps to Deploy

1. **Push to GitHub** (already done):
   ```bash
   git add .
   git commit -m "Add Vercel serverless functions"
   git push
   ```

2. **Vercel will auto-deploy** (if connected to GitHub)

3. **Set Environment Variables** in Vercel Dashboard:
   - Copy all variables from above
   - Make sure `VITE_PUBLIC_API_URL` is **empty** or **deleted**

4. **Redeploy** after setting environment variables:
   - Go to Vercel Dashboard → Deployments
   - Click "..." → "Redeploy"

### 🎯 How It Works

- **Same Domain**: Frontend and API on `cyberdiceprotocol.vercel.app`
- **Fast**: No CORS, no network latency
- **Free**: 100,000 function invocations/month (Vercel Hobby plan)
- **Auto-scaling**: Serverless functions scale automatically

### 📡 API Endpoints

All endpoints work on same domain:

- `POST /api/bets/create` → `api/bets/create.js`
- `POST /api/bets/resolve` → `api/bets/resolve.js`
- `GET /api/leaderboard` → `api/leaderboard.js`

### ✅ Testing

After deployment, test:
1. Place a bet → Should call `/api/bets/create`
2. Resolve bet → Should call `/api/bets/resolve`
3. View leaderboard → Should call `/api/leaderboard`

All should work without 404 errors!

### 🐛 Troubleshooting

**If you still see `/api/api/...` errors:**
- Check Vercel Environment Variables
- Make sure `VITE_PUBLIC_API_URL` is **empty** or **deleted**
- Redeploy after changing environment variables

**If functions timeout:**
- Check Supabase credentials are correct
- Check `HOUSE_KEYPAIR_SECRET_KEY` format (should be JSON array as string)
- Check function logs in Vercel Dashboard

