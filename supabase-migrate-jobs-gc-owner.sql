-- ============================================================
--  Migration: Add gc_id + owner_id to jobs table
--  Run this in Supabase SQL Editor (one-time, safe to re-run)
-- ============================================================

-- Add GC foreign key to jobs
alter table jobs add column if not exists gc_id uuid references gc_profiles(id) on delete set null;

-- Add Owner foreign key to jobs
alter table jobs add column if not exists owner_id uuid references owner_profiles(id) on delete set null;

-- RLS: GC can read jobs assigned to them
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='jobs' and policyname='GC sees assigned jobs'
  ) then
    create policy "GC sees assigned jobs" on jobs for select using (auth.uid() = gc_id);
  end if;
end $$;

-- RLS: Owner can read jobs assigned to them
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='jobs' and policyname='Owner sees assigned jobs'
  ) then
    create policy "Owner sees assigned jobs" on jobs for select using (auth.uid() = owner_id);
  end if;
end $$;

-- Indexes for performance
create index if not exists idx_jobs_gc_id on jobs (gc_id);
create index if not exists idx_jobs_owner_id on jobs (owner_id);

select 'Migration complete ✅' as result;
