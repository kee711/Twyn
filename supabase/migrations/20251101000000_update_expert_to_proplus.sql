-- Normalize legacy plan_type values from 'Expert' to 'ProPlus'
update user_profiles set plan_type = 'ProPlus' where plan_type = 'Expert';

-- Optional: if you have a 'plan' table with plan_type entries
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'plan') then
    update plan set plan_type = 'ProPlus' where plan_type = 'Expert';
  end if;
end $$;

