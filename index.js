const express = require('express');
const session = require('express-session');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'nordens_proxy', resave: false, saveUninitialized: true }));

// HTML input page
app.get('/', (req, res) => {
  const history = req.session.history || [];
  res.send(`
    <h1>Nordens Proxy</h1>
    <form action="/go" method="POST">
      <input type="text" name="url" placeholder="https://username@domain.com" size="50" />
      <button type="submit">Go</button>
    </form>
    <h2>History:</h2>
    <ul>${history.map(u => `<li><a href="/go?url=${encodeURIComponent(u)}">${u}</a></li>`).join('')}</ul>
  `);
});

// Handle form input
app.post('/go', (req, res) => {
  const url = req.body.url;
  if (!req.session.history) req.session.history = [];
  if (!req.session.history.includes(url)) req.session.history.push(url);
  res.redirect(`/go?url=${encodeURIComponent(url)}`);
});

// Proxy handler
app.get('/go', async (req, res) => {
  try {
    const url = req.query.url;
    const parsed = new URL(url);
    const username = parsed.username || 'anonymous';
    const target = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}${parsed.search}`;

    const response = await fetch(target);
    let body = await response.text();

    // Optional: rewrite relative links (basic)
    const $ = cheerio.load(body);
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('http')) {
        $(el).attr('href', `/go?url=${encodeURIComponent(parsed.origin + href)}`);
      }
    });
    body = $.html();

    res.send(`
      <h3>Base Domain: ${username}</h3>
      ${body}
    `);
  } catch (e) {
    res.send(`<p>Error loading URL: ${e.message}</p><a href="/">Back</a>`);
  }
});

app.listen(PORT, () => {
  console.log(`Nordens Proxy running at http://localhost:${PORT}`);
});
