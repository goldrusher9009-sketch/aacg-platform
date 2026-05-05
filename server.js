const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname);
const PORT = process.env.PORT || 8080;

const MIME = {
  html: 'text/html',
  js: 'application/javascript',
  css: 'text/css',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  json: 'application/json',
  woff: 'font/woff',
  woff2: 'font/woff2',
  mp4: 'video/mp4',
  webm: 'video/webm',
  pdf: 'application/pdf'
};

http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, anthropic-version, anthropic-dangerous-allow-cors'
    });
    res.end();
    return;
  }

  let url = req.url.split('?')[0];

  // Strip /platform prefix so allamericancg.com/platform proxies here
  if (url.startsWith('/platform')) {
    url = url.slice('/platform'.length) || '/';
  }

  // Route mapping
  if (url === '/' || url === '')           url = '/aacg-website.html';
  if (url === '/index.html')               url = '/aacg-website.html';
  if (url === '/admin')                    url = '/admin/index.html';
  if (url === '/admin/')                   url = '/admin/index.html';
  if (url === '/superadmin')               url = '/superadmin/index.html';
  if (url === '/superadmin/')              url = '/superadmin/index.html';

  const filePath = path.join(BASE, url);

  // Security: prevent path traversal
  if (!filePath.startsWith(BASE)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + url);
      return;
    }
    const ext = path.extname(filePath).slice(1).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, anthropic-version, anthropic-dangerous-allow-cors',
      'Cache-Control': ext === 'html' ? 'no-store' : 'public, max-age=3600'
    });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`IronForge Platform running at http://localhost:${PORT}`);
  console.log(`Admin: http://localhost:${PORT}/admin/index.html`);
});
