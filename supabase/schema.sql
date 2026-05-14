-- Run this in Supabase SQL Editor

create table if not exists tasks (
  id          text primary key,           -- UUID generated on device
  device_id   text not null,              -- identifies which device created it
  title       text not null,
  description text,
  priority    text check (priority in ('low', 'med', 'high')) default 'med',
  due_date    text,
  assignee    text,
  done        boolean default false,
  deleted     boolean default false,      -- soft delete for sync
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Index for fast device queries
create index if not exists tasks_device_id_idx on tasks(device_id);
create index if not exists tasks_updated_at_idx on tasks(updated_at);

-- Auto-update updated_at on every row change
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

-- Enable Row Level Security (open policy — no auth in this app)
alter table tasks enable row level security;

create policy "Allow all" on tasks
  for all using (true) with check (true);

-- Enable realtime
alter publication supabase_realtime add table tasks;
