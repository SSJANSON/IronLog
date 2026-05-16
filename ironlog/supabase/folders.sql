-- Template folders
create table if not exists template_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  parent_id uuid references template_folders(id) on delete cascade,
  created_at timestamptz default now()
);

alter table template_folders enable row level security;

create policy "Users manage own folders"
  on template_folders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Add folder_id to templates
alter table templates
  add column if not exists folder_id uuid references template_folders(id) on delete set null;
