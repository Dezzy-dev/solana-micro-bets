-- Add nonce and bump fields to bets table for escrow data storage
ALTER TABLE bets 
ADD COLUMN IF NOT EXISTS nonce INTEGER,
ADD COLUMN IF NOT EXISTS bump INTEGER;

-- Add comment
COMMENT ON COLUMN bets.nonce IS 'Nonce used for PDA derivation';
COMMENT ON COLUMN bets.bump IS 'Bump seed for PDA derivation';

