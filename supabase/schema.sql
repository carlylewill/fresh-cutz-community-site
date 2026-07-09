-- Fresh Cutz Barbers — booking system schema
-- Applied directly via psql against the provisioned Supabase Postgres instance.

create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),

  customer_name text not null,
  customer_email text not null,
  customer_phone text,

  services jsonb not null,
  total_price_from numeric not null,

  preferred_barber text check (preferred_barber in ('baggio', 'rahul')),
  preferred_date date not null,
  preferred_time time not null,
  message text,

  status text not null default 'pending'
    check (status in ('pending', 'proposed_by_owner', 'proposed_by_customer', 'confirmed', 'declined', 'cancelled')),

  confirmed_date date,
  confirmed_time time,

  proposed_date date,
  proposed_time time,
  proposed_by text check (proposed_by in ('owner', 'customer')),

  owner_token uuid not null default gen_random_uuid(),
  customer_token uuid not null default gen_random_uuid(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists bookings_owner_token_idx on public.bookings (owner_token);
create unique index if not exists bookings_customer_token_idx on public.bookings (customer_token);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row
  execute function public.set_updated_at();

-- RLS: table is fully locked down from anon/authenticated roles.
-- All access happens server-side via the service-role key, which bypasses RLS entirely.
alter table public.bookings enable row level security;
