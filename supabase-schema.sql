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

-- MIGRATION: Add messaging channel columns to existing profiles table
-- Run this if profiles table already exists (skip on fresh install)
alter table profiles add column if not exists wechat_userid text;   -- WeChat Work UserID for WeChat notifications

-- 11. PHOTO INSPECTIONS (AI photo analysis results — Photo AI panel)
create table if not exists photo_inspections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  project_id uuid references jobs(id) on delete set null,
  project_name text,
  analysis_type text default 'full',   -- safety | progress | quality | materials | full
  photo_url text,                       -- URL if stored in Supabase Storage
  result text,                          -- Full Claude vision analysis text
  severity text default 'ok',          -- critical | warning | ok
  status text default 'pending',       -- pending | approved | rejected
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table photo_inspections enable row level security;
create policy "Users see own photo_inspections" on photo_inspections for all using (auth.uid() = user_id);
create policy "Superadmin sees all photo_inspections" on photo_inspections for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create trigger photo_inspections_updated_at before update on photo_inspections
  for each row execute procedure update_updated_at();

-- 12. COMPLIANCE ITEMS (licenses, permits, certs — Compliance panel)
create table if not exists compliance_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  name text not null,                   -- e.g. "Contractor License CA"
  category text,                        -- license | permit | insurance | certification
  issuer text,                          -- e.g. "CSLB"
  license_number text,
  deadline date not null,               -- expiry / renewal date
  reminder_days int default 30,         -- warn X days before deadline
  status text default 'current',       -- current | expiring | expired | renewed
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table compliance_items enable row level security;
create policy "Users see own compliance_items" on compliance_items for all using (auth.uid() = user_id);
create policy "Superadmin sees all compliance_items" on compliance_items for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create trigger compliance_items_updated_at before update on compliance_items
  for each row execute procedure update_updated_at();

-- 13. TEAM MEMBERS (per-subscriber team invites — Team panel)
create table if not exists team_members (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references profiles(id) on delete cascade,  -- the subscriber who owns this seat
  user_id uuid references profiles(id) on delete set null,  -- linked profile if accepted
  name text not null,
  email text not null,
  role text default 'member',           -- owner | admin | manager | field_tech | viewer
  access_level text default 'standard',-- full | standard | limited | readonly
  status text default 'pending',       -- pending | active | inactive | offline | online
  last_active timestamptz,
  invited_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table team_members enable row level security;
create policy "Users see own team" on team_members for all using (auth.uid() = owner_id);
create policy "Members see own record" on team_members for select using (auth.uid() = user_id);
create policy "Superadmin sees all team_members" on team_members for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create trigger team_members_updated_at before update on team_members
  for each row execute procedure update_updated_at();

-- ============================================================
--  PHOTO-TO-PAYMENT SYSTEM (v3)
--  Tables: photo_submissions, payment_negotiations, gc_profiles, owner_profiles
-- ============================================================

-- 14. GC PROFILES (General Contractors — separate login portal)
create table if not exists gc_profiles (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  name text,
  company text,
  phone text,
  wechat_userid text,
  stripe_customer_id text,
  stripe_account_id text,           -- Stripe Connect account for sending payments
  notify_channel text default 'sms',-- sms | whatsapp | wechat
  status text default 'active',     -- active | inactive
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table gc_profiles enable row level security;
create policy "GC sees own profile" on gc_profiles for all using (auth.uid() = id);
create policy "Superadmin sees all gc_profiles" on gc_profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create trigger gc_profiles_updated_at before update on gc_profiles
  for each row execute procedure update_updated_at();

-- 15. OWNER PROFILES (Property Owners — separate login portal)
create table if not exists owner_profiles (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  name text,
  company text,
  phone text,
  wechat_userid text,
  stripe_customer_id text,
  notify_channel text default 'sms',-- sms | whatsapp | wechat
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table owner_profiles enable row level security;
create policy "Owner sees own profile" on owner_profiles for all using (auth.uid() = id);
create policy "Superadmin sees all owner_profiles" on owner_profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create trigger owner_profiles_updated_at before update on owner_profiles
  for each row execute procedure update_updated_at();

-- 16. PHOTO SUBMISSIONS (inbound from WhatsApp/WeChat/upload — feeds payment flow)
create table if not exists photo_submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,    -- sub-contractor who submitted
  job_id uuid references jobs(id) on delete set null,
  job_name text,
  photo_url text not null,                                    -- Supabase Storage URL
  source text default 'upload',                              -- upload | whatsapp | wechat
  source_from text,                                          -- phone number or WeChat UserID
  ai_analysis text,                                          -- Full Claude Vision result
  ai_progress_pct numeric,                                   -- 0-100, extracted from analysis
  ai_amount numeric,                                         -- AI suggested payment amount
  severity text default 'ok',                                -- critical | warning | ok
  status text default 'analyzed',                            -- received | analyzing | analyzed | submitted | paid
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table photo_submissions enable row level security;
create policy "Users see own photo_submissions" on photo_submissions for all using (auth.uid() = user_id);
create policy "Superadmin sees all photo_submissions" on photo_submissions for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create trigger photo_submissions_updated_at before update on photo_submissions
  for each row execute procedure update_updated_at();

-- 17. PAYMENT NEGOTIATIONS (the 4-party amount negotiation per photo submission)
create table if not exists payment_negotiations (
  id uuid default gen_random_uuid() primary key,
  photo_submission_id uuid references photo_submissions(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  sub_id uuid references profiles(id) on delete set null,     -- sub-contractor
  gc_id uuid references gc_profiles(id) on delete set null,   -- general contractor
  owner_id uuid references owner_profiles(id) on delete set null, -- property owner

  -- The 4 negotiation amounts
  ai_amount numeric,                   -- Claude Vision suggested amount
  sub_requested numeric,               -- Sub's requested payment
  gc_approved numeric,                 -- GC's approved amount
  owner_released numeric,              -- Owner's final released amount

  -- Negotiation notes from each party
  sub_note text,
  gc_note text,
  owner_note text,

  -- Payment
  payment_method text,                 -- stripe | manual
  stripe_transfer_id text,             -- Stripe transfer ID if paid via Stripe
  payment_status text default 'pending', -- pending | gc_approved | owner_approved | paid | rejected
  paid_at timestamptz,

  -- Workflow state
  status text default 'pending_gc',    -- pending_gc | pending_owner | approved | paid | rejected
  submitted_at timestamptz default now(),
  gc_reviewed_at timestamptz,
  owner_reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table payment_negotiations enable row level security;
create policy "Sub sees own negotiations" on payment_negotiations for all using (auth.uid() = sub_id);
create policy "GC sees assigned negotiations" on payment_negotiations for all using (auth.uid() = gc_id);
create policy "Owner sees assigned negotiations" on payment_negotiations for all using (auth.uid() = owner_id);
create policy "Superadmin sees all negotiations" on payment_negotiations for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create trigger payment_negotiations_updated_at before update on payment_negotiations
  for each row execute procedure update_updated_at();

-- 18. PROJECT DRAWINGS (architectural/engineering plans per job — used by Claude Vision for comparison)
create table if not exists project_drawings (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references jobs(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade,    -- uploader (sub or admin)
  drawing_type text not null,                                 -- architectural | structural | electrical | plumbing | mechanical | scope | other
  title text not null,
  description text,
  file_url text not null,                                     -- Supabase Storage URL
  file_type text default 'pdf',                               -- pdf | image | dwg
  version text default '1.0',                                 -- drawing revision/version
  is_current boolean default true,                            -- mark superseded drawings as false
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table project_drawings enable row level security;
create policy "Users see own drawings" on project_drawings for all using (auth.uid() = user_id);
create policy "Users with job access see drawings" on project_drawings for select using (
  exists (select 1 from jobs where id = project_drawings.job_id and user_id = auth.uid())
);
create policy "Superadmin sees all drawings" on project_drawings for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create trigger project_drawings_updated_at before update on project_drawings
  for each row execute procedure update_updated_at();

-- Index for fast lookup of current drawings by job
create index if not exists idx_project_drawings_job_id on project_drawings (job_id, is_current);

-- ============================================================
--  SEED: Create initial superadmin account
--  Run AFTER you've signed up at the auth level
-- ============================================================
-- update profiles set role = 'superadmin' where email = 'YOUR_SUPERADMIN_EMAIL';
