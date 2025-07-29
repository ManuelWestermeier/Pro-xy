const http = require('http');
const { request: httpRequest } = require('http');
const { request: httpsRequest } = require('https');

const proxy = http.createServer((clientReq, clientRes) => {
  try {
    const hostHeader = clientReq.headers.host || '';
    const atIndex = hostHeader.indexOf('@');

    if (atIndex === -1) {
      clientRes.writeHead(400);
      clientRes.end('Invalid Host header. Must be in the form: destdomain@proxyserver.com');
      return;
    }

    const destDomain = hostHeader.substring(0, atIndex);
    const isTLS = clientReq.headers['x-forwarded-proto'] === 'https';
    const targetProtocol = isTLS ? httpsRequest : httpRequest;

    const forwardOptions = {
      hostname: destDomain,
      port: 80,
      method: clientReq.method,
      path: clientReq.url,
      headers: {
        ...clientReq.headers,
        host: destDomain // Fix host header
      }
    };

    // Send request to destination
    const proxyReq = targetProtocol(forwardOptions, (proxyRes) => {
      clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(clientRes);
    });

    proxyReq.on('error', (err) => {
      clientRes.writeHead(502);
      clientRes.end(`Proxy Error: ${err.message}`);
    });

    clientReq.pipe(proxyReq);
  } catch (err) {
    clientRes.writeHead(500);
    clientRes.end(`Internal Error: ${err.message}`);
  }
});

proxy.listen(3000, () => {
  console.log('Proxy server running on port 3000');
});
