-- Add Farcaster-specific fields to user_profiles table for web3 authentication

ALTER TABLE "public"."user_profiles" 
ADD COLUMN IF NOT EXISTS "farcaster_fid" integer,
ADD COLUMN IF NOT EXISTS "farcaster_username" text,
ADD COLUMN IF NOT EXISTS "farcaster_display_name" text,
ADD COLUMN IF NOT EXISTS "farcaster_pfp_url" text;

-- Create index on farcaster_fid for efficient lookups during authentication
CREATE INDEX IF NOT EXISTS "idx_user_profiles_farcaster_fid" ON "public"."user_profiles" ("farcaster_fid");

-- Add unique constraint on farcaster_fid to prevent duplicate Farcaster accounts
ALTER TABLE "public"."user_profiles" 
ADD CONSTRAINT "user_profiles_farcaster_fid_key" UNIQUE ("farcaster_fid");