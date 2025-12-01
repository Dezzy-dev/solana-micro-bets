import * as fs from 'fs';
import * as path from 'path';

export interface HouseTransactionLog {
  type: 'deposit' | 'withdraw' | 'payout';
  amountLamports: number;
  to?: string;
  from?: string;
  txSignature: string;
  timestamp: string;
  note?: string;
}

const LOG_FILE_PATH = path.join(__dirname, '../../logs/house-transactions.json');

/**
 * Ensures the logs directory exists
 */
function ensureLogsDirectory(): void {
  const logsDir = path.dirname(LOG_FILE_PATH);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

/**
 * Reads existing transaction logs from file
 */
function readLogs(): HouseTransactionLog[] {
  ensureLogsDirectory();
  
  if (!fs.existsSync(LOG_FILE_PATH)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading house transaction logs:', error);
    return [];
  }
}

/**
 * Writes transaction logs to file
 */
function writeLogs(logs: HouseTransactionLog[]): void {
  ensureLogsDirectory();
  
  try {
    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing house transaction logs:', error);
  }
}

/**
 * Appends a transaction log entry
 */
export function logHouseTransaction(log: HouseTransactionLog): void {
  const logs = readLogs();
  logs.push({
    ...log,
    timestamp: log.timestamp || new Date().toISOString(),
  });
  writeLogs(logs);
  console.log(`📝 Logged house transaction: ${log.type} - ${log.amountLamports} lamports`);
}

/**
 * Reads all transaction logs (exported for profit/loss calculation)
 */
export function getAllLogs(): HouseTransactionLog[] {
  return readLogs();
}

