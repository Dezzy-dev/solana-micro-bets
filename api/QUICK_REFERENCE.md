# API Quick Reference

## Endpoint URLs

All endpoints are prefixed with your Vercel deployment URL: `https://your-app.vercel.app/api`

### Bet Endpoints

```javascript
// Create bet
POST /api/bet/create
Body: { playerPubkey, amountLamports, nonce }

// Resolve bet
POST /api/bet/resolve
Body: { pda, playerRoll }

// Cancel bet
POST /api/bet/cancel
Body: { pda, createdAtTimestamp }
```

### Query Endpoints

```javascript
// Get bet history
GET /api/history/[wallet]
Example: GET /api/history/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU

// Get leaderboard
GET /api/leaderboard?limit=20

// Health check
GET /api/health
```

### Admin Endpoints

```javascript
// Deposit (requires x-admin-api-key header)
POST /api/admin/deposit
Headers: { 'x-admin-api-key': 'your-key' }
Body: { amountLamports }

// Withdraw (requires x-admin-api-key header)
POST /api/admin/withdraw
Headers: { 'x-admin-api-key': 'your-key' }
Body: { toPubkey, amountLamports }
```

## Response Format

All endpoints return JSON:

```javascript
// Success
{
  "success": true,
  ...data
}

// Error
{
  "success": false,
  "error": "Error message"
}
```

## CORS

All endpoints have CORS enabled for `*` origin.

