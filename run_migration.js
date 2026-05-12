const https = require('https');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdXNlZm16YXF0bG9teWhxY2pmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMTM0MzIzMDEsImV4cCI6MTg3MzAwMDMyMzB9';
const PROJECT = 'wausefmzaqtlomyhqcjf';

function runSQL(label, sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: 'api.supabase.com',
      path: '/v1/projects/' + PROJECT + '/database/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        console.log(label + ': HTTP ' + res.statusCode + ' -> ' + data.substring(0, 500));
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', e => { console.error(label + ' ERROR: ' + e.message); reject(e); });
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('=== AACG Supabase Migration ===');

  await runSQL('STEP1 ALTER payment_negotiations',
    "ALTER TABLE payment_negotiations " +
    "ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending', " +
    "ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ, " +
    "ADD COLUMN IF NOT EXISTS contract_value NUMERIC;"
  );

  await runSQL('STEP2 CREATE gc_profiles',
    "CREATE TABLE IF NOT EXISTS gc_profiles (" +
    "id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, " +
    "email TEXT, name TEXT, company TEXT, phone TEXT, " +
    "status TEXT DEFAULT 'active', " +
    "created_at TIMESTAMPTZ DEFAULT NOW());"
  );

  await runSQL('STEP3 CREATE owner_profiles',
    "CREATE TABLE IF NOT EXISTS owner_profiles (" +
    "id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, " +
    "email TEXT, name TEXT, company TEXT, phone TEXT, " +
    "status TEXT DEFAULT 'active', " +
    "created_at TIMESTAMPTZ DEFAULT NOW());"
  );

  await runSQL('STEP4 RLS gc_profiles',
    "ALTER TABLE gc_profiles ENABLE ROW LEVEL SECURITY; " +
    "DO $$ BEGIN " +
    "IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gc_profiles' AND policyname='GCs can read own profile') THEN " +
    "CREATE POLICY \"GCs can read own profile\" ON gc_profiles FOR SELECT USING (auth.uid() = id); END IF; " +
    "IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gc_profiles' AND policyname='GCs can insert own profile') THEN " +
    "CREATE POLICY \"GCs can insert own profile\" ON gc_profiles FOR INSERT WITH CHECK (auth.uid() = id); END IF; " +
    "IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gc_profiles' AND policyname='GCs can update own profile') THEN " +
    "CREATE POLICY \"GCs can update own profile\" ON gc_profiles FOR UPDATE USING (auth.uid() = id); END IF; " +
    "END $$;"
  );

  await runSQL('STEP5 RLS owner_profiles',
    "ALTER TABLE owner_profiles ENABLE ROW LEVEL SECURITY; " +
    "DO $$ BEGIN " +
    "IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='owner_profiles' AND policyname='Owners can read own profile') THEN " +
    "CREATE POLICY \"Owners can read own profile\" ON owner_profiles FOR SELECT USING (auth.uid() = id); END IF; " +
    "IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='owner_profiles' AND policyname='Owners can insert own profile') THEN " +
    "CREATE POLICY \"Owners can insert own profile\" ON owner_profiles FOR INSERT WITH CHECK (auth.uid() = id); END IF; " +
    "IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='owner_profiles' AND policyname='Owners can update own profile') THEN " +
    "CREATE POLICY \"Owners can update own profile\" ON owner_profiles FOR UPDATE USING (auth.uid() = id); END IF; " +
    "END $$;"
  );

  await runSQL('STEP6 VERIFY',
    "SELECT table_name, column_name FROM information_schema.columns " +
    "WHERE table_schema = 'public' " +
    "AND table_name IN ('gc_profiles','owner_profiles','payment_negotiations') " +
    "AND column_name IN ('id','payment_status','paid_at','contract_value','name','email','phone','company','status') " +
    "ORDER BY table_name, column_name;"
  );

  console.log('=== Migration script complete ===');
}

main().catch(e => console.error('FATAL:', e.message));
