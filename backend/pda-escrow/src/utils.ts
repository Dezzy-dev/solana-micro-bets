import { PublicKey, SystemProgram } from '@solana/web3.js';
import * as crypto from 'crypto';

const PDA_SEED_PREFIX = 'microbet';

/**
 * Derives a PDA from seeds: ["microbet", playerPubkey, nonce]
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

/**
 * Account data layout:
 * - player: 32 bytes (PublicKey)
 * - amount: 8 bytes (u64, little-endian)
 * - settled: 1 byte (u8 boolean)
 * - nonce: 1 byte (u8)
 * - bump: 1 byte (u8)
 * Total: 43 bytes
 */
export const ACCOUNT_DATA_SIZE = 43;

export interface EscrowAccountData {
  player: PublicKey;
  amount: bigint;
  settled: boolean;
  nonce: number;
  bump: number;
}

/**
 * Serializes escrow account data to Buffer
 */
export function serializeEscrowData(data: EscrowAccountData): Buffer {
  const buffer = Buffer.alloc(ACCOUNT_DATA_SIZE);
  let offset = 0;

  // player (32 bytes)
  data.player.toBuffer().copy(buffer, offset);
  offset += 32;

  // amount (8 bytes, u64 little-endian)
  buffer.writeBigUInt64LE(data.amount, offset);
  offset += 8;

  // settled (1 byte)
  buffer.writeUInt8(data.settled ? 1 : 0, offset);
  offset += 1;

  // nonce (1 byte)
  buffer.writeUInt8(data.nonce, offset);
  offset += 1;

  // bump (1 byte)
  buffer.writeUInt8(data.bump, offset);

  return buffer;
}

/**
 * Deserializes escrow account data from Buffer
 */
export function deserializeEscrowData(buffer: Buffer): EscrowAccountData {
  if (buffer.length < ACCOUNT_DATA_SIZE) {
    throw new Error(`Invalid account data size: expected ${ACCOUNT_DATA_SIZE}, got ${buffer.length}`);
  }

  let offset = 0;

  // player (32 bytes)
  const player = new PublicKey(buffer.slice(offset, offset + 32));
  offset += 32;

  // amount (8 bytes, u64 little-endian)
  const amount = buffer.readBigUInt64LE(offset);
  offset += 8;

  // settled (1 byte)
  const settled = buffer.readUInt8(offset) !== 0;
  offset += 1;

  // nonce (1 byte)
  const nonce = buffer.readUInt8(offset);
  offset += 1;

  // bump (1 byte)
  const bump = buffer.readUInt8(offset);

  return {
    player,
    amount,
    settled,
    nonce,
    bump,
  };
}

/**
 * Generates a random roll (1-6)
 */
export function generateRoll(): number {
  return crypto.randomInt(1, 7);
}

/**
 * Calculates payout for a winning bet (5.5x multiplier)
 */
export function calculatePayout(amount: bigint): bigint {
  // 5.5x = amount * 11 / 2
  return (amount * BigInt(11)) / BigInt(2);
}

