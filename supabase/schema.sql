create extension if not exists pgcrypto;

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  status text not null,
  timestamp timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  description text not null,
  status text not null default 'Open',
  created_at timestamptz not null default now()
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text not null,
  priority text not null,
  status text not null default 'Open',
  requester text not null,
  created_at timestamptz not null default now()
);

alter table public.attendance enable row level security;
alter table public.complaints enable row level security;
alter table public.service_requests enable row level security;

drop policy if exists "public read attendance" on public.attendance;
drop policy if exists "public insert attendance" on public.attendance;
drop policy if exists "public read complaints" on public.complaints;
drop policy if exists "public insert complaints" on public.complaints;
drop policy if exists "public update complaints" on public.complaints;
drop policy if exists "public read service_requests" on public.service_requests;
drop policy if exists "public insert service_requests" on public.service_requests;
drop policy if exists "public update service_requests" on public.service_requests;

create policy "public read attendance"
  on public.attendance
  for select
  using (true);

create policy "public insert attendance"
  on public.attendance
  for insert
  with check (true);

create policy "public read complaints"
  on public.complaints
  for select
  using (true);

create policy "public insert complaints"
  on public.complaints
  for insert
  with check (true);

create policy "public update complaints"
  on public.complaints
  for update
  using (true)
  with check (true);

create policy "public read service_requests"
  on public.service_requests
  for select
  using (true);

create policy "public insert service_requests"
  on public.service_requests
  for insert
  with check (true);

create policy "public update service_requests"
  on public.service_requests
  for update
  using (true)
  with check (true);
