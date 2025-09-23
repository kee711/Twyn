-- Update user_selected_accounts to store per-platform foreign keys
-- Threads -> social_accounts(id)
-- X       -> x_accounts(id)
-- Farcaster -> farcaster_account(id)

alter table if exists user_selected_accounts
  add column if not exists threads_social_account_id uuid,
  add column if not exists x_account_id uuid,
  add column if not exists farcaster_account_id uuid;

-- Foreign keys
do $$ begin
  alter table user_selected_accounts
    add constraint fk_user_selected_threads
    foreign key (threads_social_account_id) references social_accounts(id) on delete cascade;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table user_selected_accounts
    add constraint fk_user_selected_x
    foreign key (x_account_id) references x_accounts(id) on delete cascade;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table user_selected_accounts
    add constraint fk_user_selected_farcaster
    foreign key (farcaster_account_id) references farcaster_accounts(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- Optional: remove old generic column if exists (commented for safety)
-- alter table user_selected_accounts drop column if exists social_account_id;

-- Ensure only one FK is set depending on platform
do $$ begin
  alter table user_selected_accounts
    add constraint chk_user_selected_accounts_platform_fk
    check (
      (platform = 'threads' and threads_social_account_id is not null and x_account_id is null and farcaster_account_id is null)
      or (platform = 'x' and x_account_id is not null and threads_social_account_id is null and farcaster_account_id is null)
      or (platform = 'farcaster' and farcaster_account_id is not null and threads_social_account_id is null and x_account_id is null)
    );
exception when duplicate_object then null; end $$;

create index if not exists idx_user_selected_accounts_threads_id on user_selected_accounts(threads_social_account_id);
create index if not exists idx_user_selected_accounts_x_id on user_selected_accounts(x_account_id);
create index if not exists idx_user_selected_accounts_farcaster_id on user_selected_accounts(farcaster_account_id);


