# Installing Solana CLI on Windows

## Quick Installation Options

### Option 1: Using Git Bash (Recommended if you have Git installed)

1. Open **Git Bash** (not PowerShell)
2. Run:
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   ```
3. Follow the prompts and add Solana to your PATH
4. Restart your terminal
5. Verify: `solana --version`

### Option 2: Using WSL (Windows Subsystem for Linux)

1. Open **WSL** terminal
2. Run:
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   ```
3. Add to PATH in your WSL profile
4. Verify: `solana --version`

### Option 3: Manual Installation

1. Visit: https://github.com/solana-labs/solana/releases
2. Download the latest Windows release
3. Extract to a folder (e.g., `C:\solana`)
4. Add to PATH:
   - Open System Properties → Environment Variables
   - Add `C:\solana\bin` to your PATH
5. Restart terminal
6. Verify: `solana --version`

### Option 4: Using Chocolatey (if installed)

```powershell
choco install solana
```

## After Installation

1. **Configure for local development:**
   ```bash
   solana config set --url localhost
   ```

2. **Generate a keypair (if needed):**
   ```bash
   solana-keygen new
   ```

3. **Start local validator:**
   ```bash
   solana-test-validator
   ```

## Alternative: Use Devnet/Testnet

If you prefer not to install locally, you can modify the connection to use Solana devnet:

Edit `backend/src/solana/connection.ts`:
```typescript
const DEVNET_URL = 'https://api.devnet.solana.com';
// Change LOCAL_VALIDATOR_URL to DEVNET_URL
```

Then you can test against devnet without running a local validator.

## Troubleshooting

- **"solana not recognized"**: Make sure Solana is in your PATH and restart terminal
- **Connection issues**: Ensure firewall allows connections to localhost:8899
- **Port already in use**: Another validator might be running, check with `netstat -ano | findstr :8899`

