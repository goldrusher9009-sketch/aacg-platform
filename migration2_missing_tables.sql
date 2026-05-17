-- ============================================================
-- MIGRATION 2: Create missing tables that app.js expects
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. LIENS table (Lien Tracker panel)
create table if not exists liens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  job_name text not null,
  amount numeric default 0,
  state text,
  county text,
  deadline date,
  filed_date date,
  status text default 'draft',
  notes text,
  claimant_name text,
  gc_name text,
  owner_name text,
  property_address text,
  project text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table liens enable row level security;
drop policy if exists "Users see own liens v2" on liens;
create policy "Users see own liens v2" on liens for all using (auth.uid() = user_id);

-- 2. CLIENTS table (Clients panel)
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  company text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  client_type text default 'owner',
  status text default 'active',
  total_jobs int default 0,
  total_billed numeric default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table clients enable row level security;
drop policy if exists "Users see own clients" on clients;
create policy "Users see own clients" on clients for all using (auth.uid() = user_id);

-- 3. TECHNICIANS table (Technicians panel)
create table if not exists technicians (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  trade text,
  license_number text,
  license_expiry date,
  cert_osha boolean default false,
  cert_forklift boolean default false,
  cert_first_aid boolean default false,
  status text default 'active',
  hourly_rate numeric,
  hire_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table technicians enable row level security;
drop policy if exists "Users see own technicians" on technicians;
create policy "Users see own technicians" on technicians for all using (auth.uid() = user_id);

-- 4. PHOTO_SUBMISSIONS table (Photo AI panel)
create table if not exists photo_submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  photo_url text,
  thumbnail_url text,
  description text,
  ai_analysis text,
  ai_findings jsonb,
  status text default 'pending',
  submitted_to_gc boolean default false,
  gc_id uuid,
  owner_id uuid,
  source text default 'upload',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table photo_submissions enable row level security;
drop policy if exists "Users see own photo_submissions" on photo_submissions;
create policy "Users see own photo_submissions" on photo_submissions for all using (auth.uid() = user_id);

-- 5. PAYMENT_NEGOTIATIONS table (GC payment flow)
create table if not exists payment_negotiations (
  id uuid default gen_random_uuid() primary key,
  photo_submission_id uuid references photo_submissions(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  sub_id uuid references auth.users(id) on delete set null,
  gc_id uuid,
  owner_id uuid,
  sub_amount numeric,
  gc_amount numeric,
  owner_amount numeric,
  final_amount numeric,
  status text default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table payment_negotiations enable row level security;
drop policy if exists "Users see own payment_negotiations" on payment_negotiations;
create policy "Users see own payment_negotiations" on payment_negotiations for all using (auth.uid() = sub_id);
