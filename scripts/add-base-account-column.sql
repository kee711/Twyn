-- Add Base Account address column to user_profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'base_account_address'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN base_account_address TEXT UNIQUE;
        CREATE INDEX idx_user_profiles_base_account_address ON user_profiles(base_account_address);
        
        -- Add comment for documentation
        COMMENT ON COLUMN user_profiles.base_account_address IS 'Base Account wallet address for Web3 authentication';
        
        RAISE NOTICE 'Added base_account_address column to user_profiles table';
    ELSE
        RAISE NOTICE 'base_account_address column already exists';
    END IF;
END $$;