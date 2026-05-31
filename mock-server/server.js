const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

// Friendly root to avoid "Cannot GET /" confusion
app.get('/', (req, res) => {
  res.json({
    message: 'Nkwa-Link mock server',
    endpoints: ['/api/health', '/api/integrations/:type/connect', '/api/reports']
  });
});

// Integration connect endpoints
app.post('/api/integrations/:type/connect', (req, res) => {
  const { type } = req.params;
  // Simulate variable latency and occasional failures
  const delay = 200 + Math.floor(Math.random() * 800);
  setTimeout(() => {
    // 80% success rate
    if (Math.random() < 0.8) {
      res.json({ ok: true, integration: type, message: `${type} connected` });
    } else {
      res.status(502).json({ ok: false, integration: type, message: 'Upstream service unavailable' });
    }
  }, delay);
});

// Accept reports (used by offline sync)
app.post('/api/reports', (req, res) => {
  const report = req.body;
  console.log('Received report:', report.id || '<no-id>');
  // Simulate processing delay
  setTimeout(() => {
    res.status(201).json({ ok: true, id: report.id || null });
  }, 300);
});

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
});
