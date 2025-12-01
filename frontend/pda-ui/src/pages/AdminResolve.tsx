import { useState } from 'react';
import { resolveBet } from '../utils/api';
import { ErrorToast } from '../components/ErrorToast';
import { SuccessToast } from '../components/SuccessToast';

export function AdminResolve() {
  const [betPDA, setBetPDA] = useState('');
  const [playerRoll, setPlayerRoll] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    signature: string;
    payout: string;
    playerWins: boolean;
    playerRoll: number;
    houseRoll: number;
    totalRoll: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setResult(null);

    if (!betPDA.trim()) {
      setError('Please enter a bet PDA');
      return;
    }

    const playerRollNum = parseInt(playerRoll, 10);
    if (isNaN(playerRollNum) || playerRollNum < 1 || playerRollNum > 6) {
      setError('Player roll must be a number between 1 and 6');
      return;
    }

    setLoading(true);

    try {
      const response = await resolveBet({
        pda: betPDA.trim(),
        playerRoll: playerRollNum,
        // houseRoll is now generated server-side for security
      });

      setResult({
        signature: response.signature,
        payout: response.payout,
        playerWins: response.playerWins,
        playerRoll: response.playerRoll,
        houseRoll: response.houseRoll,
        totalRoll: response.totalRoll,
      });

      const outcome = response.playerWins
        ? `Player wins! Payout: ${(parseInt(response.payout) / 1e9).toFixed(4)} SOL`
        : 'Player loses. No payout.';
      
      setSuccess(`Bet resolved! ${outcome}`);
    } catch (err: any) {
      console.error('Error resolving bet:', err);
      setError(err.message || 'Failed to resolve bet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Resolve Bet</h1>
        <p style={styles.subtitle}>Admin panel to resolve bets and pay out winners</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Bet PDA</label>
            <input
              type="text"
              value={betPDA}
              onChange={(e) => setBetPDA(e.target.value)}
              placeholder="Enter the bet PDA address"
              required
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Player Roll (1-6)</label>
            <input
              type="number"
              min="1"
              max="6"
              value={playerRoll}
              onChange={(e) => setPlayerRoll(e.target.value)}
              placeholder="1"
              required
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              ℹ️ House roll is generated server-side for security and fairness.
            </p>
          </div>

          {result && (
            <div style={styles.resultCard}>
              <h3 style={styles.resultTitle}>Resolution Result</h3>
              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>Outcome:</span>
                <span style={{
                  ...styles.resultValue,
                  color: result.playerWins ? '#4ade80' : '#ef4444',
                }}>
                  {result.playerWins ? 'Player Wins' : 'Player Loses'}
                </span>
              </div>
              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>Player Roll:</span>
                <span style={styles.resultValue}>{result.playerRoll}</span>
              </div>
              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>House Roll:</span>
                <span style={styles.resultValue}>{result.houseRoll}</span>
              </div>
              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>Total Roll:</span>
                <span style={styles.resultValue}>{result.totalRoll}</span>
              </div>
              {result.playerWins && (
                <div style={styles.resultRow}>
                  <span style={styles.resultLabel}>Payout:</span>
                  <span style={{ ...styles.resultValue, color: '#4ade80' }}>
                    {(parseInt(result.payout) / 1e9).toFixed(4)} SOL
                  </span>
                </div>
              )}
              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>Transaction:</span>
                <code style={styles.resultCode}>{result.signature}</code>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Resolving...' : 'Resolve Bet'}
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
    maxWidth: '600px',
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
  resultCard: {
    padding: '20px',
    backgroundColor: '#0a0a0a',
    borderRadius: '8px',
    border: '1px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  resultTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '8px',
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  resultLabel: {
    fontSize: '14px',
    color: '#a0a0a0',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: '14px',
    color: '#ffffff',
    fontWeight: '600',
  },
  resultCode: {
    fontSize: '12px',
    color: '#4ade80',
    wordBreak: 'break-all',
    fontFamily: 'monospace',
    maxWidth: '300px',
    textAlign: 'right',
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
  infoBox: {
    padding: '12px 16px',
    backgroundColor: '#1a3a1a',
    border: '1px solid #2a5a2a',
    borderRadius: '8px',
  },
  infoText: {
    fontSize: '14px',
    color: '#4ade80',
    margin: 0,
  },
};

