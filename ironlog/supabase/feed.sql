-- Run this in Supabase SQL Editor after schema.sql

create table public.feed_items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  type           text not null check (type in ('session', 'pr')),
  session_id     uuid references public.sessions(id) on delete cascade,
  session_name   text,
  movement_count integer,
  movement       text,
  weight         numeric,
  reps           integer,
  e1rm           numeric,
  created_at     timestamptz not null default now()
);

alter table public.feed_items enable row level security;

-- Users see their own items + accepted friends' items
create policy "Users see own and friends feed items"
  on public.feed_items for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.friends f
      where f.status = 'accepted'
      and (
        (f.user_id = auth.uid() and f.friend_id = user_id)
        or (f.friend_id = auth.uid() and f.user_id = user_id)
      )
    )
  );

create policy "Users insert their own feed items"
  on public.feed_items for insert
  with check (auth.uid() = user_id);

create policy "Users delete their own feed items"
  on public.feed_items for delete
  using (auth.uid() = user_id);
