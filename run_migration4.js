const https = require('https');

const SUPABASE_HOST = 'wausefmzaqtlomyhqcjf.supabase.co';

// Use the ANON key from config.js (this one is confirmed valid)
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdXNlZm16YXF0bG9teWhxY2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MDkxMjIsImV4cCI6MjA5MzA4NTEyMn0.AxLFvd0EciSSmo_x3Qvg-oUnPRWR2S9KhRmSWAGBN0U';

// The service role key should be same format but with role:service_role
// Let's decode the anon key to get the correct iat/exp and reconstruct service role
// The anon key from config.js has iat:1777509122 - this is the new project
// Service role key for same project would have same iat/exp but role=service_role

// Let's just try with the anon key first to confirm it works
function get(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SUPABASE_HOST,
      path: path,
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': 'Bearer ' + ANON_KEY,
      }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, data: data.substring(0, 800) }));
    });
    req.on('error', reject);
    req.end();
  });
}

function post(path, bodyObj, key) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(bodyObj);
    const req = https.request({
      hostname: SUPABASE_HOST,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key || ANON_KEY,
        'Authorization': 'Bearer ' + (key || ANON_KEY),
        'Content-Length': Buffer.byteLength(body),
        'Prefer': 'return=minimal'
      }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, data: data.substring(0, 800) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  // First confirm anon key works
  let r = await get('/rest/v1/payment_negotiations?select=id&limit=1');
  console.log('anon GET payment_negotiations:', r.status, r.data.substring(0, 200));

  // Check if gc_profiles exists
  r = await get('/rest/v1/gc_profiles?select=id&limit=1');
  console.log('anon GET gc_profiles:', r.status, r.data.substring(0, 200));

  // Check if owner_profiles exists
  r = await get('/rest/v1/owner_profiles?select=id&limit=1');
  console.log('anon GET owner_profiles:', r.status, r.data.substring(0, 200));

  // Check payment_negotiations columns
  r = await get('/rest/v1/payment_negotiations?select=payment_status,contract_value,paid_at&limit=1');
  console.log('anon GET pn columns:', r.status, r.data.substring(0, 200));
}

main().catch(e => console.error('FATAL:', e.message));
