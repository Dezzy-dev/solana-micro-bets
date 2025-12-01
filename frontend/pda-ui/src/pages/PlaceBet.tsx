import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { createBet } from '../utils/api';
import { derivePDA } from '../utils/PDA';
import { ErrorToast } from '../components/ErrorToast';
import { SuccessToast } from '../components/SuccessToast';

export function PlaceBet() {
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [betAmount, setBetAmount] = useState('');
  const [nonce, setNonce] = useState('');
  const [loading, setLoading] = useState(false);
  const [betPDA, setBetPDA] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [requestingAirdrop, setRequestingAirdrop] = useState(false);

  // Fetch balance when wallet is connected
  useEffect(() => {
    if (publicKey) {
      fetchBalance();
      // Refresh balance every 5 seconds
      const interval = setInterval(fetchBalance, 5000);
      return () => clearInterval(interval);
    } else {
      setBalance(null);
    }
  }, [publicKey]);

  const fetchBalance = async () => {
    if (!publicKey) return;
    try {
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const requestAirdrop = async () => {
    if (!publicKey) return;
    setRequestingAirdrop(true);
    setError(null);
    
    // Try smaller amounts first - sometimes 1 SOL works when 2 SOL fails
    const amountsToTry = [1, 2]; // Try 1 SOL first, then 2 SOL
    const maxRetriesPerAmount = 2;
    // Note: lastError is assigned but not used - kept for potential future error reporting
    
    for (const amount of amountsToTry) {
      for (let attempt = 1; attempt <= maxRetriesPerAmount; attempt++) {
        try {
          if (attempt > 1 || (amount === 2 && amountsToTry.indexOf(amount) > 0)) {
            // Wait before retry with exponential backoff
            const waitTime = attempt * 2000; // 2s, 4s
            setSuccess(`Requesting ${amount} SOL airdrop (attempt ${attempt})... Please wait ${waitTime/1000}s`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            setSuccess(`Requesting ${amount} SOL airdrop...`);
          }
          
          console.log(`Requesting ${amount} SOL airdrop (attempt ${attempt}/${maxRetriesPerAmount})...`);
          const signature = await connection.requestAirdrop(publicKey, amount * LAMPORTS_PER_SOL);
          
          // Wait for confirmation
          console.log('Waiting for airdrop confirmation...');
          await connection.confirmTransaction(signature, 'confirmed');
          
          setSuccess(`Airdrop successful! Received ${amount} SOL. Transaction: ${signature}`);
          await fetchBalance();
          setRequestingAirdrop(false);
          return; // Success, exit function
        } catch (err: any) {
          const errorMsg = err?.message || err?.toString() || 'Unknown error';
          console.error(`${amount} SOL airdrop attempt ${attempt} failed:`, errorMsg);
          
          // Check if we should retry this amount
          const shouldRetry = attempt < maxRetriesPerAmount && (
            errorMsg.includes('Internal error') ||
            errorMsg.includes('rate limit') ||
            errorMsg.includes('429') ||
            errorMsg.includes('timeout') ||
            errorMsg.includes('network')
          );
          
          if (!shouldRetry) {
            // Move to next amount or exit
            break;
          }
        }
      }
    }
    
    // If all attempts failed, show helpful error with alternatives
    let errorMessage = 'Airdrop failed after multiple attempts. ';
    errorMessage += 'Devnet may be experiencing issues. ';
    errorMessage += '\n\nAlternative options:\n';
    errorMessage += '1. Try again in a few minutes\n';
    errorMessage += '2. Use a web faucet: https://faucet.solana.com/\n';
    errorMessage += '3. Use Solana CLI: solana airdrop 2 ' + publicKey.toBase58();
    
    setError(errorMessage);
    setRequestingAirdrop(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBetPDA(null);

    if (!publicKey) {
      setError('Please connect your wallet');
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid bet amount');
      return;
    }

    const nonceNum = parseInt(nonce, 10);
    if (isNaN(nonceNum) || nonceNum < 0 || nonceNum > 255) {
      setError('Nonce must be a number between 0 and 255');
      return;
    }

    // Always fetch fresh balance before proceeding
    let currentBalance: number;
    if (!publicKey) {
      setError('Please connect your wallet');
      return;
    }
    
    try {
      const bal = await connection.getBalance(publicKey);
      currentBalance = bal / LAMPORTS_PER_SOL;
      setBalance(currentBalance); // Update state for display
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to check wallet balance. Please try again.');
      return;
    }

    // Check if balance is sufficient
    // Required: bet amount + rent exemption (~0.0011 SOL) + transaction fees (~0.0005 SOL)
    // Total safety margin: ~0.002 SOL
    const requiredBalance = amount + 0.002; // Bet amount + rent + fees
    
    console.log('Initial balance check:', {
      currentBalance: currentBalance,
      requiredBalance: requiredBalance,
      amount: amount,
      hasEnough: currentBalance >= requiredBalance,
    });
    
    // Only show error if balance is actually insufficient (with small buffer for floating point)
    if (currentBalance < requiredBalance - 0.0001) {
      setError(`Insufficient balance! You have ${currentBalance.toFixed(4)} SOL, but need ${requiredBalance.toFixed(4)} SOL (bet amount + rent exemption + fees). Please use the airdrop button above to get free devnet SOL.`);
      return;
    }
    
    console.log('Initial balance check passed');

    setLoading(true);

    try {
      // Derive PDA client-side to verify
      const { pda } = derivePDA(publicKey, nonceNum);
      setBetPDA(pda.toBase58());

      // Call backend to create bet transaction
      const response = await createBet({
        playerPubkey: publicKey.toBase58(),
        amountLamports: Math.floor(amount * 1e9), // Convert SOL to lamports
        nonce: nonceNum,
      });

      // Deserialize transaction
      const transactionBuffer = Buffer.from(response.transaction, 'base64');
      let transaction = Transaction.from(transactionBuffer);

      // Get fresh blockhash before sending (blockhash may have expired)
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      
      // Try to update the existing transaction's blockhash first (simpler approach)
      try {
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        if (publicKey) {
          transaction.feePayer = publicKey;
        }
        console.log('Updated transaction blockhash directly');
      } catch (updateErr) {
        // If direct update fails, rebuild the transaction
        console.log('Direct update failed, rebuilding transaction:', updateErr);
        const newTransaction = new Transaction();
        newTransaction.recentBlockhash = blockhash;
        newTransaction.lastValidBlockHeight = lastValidBlockHeight;
        newTransaction.feePayer = publicKey;
        
        // Copy all instructions from the original transaction
        transaction.instructions.forEach(ix => {
          newTransaction.add(ix);
        });
        
        transaction = newTransaction;
        console.log('Rebuilt transaction with fresh blockhash');
      }

      // Log transaction details for debugging
      console.log('Transaction details:', {
        instructions: transaction.instructions.length,
        feePayer: transaction.feePayer?.toBase58(),
        recentBlockhash: transaction.recentBlockhash,
        signers: transaction.signatures.length
      });

      // Validate wallet functions are available
      if (!sendTransaction) {
        setError('Wallet not properly connected. Please reconnect your wallet.');
        return;
      }

      // Simulate transaction first to catch errors early
      try {
        console.log('Simulating transaction...');
        const simulation = await connection.simulateTransaction(transaction);
        console.log('Simulation result:', {
          err: simulation.value.err,
          logs: simulation.value.logs,
          unitsConsumed: simulation.value.unitsConsumed,
        });
        
        if (simulation.value.err) {
          throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }
      } catch (simErr: any) {
        console.error('Transaction simulation error:', simErr);
        setError(`Transaction validation failed: ${simErr.message || 'Unknown error'}. Please check your inputs and try again.`);
        return;
      }

      // Final balance check right before sending
      const finalBalance = await connection.getBalance(publicKey);
      const finalBalanceSOL = finalBalance / LAMPORTS_PER_SOL;
      const requiredBalance = amount + 0.002;
      
      console.log('Final balance check:', {
        finalBalanceLamports: finalBalance,
        finalBalanceSOL: finalBalanceSOL,
        requiredBalance: requiredBalance,
        amount: amount,
        hasEnough: finalBalanceSOL >= requiredBalance,
      });
      
      // Only show error if balance is actually insufficient (with small buffer for floating point)
      if (finalBalanceSOL < requiredBalance - 0.0001) {
        setBalance(finalBalanceSOL);
        setError(`❌ Insufficient balance! Your wallet has ${finalBalanceSOL.toFixed(4)} SOL, but you need ${requiredBalance.toFixed(4)} SOL (${amount} SOL bet + ~0.002 SOL for rent & fees).\n\n👉 Please use the airdrop button above to get free devnet SOL, or visit https://faucet.solana.com/`);
        return;
      }
      
      // Update balance display
      setBalance(finalBalanceSOL);
      console.log('Balance check passed, proceeding with transaction...');

      // Try manual signing first, then fallback to sendTransaction
      console.log('Attempting to sign and send transaction...');
      console.log(`Current balance: ${finalBalanceSOL.toFixed(4)} SOL, Required: ${requiredBalance.toFixed(4)} SOL`);
      
      let signature: string;
      
      // Try manual signing approach first (more reliable with some wallets)
      if (signTransaction) {
        try {
          console.log('Signing transaction manually...');
          const signedTx = await signTransaction(transaction);
          console.log('Transaction signed, sending raw transaction...');
          signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: false,
            maxRetries: 3,
          });
          console.log('Transaction sent via sendRawTransaction, signature:', signature);
        } catch (signErr: any) {
          console.warn('Manual signing failed, trying sendTransaction:', signErr);
          // Fallback to sendTransaction
          if (!sendTransaction) {
            throw new Error('No transaction sending method available');
          }
          signature = await sendTransaction(transaction, connection, {
            skipPreflight: false,
            maxRetries: 3,
          });
          console.log('Transaction sent via sendTransaction, signature:', signature);
        }
      } else if (sendTransaction) {
        // Use sendTransaction if signTransaction not available
        console.log('Using sendTransaction (wallet will sign automatically)...');
        signature = await sendTransaction(transaction, connection, {
          skipPreflight: false,
          maxRetries: 3,
        });
        console.log('Transaction sent, signature:', signature);
      } else {
        throw new Error('No transaction signing method available from wallet');
      }
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      setSuccess(`Bet created successfully! Transaction: ${signature}`);
      setBetAmount('');
      setNonce('');
    } catch (err: any) {
      console.error('Error creating bet:', err);
      
      // Try to extract more information from the error
      let errorDetails: any = {
        name: err?.name,
        message: err?.message,
        error: err?.error,
        code: err?.code,
        logs: err?.logs,
      };
      
      // Check all properties of the error object
      const errorKeys = Object.keys(err || {});
      errorDetails.allKeys = errorKeys;
      
      // Try to access common error properties
      for (const key of ['cause', 'reason', 'details', 'innerError', 'originalError']) {
        if (err?.[key]) {
          errorDetails[key] = err[key];
        }
      }
      
      // Check for inner error properties
      if (err?.error) {
        errorDetails.innerError = {
          name: err.error?.name,
          message: err.error?.message,
          code: err.error?.code,
          toString: err.error?.toString?.(),
        };
      }
      
      // Check for transaction-related properties
      if (err?.transaction) {
        errorDetails.transaction = {
          signatures: err.transaction?.signatures?.map((sig: any) => sig?.publicKey?.toBase58()),
        };
      }
      
      // Try to get string representation with all properties
      try {
        const errorObj: any = {};
        if (err) {
          Object.getOwnPropertyNames(err).forEach(key => {
            try {
              errorObj[key] = (err as any)[key];
            } catch (e) {
              errorObj[key] = '[Unable to access]';
            }
          });
        }
        errorDetails.stringified = JSON.stringify(errorObj, null, 2);
      } catch (e) {
        errorDetails.stringified = 'Could not stringify error: ' + String(e);
      }
      
      // Also try toString
      try {
        errorDetails.toString = err?.toString?.();
      } catch (e) {
        // ignore
      }
      
      console.error('Error details:', errorDetails);
      
      // Extract more detailed error message
      let errorMessage = 'Failed to create bet';
      const errString = err?.message || err?.error?.message || err?.toString() || String(err);
      const errorName = err?.name || '';
      
      // Check for specific error types
      if (errString.includes('User rejected') || errString.includes('User cancelled') || errString.includes('declined') || errString.includes('rejected')) {
        errorMessage = 'Transaction was cancelled by user.';
      } else if (errString.includes('blockhash') || errString.includes('Blockhash') || errString.includes('expired')) {
        errorMessage = 'Transaction expired. Please try again.';
      } else if (errString.includes('insufficient funds') || errString.includes('insufficient balance') || 
                 errString.includes('0x1') || errString.includes('custom program error: 0x1')) {
        // Check for insufficient balance errors
        const currentBal = balance !== null ? balance.toFixed(4) : 'unknown';
        const parsedAmount = parseFloat(betAmount) || 0;
        errorMessage = `Insufficient balance! You have ${currentBal} SOL, but need ${(parsedAmount + 0.002).toFixed(4)} SOL (bet + rent + fees).`;
      } else if (errorName === 'WalletSendTransactionError' || errString.includes('WalletSendTransactionError')) {
        // Try to extract more details from the error
        const errorDetails = err?.error || err;
        const innerMessage = errorDetails?.message || errorDetails?.toString() || '';
        
        // "Unexpected error" from Phantom usually means insufficient balance
        if (errString.includes('Unexpected error') || innerMessage.includes('Unexpected error')) {
          // Re-check balance to show current state
          let currentBal = balance;
          if (publicKey) {
            try {
              const freshBal = await connection.getBalance(publicKey);
              currentBal = freshBal / LAMPORTS_PER_SOL;
              setBalance(currentBal);
            } catch (e) {
              // Ignore balance check errors
            }
          }
          const parsedAmount = parseFloat(betAmount) || 0;
          const required = parsedAmount + 0.002;
          errorMessage = `❌ Insufficient balance! Your wallet has ${currentBal !== null ? currentBal.toFixed(4) : '0.0000'} SOL, but you need ${required.toFixed(4)} SOL (${parsedAmount} SOL bet + ~0.002 SOL for rent & fees).\n\n👉 Please use the airdrop button above to get free devnet SOL, or visit https://faucet.solana.com/`;
        } else if (innerMessage.includes('insufficient') || innerMessage.includes('0x1')) {
          const currentBal = balance !== null ? balance.toFixed(4) : 'unknown';
          const parsedAmount = parseFloat(betAmount) || 0;
          errorMessage = `Insufficient balance! You have ${currentBal} SOL, but need ${(parsedAmount + 0.002).toFixed(4)} SOL (bet + rent + fees).`;
        } else if (innerMessage.includes('rejected') || innerMessage.includes('cancelled')) {
          errorMessage = 'Transaction was cancelled by user.';
        } else {
          // Show more specific error if available
          errorMessage = innerMessage || 'Transaction failed. Please check your wallet balance and network connection, then try again.';
        }
      } else {
        // For other errors, show the actual error message
        errorMessage = errString || 'An unexpected error occurred. Please check the console for details.';
      }
      
      setError(errorMessage);
      setBetPDA(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Place a Bet</h1>
        <p style={styles.subtitle}>Create a new micro bet using PDA escrow</p>

        <div style={styles.walletSection}>
          <WalletMultiButton />
        </div>

        {!publicKey && (
          <p style={styles.hint}>Please connect your wallet to place a bet</p>
        )}

        {publicKey && (
          <div style={styles.balanceSection}>
            {balance !== null ? (
              <>
                <p style={styles.balanceLabel}>
                  Wallet Balance: <strong style={styles.balanceAmount}>{balance.toFixed(4)} SOL</strong>
                </p>
                {(balance === 0 || balance < 0.1) && (
                  <div style={styles.airdropSection}>
                    <p style={styles.airdropHint}>
                      {balance === 0 
                        ? '⚠️ You have 0 SOL! Get free devnet SOL to place bets:'
                        : '⚠️ Low balance! Get free devnet SOL:'}
                    </p>
                    <button
                      type="button"
                      onClick={requestAirdrop}
                      disabled={requestingAirdrop}
                      style={{
                        ...styles.airdropButton,
                        ...(requestingAirdrop ? styles.buttonDisabled : {}),
                      }}
                    >
                      {requestingAirdrop ? 'Requesting Airdrop...' : '🚀 Request Airdrop (Free)'}
                    </button>
                    <p style={styles.airdropNote}>
                      Make sure your wallet is connected to <strong>Solana Devnet</strong> (not Mainnet)
                    </p>
                    <div style={styles.alternativeMethods}>
                      <p style={styles.alternativeTitle}>If airdrop fails, try:</p>
                      <ul style={styles.alternativeList}>
                        <li>
                          <a 
                            href="https://faucet.solana.com/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={styles.link}
                          >
                            Solana Web Faucet
                          </a>
                        </li>
                        <li>Wait a few minutes and try again</li>
                        <li>Use Solana CLI: <code style={styles.code}>solana airdrop 2 {publicKey?.toBase58().slice(0, 8)}...</code></li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p style={styles.balanceLabel}>Loading balance...</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Bet Amount (SOL)</label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="0.1"
              required
              disabled={!publicKey || loading}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Nonce (0-255)</label>
            <input
              type="number"
              min="0"
              max="255"
              value={nonce}
              onChange={(e) => setNonce(e.target.value)}
              placeholder="0"
              required
              disabled={!publicKey || loading}
              style={styles.input}
            />
            <p style={styles.hint}>Unique identifier for this bet</p>
          </div>

          {betPDA && (
            <div style={styles.pdaDisplay}>
              <p style={styles.pdaLabel}>Bet PDA:</p>
              <code style={styles.pdaCode}>{betPDA}</code>
            </div>
          )}

          <button
            type="submit"
            disabled={!publicKey || loading}
            style={{
              ...styles.button,
              ...(loading || !publicKey ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Processing...' : 'Place Bet'}
          </button>
        </form>
      </div>

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
      {success && <SuccessToast message={success} onClose={() => setSuccess(null)} />}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: '#0a0a0a',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    border: '1px solid #2a2a2a',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: '16px',
    color: '#a0a0a0',
    marginBottom: '32px',
  },
  walletSection: {
    marginBottom: '32px',
    display: 'flex',
    justifyContent: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#e0e0e0',
  },
  input: {
    padding: '16px',
    fontSize: '16px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  hint: {
    fontSize: '12px',
    color: '#666',
  },
  pdaDisplay: {
    padding: '16px',
    backgroundColor: '#0a0a0a',
    borderRadius: '8px',
    border: '1px solid #2a2a2a',
  },
  pdaLabel: {
    fontSize: '12px',
    color: '#a0a0a0',
    marginBottom: '8px',
  },
  pdaCode: {
    fontSize: '14px',
    color: '#4ade80',
    wordBreak: 'break-all',
    fontFamily: 'monospace',
  },
  button: {
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: '600',
    backgroundColor: '#4ade80',
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#2a2a2a',
    color: '#666',
    cursor: 'not-allowed',
  },
  balanceSection: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#0a0a0a',
    borderRadius: '8px',
    border: '1px solid #2a2a2a',
  },
  balanceLabel: {
    fontSize: '14px',
    color: '#a0a0a0',
    marginBottom: '8px',
  },
  balanceAmount: {
    color: '#4ade80',
    fontSize: '16px',
  },
  airdropSection: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #2a2a2a',
  },
  airdropHint: {
    fontSize: '13px',
    color: '#fbbf24',
    marginBottom: '8px',
    fontWeight: '600',
  },
  airdropNote: {
    fontSize: '11px',
    color: '#888',
    marginTop: '8px',
    fontStyle: 'italic',
  },
  airdropButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#fbbf24',
    color: '#000000',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  alternativeMethods: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#1a1a1a',
    borderRadius: '6px',
    border: '1px solid #2a2a2a',
  },
  alternativeTitle: {
    fontSize: '12px',
    color: '#a0a0a0',
    marginBottom: '8px',
    fontWeight: '600',
  },
  alternativeList: {
    fontSize: '11px',
    color: '#888',
    margin: 0,
    paddingLeft: '20px',
    lineHeight: '1.6',
  },
  link: {
    color: '#4ade80',
    textDecoration: 'none',
  },
  code: {
    fontSize: '10px',
    backgroundColor: '#0a0a0a',
    padding: '2px 4px',
    borderRadius: '3px',
    fontFamily: 'monospace',
    color: '#4ade80',
  },
};

