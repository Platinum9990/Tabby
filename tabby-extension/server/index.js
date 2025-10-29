const express = require('express');
const bodyParser = require('body-parser');
const ai = require('./ai');
const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

// /find: Use Prompt API to interpret query and match tabs
app.post('/find', async (req, res) => {
  const { query, tabs } = req.body || {};
  if (!query || !Array.isArray(tabs)) return res.json({ error: 'bad request' });
  // Use prompt API to get intent (stub)
  const intent = await ai.prompt(query);
  // Naive semantic match (replace with AI search)
  const q = query.toLowerCase();
  let bestIdx = null;
  let bestScore = 0;
  const candidates = [];
  tabs.forEach((t, i) => {
    const hay = (t.title + ' ' + t.url + ' ' + (t.text||'')).toLowerCase();
    let score = 0;
    if (hay.includes(q)) score += 10;
    const words = q.split(/\s+/).filter(Boolean);
    words.forEach(w => { if (hay.includes(w)) score += 1; });
    if (score > bestScore) { bestScore = score; bestIdx = i; }
    if (score > 0) candidates.push({ index: i, title: t.title, score });
  });
  if (bestScore === 0) return res.json({ candidates, intent });
  return res.json({ tabIndex: bestIdx, candidates, intent });
});

// /summarize: Use Summarizer API
app.post('/summarize', async (req, res) => {
  const { title, url, text } = req.body || {};
  const result = await ai.summarizer(text || '');
  res.json({ summary: result.summary });
});

// /rewrite: Use Rewriter API
app.post('/rewrite', async (req, res) => {
  const { text } = req.body || {};
  const result = await ai.rewriter(text || '');
  res.json({ rewrite: result.rewrite });
});

// /translate: Use Translator API
app.post('/translate', async (req, res) => {
  const { text, from, to } = req.body || {};
  const result = await ai.translator(text || '', from || 'auto', to || 'en');
  res.json({ translated: result.translated });
});

// /proofread: Use Proofreader API
app.post('/proofread', async (req, res) => {
  const { text } = req.body || {};
  const result = await ai.proofreader(text || '');
  res.json({ corrected: result.corrected });
});

app.listen(3000, () => console.log('Tabby mock server listening on http://localhost:3000'));
