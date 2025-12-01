-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  wallet TEXT PRIMARY KEY,
  total_wins INTEGER DEFAULT 0 NOT NULL,
  total_losses INTEGER DEFAULT 0 NOT NULL,
  total_earned NUMERIC DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bets table
CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bet_id TEXT,
  user_wallet TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  user_roll INTEGER,
  house_roll INTEGER,
  outcome TEXT,
  tx_signature TEXT,
  bet_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_wallet) REFERENCES users(wallet) ON DELETE CASCADE
);

-- Create index on user_wallet for faster lookups
CREATE INDEX IF NOT EXISTS idx_bets_user_wallet ON bets(user_wallet);

-- Create index on bet_time for faster time-based queries
CREATE INDEX IF NOT EXISTS idx_bets_bet_time ON bets(bet_time DESC);

-- Create index on bet_id for faster bet lookups
CREATE INDEX IF NOT EXISTS idx_bets_bet_id ON bets(bet_id) WHERE bet_id IS NOT NULL;

-- Create index on tx_signature for transaction lookups
CREATE INDEX IF NOT EXISTS idx_bets_tx_signature ON bets(tx_signature) WHERE tx_signature IS NOT NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to tables
COMMENT ON TABLE users IS 'Stores user statistics for Solana betting game';
COMMENT ON TABLE bets IS 'Stores individual bet records with roll outcomes and transaction signatures';

