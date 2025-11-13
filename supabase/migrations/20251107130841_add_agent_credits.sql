-- Add agent credits tracking columns to user_profiles
alter table if exists public.user_profiles
  add column if not exists agent_credits integer,
  add column if not exists agent_credits_reset_at timestamp with time zone;
