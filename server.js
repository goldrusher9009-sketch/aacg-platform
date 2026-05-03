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
  let url = req.url.split('?')[0];

  // Strip /platform prefix so allamericancg.com/platform proxies here
  if (url.startsWith('/platform')) {
    url = url.slice('/platform'.length) || '/';
  }

  // Route mapping
  if (url === '/' || url === '')           url = '/admin/index.html';
  if (url === '/admin')                    url = '/admin/index.html';
  if (url === '/superadmin')               url = '/superadmin/index.html';

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
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`IronForge Platform running at http://localhost:${PORT}`);
  console.log(`Admin: http://localhost:${PORT}/admin/index.html`);
});
