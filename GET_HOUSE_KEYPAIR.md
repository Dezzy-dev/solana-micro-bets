# How to Get House Keypair for Vercel

## Quick Method (Easiest)

### Option 1: Copy from File

1. Open the file: `backend/pda-escrow/house.json`
2. Select all the content (Ctrl+A)
3. Copy it (Ctrl+C)
4. In Vercel Dashboard → Environment Variables:
   - Key: `HOUSE_KEYPAIR_SECRET_KEY`
   - Value: Paste the entire array (should look like: `[251,139,55,38,...]`)
   - **Important**: Paste it exactly as is, including the square brackets `[]`

### Option 2: Using Command Line

**On Windows (PowerShell):**
```powershell
Get-Content backend/pda-escrow/house.json -Raw
```

**On Mac/Linux:**
```bash
cat backend/pda-escrow/house.json
```

Copy the entire output and paste it into Vercel.

## Your Current House Keypair

The house keypair is stored in: `backend/pda-escrow/house.json`

## Format for Vercel

The value should be exactly like this (but with your actual numbers):

```json
[251,139,55,38,105,54,67,26,251,49,32,69,202,143,245,251,143,4,173,135,48,146,151,45,65,134,57,77,6,104,143,71,251,238,211,144,162,71,121,24,110,157,38,36,74,125,34,150,207,129,252,242,71,119,195,163,220,134,236,123,132,186,224,160]
```

## Steps in Vercel

1. Go to **Vercel Dashboard**
2. Select your project: **solana-micro-bets**
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Fill in:
   - **Key**: `HOUSE_KEYPAIR_SECRET_KEY`
   - **Value**: Paste the entire array from `house.json`
6. Click **Save**
7. **Important**: After adding, go to **Deployments** and click **Redeploy** to apply the changes

## Verify It's Correct

The value should:
- ✅ Start with `[` (square bracket)
- ✅ End with `]` (square bracket)
- ✅ Contain 64 numbers separated by commas
- ✅ No extra spaces or newlines (can be all on one line)

## Security Note

⚠️ **Keep this keypair secret!** Never commit it to GitHub or share it publicly. It controls the house wallet that holds SOL for payouts.

## Get House Public Key (for reference)

You can also get the public address of the house wallet:

**On Windows:**
```powershell
cd backend/pda-escrow
node -e "const {Keypair} = require('@solana/web3.js'); const fs = require('fs'); const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('house.json')))); console.log('House Public Key:', keypair.publicKey.toBase58());"
```

**Or use this to check your house balance:**
```bash
solana balance <HOUSE_PUBLIC_KEY> --url https://api.devnet.solana.com
```

