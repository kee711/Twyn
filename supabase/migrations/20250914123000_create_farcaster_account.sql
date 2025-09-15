-- farcaster_account 테이블 생성
create table if not exists farcaster_account (
  id uuid primary key default gen_random_uuid(),
  owner text not null,
  fid bigint not null,
  username text,
  custody_address text,
  signer_public_key_hex text,
  signer_private_key_enc text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_farcaster_account_owner on farcaster_account(owner);
create unique index if not exists uniq_farcaster_account_owner_fid on farcaster_account(owner, fid);


