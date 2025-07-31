const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const TARGET_URL = 'https://share.google/NWFlo9IPRIqpaw2PA';

app.use('/', createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  secure: false,

  onProxyReq: (proxyReq, req, res) => {
    // Original header entfernen/verfälschen
    proxyReq.setHeader('Referer', 'https://www.google.com/');
    proxyReq.setHeader('Origin', 'https://www.google.com');
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    proxyReq.removeHeader('X-Forwarded-For');
    proxyReq.removeHeader('Via');
  },

  onProxyRes: (proxyRes, req, res) => {
    // Sicherheit: CORS-Header setzen, um Zugriff zu erlauben
    res.setHeader('Access-Control-Allow-Origin', '*');
  },

  pathRewrite: {
    '^/': '/', // optional – falls du z. B. nur bestimmte Pfade weiterleiten willst
  }
}));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Proxy läuft auf http://localhost:${PORT}`);
});
