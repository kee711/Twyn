-- Create x_accounts table to store Twitter/X credentials per user
create table if not exists x_accounts (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  social_id text not null,
  username text,
  access_token text not null,
  refresh_token text,
  expires_at timestamp with time zone,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create unique index if not exists uniq_x_accounts_owner_social
  on x_accounts(owner, social_id);
