-- idempotent feed_items
create table if not exists public.feed_items (
  id uuid primary key default gen_random_uuid()
);
alter table public.feed_items
  add column if not exists title text not null,
  add column if not exists content text,
  add column if not exists source text,
  add column if not exists created_at timestamptz default now();