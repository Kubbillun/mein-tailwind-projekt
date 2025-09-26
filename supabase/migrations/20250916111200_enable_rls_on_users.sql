alter table public.users enable row level security;

create policy "users can view their own data"
on public.users
for select
using (auth.uid() = id);

create policy "users can update their own data"
on public.users
for update
using (auth.uid() = id);