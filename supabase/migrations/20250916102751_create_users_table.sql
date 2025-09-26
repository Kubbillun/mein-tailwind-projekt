create table public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  created_at timestamptz default now()
);