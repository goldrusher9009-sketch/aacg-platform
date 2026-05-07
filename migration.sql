-- AACG Platform — Production Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- Project: wausefmzaqtlomyhqcjf (aacgplatform.com)

-- ─────────────────────────────────────────────────────────────
-- 1. Add missing columns to payment_negotiations
-- ─────────────────────────────────────────────────────────────
ALTER TABLE payment_negotiations
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_value NUMERIC;

-- ─────────────────────────────────────────────────────────────
-- 2. Create gc_profiles table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gc_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  company TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 3. Create owner_profiles table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS owner_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  company TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 4. RLS on gc_profiles
-- ─────────────────────────────────────────────────────────────
ALTER TABLE gc_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gc_profiles' AND policyname='GCs can read own profile') THEN
    CREATE POLICY "GCs can read own profile" ON gc_profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gc_profiles' AND policyname='GCs can insert own profile') THEN
    CREATE POLICY "GCs can insert own profile" ON gc_profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gc_profiles' AND policyname='GCs can update own profile') THEN
    CREATE POLICY "GCs can update own profile" ON gc_profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 5. RLS on owner_profiles
-- ─────────────────────────────────────────────────────────────
ALTER TABLE owner_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='owner_profiles' AND policyname='Owners can read own profile') THEN
    CREATE POLICY "Owners can read own profile" ON owner_profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='owner_profiles' AND policyname='Owners can insert own profile') THEN
    CREATE POLICY "Owners can insert own profile" ON owner_profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='owner_profiles' AND policyname='Owners can update own profile') THEN
    CREATE POLICY "Owners can update own profile" ON owner_profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 6. Verify
-- ─────────────────────────────────────────────────────────────
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('gc_profiles','owner_profiles','payment_negotiations')
  AND column_name IN ('id','payment_status','paid_at','contract_value','name','email','phone','company','status')
ORDER BY table_name, column_name;
