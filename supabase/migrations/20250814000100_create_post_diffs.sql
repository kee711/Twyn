-- Create table: post_diffs
create table if not exists public.post_diffs (
  id uuid primary key default gen_random_uuid(),
  draft_content text,
  final_content text,
  diff_content jsonb,
  created_at timestamp with time zone default now()
);

comment on table public.post_diffs is 'AI 생성 초안과 확정본의 diff 저장 테이블';
comment on column public.post_diffs.draft_content is 'AI 생성 초안 내용';
comment on column public.post_diffs.final_content is '최종 확정 내용';
comment on column public.post_diffs.diff_content is '변경된 부분 기록(JSON)';

-- Optional: RLS (align later with app auth model)
alter table public.post_diffs enable row level security;

-- simple permissive policy to unblock development (restrict later)
do $$ begin
  if not exists (
    select 1 from pg_policy where polname = 'post_diffs_allow_all'
  ) then
    create policy post_diffs_allow_all on public.post_diffs for all using (true) with check (true);
  end if;
end $$;

