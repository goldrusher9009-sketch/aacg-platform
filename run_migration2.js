const https = require('https');

// Use anon key + service role key via Supabase REST API
// The correct approach: POST to /rest/v1/rpc/ with sql exec, or use pg directly
// Actually, let's use the Supabase SQL execution via REST with service role key

const SUPABASE_URL = 'wausefmzaqtlomyhqcjf.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdXNlZm16YXF0bG9teWhxY2pmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMTM0MzIzMDEsImV4cCI6MTg3MzAwMDMyMzB9';

function runSQL(label, sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: SUPABASE_URL,
      path: '/rest/v1/rpc/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
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

// Alternative: use pg module to connect directly
function tryPg() {
  try {
    const { Client } = require('pg');
    // Try direct postgres connection
    const client = new Client({
      host: 'db.wausefmzaqtlomyhqcjf.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: SERVICE_KEY,
      ssl: { rejectUnauthorized: false }
    });
    return client;
  } catch(e) {
    return null;
  }
}

async function runViaPg() {
  const client = tryPg();
  if (!client) { console.log('pg not available'); return false; }
  
  try {
    await client.connect();
    console.log('Connected via pg!');

    const steps = [
      ["STEP1 ALTER payment_negotiations",
        "ALTER TABLE payment_negotiations ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending', ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS contract_value NUMERIC"],
      ["STEP2 CREATE gc_profiles",
        "CREATE TABLE IF NOT EXISTS gc_profiles (id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, email TEXT, name TEXT, company TEXT, phone TEXT, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW())"],
      ["STEP3 CREATE owner_profiles",
        "CREATE TABLE IF NOT EXISTS owner_profiles (id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, email TEXT, name TEXT, company TEXT, phone TEXT, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW())"],
      ["STEP4 RLS gc_profiles enable",
        "ALTER TABLE gc_profiles ENABLE ROW LEVEL SECURITY"],
      ["STEP5 policy gc read",
        "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gc_profiles' AND policyname='GCs can read own profile') THEN CREATE POLICY \"GCs can read own profile\" ON gc_profiles FOR SELECT USING (auth.uid() = id); END IF; END $$"],
      ["STEP6 policy gc insert",
        "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gc_profiles' AND policyname='GCs can insert own profile') THEN CREATE POLICY \"GCs can insert own profile\" ON gc_profiles FOR INSERT WITH CHECK (auth.uid() = id); END IF; END $$"],
      ["STEP7 policy gc update",
        "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gc_profiles' AND policyname='GCs can update own profile') THEN CREATE POLICY \"GCs can update own profile\" ON gc_profiles FOR UPDATE USING (auth.uid() = id); END IF; END $$"],
      ["STEP8 RLS owner_profiles enable",
        "ALTER TABLE owner_profiles ENABLE ROW LEVEL SECURITY"],
      ["STEP9 policy owner read",
        "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='owner_profiles' AND policyname='Owners can read own profile') THEN CREATE POLICY \"Owners can read own profile\" ON owner_profiles FOR SELECT USING (auth.uid() = id); END IF; END $$"],
      ["STEP10 policy owner insert",
        "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='owner_profiles' AND policyname='Owners can insert own profile') THEN CREATE POLICY \"Owners can insert own profile\" ON owner_profiles FOR INSERT WITH CHECK (auth.uid() = id); END IF; END $$"],
      ["STEP11 policy owner update",
        "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='owner_profiles' AND policyname='Owners can update own profile') THEN CREATE POLICY \"Owners can update own profile\" ON owner_profiles FOR UPDATE USING (auth.uid() = id); END IF; END $$"],
      ["STEP12 VERIFY",
        "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('gc_profiles','owner_profiles','payment_negotiations') AND column_name IN ('id','payment_status','paid_at','contract_value','name','email') ORDER BY table_name, column_name"]
    ];

    for (const [label, sql] of steps) {
      try {
        const res = await client.query(sql);
        console.log('OK ' + label + (res.rows ? ' rows:' + JSON.stringify(res.rows) : ''));
      } catch(e) {
        console.log('FAIL ' + label + ': ' + e.message);
      }
    }

    await client.end();
    return true;
  } catch(e) {
    console.log('pg connect failed: ' + e.message);
    return false;
  }
}

runViaPg().then(ok => {
  if (!ok) console.log('pg failed - need Personal Access Token for Management API');
});
