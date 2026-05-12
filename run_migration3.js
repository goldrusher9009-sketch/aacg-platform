const https = require('https');

const SUPABASE_HOST = 'wausefmzaqtlomyhqcjf.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdXNlZm16YXF0bG9teWhxY2pmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMTM0MzIzMDEsImV4cCI6MTg3MzAwMDMyMzB9';

// Try various Supabase endpoints that accept raw SQL with service role
function post(path, bodyObj) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(bodyObj);
    const req = https.request({
      hostname: SUPABASE_HOST,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Content-Length': Buffer.byteLength(body),
        'Prefer': 'return=representation'
      }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, data: data.substring(0, 600) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Testing Supabase REST endpoints with service role key...');

  // Try 1: /rest/v1/rpc/exec_sql (custom RPC if it exists)
  let r = await post('/rest/v1/rpc/exec_sql', { sql: 'SELECT 1 as test' });
  console.log('exec_sql:', r.status, r.data);

  // Try 2: /rest/v1/rpc/query
  r = await post('/rest/v1/rpc/query', { query: 'SELECT 1 as test' });
  console.log('rpc/query:', r.status, r.data);

  // Try 3: Check what tables exist via REST (this will tell us what's already there)
  r = await post('/rest/v1/rpc/pg_catalog_check', {});
  console.log('pg_catalog_check:', r.status, r.data);

  // Try 4: Read information_schema via REST - will work with service role
  const req4 = https.request({
    hostname: SUPABASE_HOST,
    path: '/rest/v1/information_schema_tables?select=table_name&table_schema=eq.public',
    method: 'GET',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': 'Bearer ' + SERVICE_KEY,
    }
  }, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => console.log('GET tables:', res.statusCode, data.substring(0, 500)));
  });
  req4.on('error', e => console.log('GET err:', e.message));
  req4.end();
}

main().catch(e => console.error('FATAL:', e.message));
