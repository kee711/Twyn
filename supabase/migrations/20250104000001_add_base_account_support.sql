-- Add Base Account address column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS base_account_address TEXT UNIQUE;

-- Create index for Base Account address lookups
CREATE INDEX IF NOT EXISTS idx_users_base_account_address ON users(base_account_address);

-- Add comment for documentation
COMMENT ON COLUMN users.base_account_address IS 'Base Account wallet address for Web3 authentication';