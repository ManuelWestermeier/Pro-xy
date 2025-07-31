const http = require('http');
const https = require('https');
const { URL } = require('url');

const test = false;
const TARGET_URL = test ? 'http://84.139.223.15:7777' : 'https://www.proxysite.com';

const PORT = 3000;

console.log(`Proxy started. Forwarding to: ${TARGET_URL}`);

const server = http.createServer((clientReq, clientRes) => {
  const target = new URL(TARGET_URL);

  // Zielpfad dynamisch übernehmen
  const path = clientReq.url || '/';

  const options = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port || (target.protocol === 'https:' ? 443 : 80),
    method: clientReq.method,
    path: path,
    headers: {
      ...clientReq.headers,
      host: target.hostname,
      referer: TARGET_URL,
      origin: TARGET_URL,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    }
  };

  // Entferne Tracking-Header
  delete options.headers['x-forwarded-for'];
  delete options.headers['via'];

  const proxyModule = target.protocol === 'https:' ? https : http;
  const proxyReq = proxyModule.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes);
  });

  proxyReq.on('error', (err) => {
    clientRes.writeHead(500, { 'Content-Type': 'text/plain' });
    clientRes.end('Proxy error: ' + err.message);
  });

  clientReq.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`Proxy läuft auf http://localhost:${PORT}`);
});
