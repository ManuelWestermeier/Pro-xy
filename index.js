const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.text({ type: "*/*" })); // Handle all body types as raw text

app.all('/proxy', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send("Missing 'url' parameter");

    const parsedUrl = new URL(targetUrl);
    const baseDomain = parsedUrl.username || 'anonymous';

    // Extract headers, excluding host-specific ones
    const proxyHeaders = { ...req.headers };
    delete proxyHeaders.host;
    delete proxyHeaders['content-length']; // Let fetch compute

    const options = {
      method: req.method,
      headers: proxyHeaders,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body
    };

    const proxyRes = await fetch(targetUrl, options);
    const proxyBody = await proxyRes.text();

    // Forward status and headers
    res.status(proxyRes.status);
    for (const [key, value] of proxyRes.headers.entries()) {
      res.setHeader(key, value);
    }

    res.send(proxyBody);
  } catch (err) {
    res.status(500).send(`Proxy error: ${err.message}`);
  }
});

app.listen(3000, () => {
  console.log('Proxy running at http://localhost:3000/proxy?url=https://user@domain.com/path');
});
