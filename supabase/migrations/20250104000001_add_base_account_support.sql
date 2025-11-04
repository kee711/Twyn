-- Add Base Account address column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS base_account_address TEXT UNIQUE;

-- Create index for Base Account address lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_base_account_address ON user_profiles(base_account_address);

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.base_account_address IS 'Base Account wallet address for Web3 authentication';