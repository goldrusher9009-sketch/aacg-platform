const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    createServer(async (req, res) => {
          try {
                  const parsedUrl = parse(req.url, true);
                  await handle(req, res, parsedUrl);
          } catch (err) {
                  console.error('Error occurred handling', req.url, err);
                  res.statusCode = 500;
                  res.end('Internal server error');
          }
    }).listen(port, (err) => {
          if (err) throw err;
          console.log(`✓ Server running at http://${hostname}:${port}`);
          console.log(`✓ NODE_ENV=${process.env.NODE_ENV}`);
          console.log(`✓ NEXT_PUBLIC_API_URL=${process.env.NEXT_PUBLIC_API_URL}`);
          console.log(`✓ Supabase URL configured: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    });
});
