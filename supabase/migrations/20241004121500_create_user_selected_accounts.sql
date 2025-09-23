drop table if exists user_selected_accounts;

create table if not exists user_selected_accounts (
  user_id uuid not null references auth.users(id) on delete cascade,
  social_account_id uuid not null references social_accounts(id) on delete cascade,
  platform text not null,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, platform)
);

create index if not exists idx_user_selected_accounts_user on user_selected_accounts(user_id);

insert into user_selected_accounts (user_id, social_account_id, platform)
select up.user_id::uuid, sa.id, sa.platform
from user_profiles up
join social_accounts sa
  on sa.owner = up.user_id
 and sa.social_id = up.selected_social_id
where up.selected_social_id is not null
on conflict (user_id, platform) do nothing;
