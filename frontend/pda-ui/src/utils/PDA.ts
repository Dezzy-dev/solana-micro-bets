import { PublicKey, SystemProgram } from '@solana/web3.js';

const PDA_SEED_PREFIX = 'microbet';

/**
 * Derives a PDA from seeds: ["microbet", playerPubkey, nonce]
 * This matches the backend derivation logic
 */
export function derivePDA(playerPubkey: PublicKey, nonce: number): {
  pda: PublicKey;
  bump: number;
} {
  const seeds = [
    Buffer.from(PDA_SEED_PREFIX),
    playerPubkey.toBuffer(),
    Buffer.from([nonce]),
  ];

  const [pda, bump] = PublicKey.findProgramAddressSync(
    seeds,
    SystemProgram.programId
  );

  return { pda, bump };
}

