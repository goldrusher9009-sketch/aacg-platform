// Decode the anon key to understand the project
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdXNlZm16YXF0bG9teWhxY2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MDkxMjIsImV4cCI6MjA5MzA4NTEyMn0.AxLFvd0EciSSmo_x3Qvg-oUnPRWR2S9KhRmSWAGBN0U';

const parts = anonKey.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
console.log('ANON KEY PAYLOAD:', JSON.stringify(payload, null, 2));
console.log('iat:', payload.iat, '=', new Date(payload.iat * 1000).toISOString());
console.log('exp:', payload.exp, '=', new Date(payload.exp * 1000).toISOString());
console.log('ref:', payload.ref);

// The service role key from .env.local:
const svcKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdXNlZm16YXF0bG9teWhxY2pmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMTM0MzIzMDEsImV4cCI6MTg3MzAwMDMyMzB9';
const svcParts = svcKey.split('.');
if (svcParts.length >= 2) {
  const svcPayload = JSON.parse(Buffer.from(svcParts[1], 'base64url').toString());
  console.log('\nSVC KEY PAYLOAD:', JSON.stringify(svcPayload, null, 2));
  console.log('iat:', svcPayload.iat, '=', new Date(svcPayload.iat * 1000).toISOString());
}

// The service role key is MISSING its signature (only 2 parts) - that's why it fails!
console.log('\nSvc key parts count:', svcParts.length, '(needs 3)');
console.log('Anon key parts count:', parts.length, '(has 3 - valid)');
