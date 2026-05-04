-- ============================================================
--  IRONFORGE — AACG PLATFORM  |  Supabase Database Schema
--  Run this in your Supabase project → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES (one row per subscriber/admin)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  phone text,
  company text,
  trade text,
  plan text default 'starter',       -- starter | pro | enterprise
  role text default 'subscriber',     -- subscriber | admin | superadmin
  status text default 'trial',        -- trial | active | suspended | cancelled
  stripe_customer_id text,              -- Stripe customer ID (cus_xxx) set by webhook
  stripe_subscription_id text,          -- Active subscription ID (sub_xxx)
  trial_start timestamptz,
  trial_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: users can only read/update their own profile
alter table profiles enable row level security;
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can read all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
);
create policy "Superadmin can update all profiles" on profiles for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);

-- 2. JOBS (construction jobs per subscriber)
create table if not exists jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  address text,
  gc_name text,
  contract_amount numeric,
  start_date date,
  status text default 'active',       -- active | completed | on_hold
  lien_deadline date,
  prelim_filed boolean default false,
  created_at timestamptz default now()
);
alter table jobs enable row level security;
create policy "Users see own jobs" on jobs for all using (auth.uid() = user_id);
create policy "Superadmin sees all jobs" on jobs for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);

-- 3. AGENT LOGS (every AI agent action)
create table if not exists agent_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  agent_name text not null,
  action text,
  result text,
  job_id uuid references jobs(id),
  status text default 'completed',    -- completed | failed | pending
  created_at timestamptz default now()
);
alter table agent_logs enable row level security;
create policy "Users see own logs" on agent_logs for all using (auth.uid() = user_id);
create policy "Superadmin sees all logs" on agent_logs for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);

-- 4. INVOICES
create table if not exists invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  job_id uuid references jobs(id),
  amount numeric not null,
  status text default 'pending',      -- pending | sent | paid | overdue
  due_date date,
  paid_date date,
  invoice_number text,
  client_name text,
  created_at timestamptz default now()
);
alter table invoices enable row level security;
create policy "Users see own invoices" on invoices for all using (auth.uid() = user_id);
create policy "Superadmin sees all invoices" on invoices for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);

-- 5. LIEN FILINGS
create table if not exists lien_filings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  job_id uuid references jobs(id),
  filing_type text,                   -- preliminary_notice | mechanics_lien | bond_claim
  state text,
  status text default 'pending',      -- pending | filed | released | expired
  deadline date,
  filed_date date,
  created_at timestamptz default now()
);
alter table lien_filings enable row level security;
create policy "Users see own liens" on lien_filings for all using (auth.uid() = user_id);

-- 6. DOCUMENTS
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  job_id uuid references jobs(id),
  doc_type text,                      -- contract | change_order | lien | invoice | permit
  name text,
  url text,                           -- Supabase Storage URL
  created_at timestamptz default now()
);
alter table documents enable row level security;
create policy "Users see own docs" on documents for all using (auth.uid() = user_id);

-- 7. CONTACTS (GCs, owners, subs)
create table if not exists contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  name text,
  company text,
  email text,
  phone text,
  contact_type text,                  -- gc | owner | sub | supplier
  created_at timestamptz default now()
);
alter table contacts enable row level security;
create policy "Users see own contacts" on contacts for all using (auth.uid() = user_id);

-- Trigger: auto-update updated_at on profiles
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at();

-- ============================================================
--  ADMIN PANEL TABLES (added in v2 — required by admin/index.html)
-- ============================================================

-- 8. LIENS (used by Lien Tracker panel in admin)
--    Note: lien_filings above is an older table; this is the primary one the admin reads/writes
create table if not exists liens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  job_name text not null,
  amount numeric default 0,
  state text,
  county text,
  deadline date,
  filed_date date,
  status text default 'draft',         -- draft | prelim | filed | satisfied | disputed
  notes text,
  claimant_name text,
  gc_name text,
  owner_name text,
  property_address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table liens enable row level security;
create policy "Users see own liens v2" on liens for all using (auth.uid() = user_id);
create policy "Superadmin sees all liens v2" on liens for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);

create trigger liens_updated_at before update on liens
  for each row execute procedure update_updated_at();

-- 9. CLIENTS (used by Clients panel in admin)
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  company text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  client_type text default 'owner',    -- owner | gc | developer | property_manager
  status text default 'active',        -- active | inactive | prospect
  total_jobs int default 0,
  total_billed numeric default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table clients enable row level security;
create policy "Users see own clients" on clients for all using (auth.uid() = user_id);
create policy "Superadmin sees all clients" on clients for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);

create trigger clients_updated_at before update on clients
  for each row execute procedure update_updated_at();

-- 10. TECHNICIANS (used by Technicians panel in admin)
create table if not exists technicians (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  trade text,                          -- plumber | electrician | hvac | carpenter | etc.
  license_number text,
  license_expiry date,
  cert_osha boolean default false,
  cert_forklift boolean default false,
  cert_first_aid boolean default false,
  status text default 'active',        -- active | inactive | on_leave
  hourly_rate numeric,
  hire_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table technicians enable row level security;
create policy "Users see own technicians" on technicians for all using (auth.uid() = user_id);
create policy "Superadmin sees all technicians" on technicians for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);

create trigger technicians_updated_at before update on technicians
  for each row execute procedure update_updated_at();

-- ============================================================
--  MIGRATION: Add Stripe columns to existing profiles table
--  Run this if profiles table already exists (skip on fresh install)
-- ============================================================
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists stripe_subscription_id text;

-- ============================================================
--  SEED: Create initial superadmin account
--  Run AFTER you've signed up at the auth level
-- ============================================================
-- update profiles set role = 'superadmin' where email = 'YOUR_SUPERADMIN_EMAIL';
