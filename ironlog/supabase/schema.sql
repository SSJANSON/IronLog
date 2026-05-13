-- ============================================================
-- IronLog Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Profiles (extends auth.users, created automatically on signup)
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text not null,
  unit         text not null default 'kg' check (unit in ('kg', 'lb')),
  privacy_public boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Templates
create table public.templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  movements   jsonb not null default '[]',
  accessories jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

-- Sessions
create table public.sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  template_id   text,
  template_name text not null,
  date          timestamptz not null,
  completed     boolean not null default false,
  movements     jsonb not null default '[]',
  created_at    timestamptz not null default now()
);

-- Friends
create table public.friends (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  friend_id   uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at  timestamptz not null default now(),
  unique (user_id, friend_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles  enable row level security;
alter table public.templates enable row level security;
alter table public.sessions  enable row level security;
alter table public.friends   enable row level security;

-- Profiles: users can read public profiles, only edit their own
create policy "Public profiles are viewable"
  on public.profiles for select
  using (privacy_public = true or auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Templates: private to owner
create policy "Users manage their own templates"
  on public.templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Sessions: owner sees all; friends see completed sessions of public profiles
create policy "Users manage their own sessions"
  on public.sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Friends can view completed sessions of public users"
  on public.sessions for select
  using (
    completed = true
    and exists (
      select 1 from public.profiles p
      where p.id = user_id and p.privacy_public = true
    )
    and exists (
      select 1 from public.friends f
      where f.status = 'accepted'
      and ((f.user_id = auth.uid() and f.friend_id = user_id)
        or (f.friend_id = auth.uid() and f.user_id = user_id))
    )
  );

-- Friends: users see their own friend rows
create policy "Users manage their own friend rows"
  on public.friends for all
  using (auth.uid() = user_id or auth.uid() = friend_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
