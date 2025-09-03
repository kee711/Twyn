-- Supabase Dashboard에서 직접 실행할 SQL
-- SQL Editor에서 이 쿼리를 실행하세요

-- Create invite_codes table
CREATE TABLE IF NOT EXISTS invite_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    max_usage INTEGER,
    used_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster code lookups
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

-- Add invite_code_id to user_profiles table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'invite_code_id'
    ) THEN
        ALTER TABLE user_profiles
        ADD COLUMN invite_code_id UUID REFERENCES invite_codes(id);
    END IF;
END $$;

-- Create function to validate and use invite code
CREATE OR REPLACE FUNCTION validate_and_use_invite_code(
    p_code TEXT,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invite_code RECORD;
    v_result JSONB;
BEGIN
    -- Lock the row for update to prevent race conditions
    SELECT * INTO v_invite_code
    FROM invite_codes
    WHERE code = p_code
    FOR UPDATE;

    -- Check if code exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid invite code'
        );
    END IF;

    -- Check if code is expired
    IF v_invite_code.expires_at IS NOT NULL AND v_invite_code.expires_at < now() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invite code has expired'
        );
    END IF;

    -- Check if code has reached max usage
    IF v_invite_code.max_usage IS NOT NULL AND v_invite_code.used_count >= v_invite_code.max_usage THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invite code usage limit reached'
        );
    END IF;

    -- Update used count
    UPDATE invite_codes
    SET used_count = used_count + 1
    WHERE id = v_invite_code.id;

    -- Update user profile with invite code
    UPDATE user_profiles
    SET invite_code_id = v_invite_code.id
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'invite_code_id', v_invite_code.id
    );
END;
$$;

-- Insert sample invite codes for testing (only if they don't exist)
INSERT INTO invite_codes (code, max_usage, expires_at)
VALUES 
    ('EARLY_ACCESS', 100, '2025-12-31'::timestamptz),
    ('BETA_USER', 50, '2025-06-30'::timestamptz),
    ('VIP_INVITE', NULL, NULL)
ON CONFLICT (code) DO NOTHING;