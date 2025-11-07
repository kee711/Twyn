-- Add Polar-related columns and plan_type if missing
alter table if exists user_profiles
  add column if not exists plan_type text default 'Free',
  add column if not exists polar_customer_id text,
  add column if not exists polar_subscription_id text;

