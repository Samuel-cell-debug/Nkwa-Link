const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage });

// MongoDB connection (optional). If not available, the server will keep an in-memory store.
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nkwalink';
let ReportModel = null;
let dbConnected = false;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    dbConnected = true;
    const reportSchema = new mongoose.Schema({
      trackingId: { type: String, required: true, unique: true },
      type: String,
      location: String,
      description: String,
      language: String,
      media: [{ path: String, originalName: String, mimeType: String }],
      source: { type: String, default: 'web' },
      createdAt: { type: Date, default: Date.now },
      meta: mongoose.Schema.Types.Mixed
    });
    ReportModel = mongoose.model('Report', reportSchema);
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.warn('MongoDB connection failed, running with in-memory store:', err.message);
  });

// In-memory fallback store
const inMemoryReports = [];

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: Date.now(), dbConnected });
});

// Friendly root
app.get('/', (req, res) => {
  res.json({
    message: 'Nkwa-Link mock server with reporting module',
    endpoints: ['/api/health', '/api/integrations/:type/connect', '/api/reports', '/api/integrations/sms-report', '/api/integrations/ussd-report']
  });
});

// Integration connect endpoints (unchanged behavior)
app.post('/api/integrations/:type/connect', (req, res) => {
  const { type } = req.params;
  const delay = 200 + Math.floor(Math.random() * 800);
  setTimeout(() => {
    if (Math.random() < 0.8) {
      res.json({ ok: true, integration: type, message: `${type} connected` });
    } else {
      res.status(502).json({ ok: false, integration: type, message: 'Upstream service unavailable' });
    }
  }, delay);
});

// Save incoming report (web form or sync). Accepts multipart/form-data (media) or JSON.
app.post('/api/reports', upload.array('media', 4), async (req, res) => {
  try {
    const payload = req.body || {};
    const files = req.files || [];
    const trackingId = payload.trackingId || `NK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

    const media = files.map(f => ({ path: path.relative(path.join(__dirname, '..'), f.path), originalName: f.originalname, mimeType: f.mimetype }));

    const record = {
      trackingId,
      type: payload.type || payload.incidentType || 'other',
      location: payload.location || payload.gps || '',
      description: payload.description || payload.text || '',
      language: payload.language || 'en',
      media,
      source: payload.source || 'web',
      meta: payload.meta ? JSON.parse(payload.meta) : undefined
    };

    if (dbConnected && ReportModel) {
      const saved = await ReportModel.create(record);
      return res.status(201).json({ ok: true, trackingId: saved.trackingId });
    } else {
      inMemoryReports.push(record);
      return res.status(201).json({ ok: true, trackingId });
    }
  } catch (err) {
    console.error('Error saving report:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Retrieve report by trackingId
app.get('/api/reports/:trackingId', async (req, res) => {
  const { trackingId } = req.params;
  if (dbConnected && ReportModel) {
    const found = await ReportModel.findOne({ trackingId }).lean();
    if (!found) return res.status(404).json({ ok: false });
    return res.json({ ok: true, report: found });
  }
  const found = inMemoryReports.find(r => r.trackingId === trackingId);
  if (!found) return res.status(404).json({ ok: false });
  return res.json({ ok: true, report: found });
});

// SMS integration: accepts POST { from, text, language }
app.post('/api/integrations/sms-report', async (req, res) => {
  try {
    const { from, text, language } = req.body;
    // naive parsing: expect "TYPE | LOCATION | DESCRIPTION" or free text
    let type = 'other';
    let location = '';
    let description = text || '';
    const parts = (text || '').split('|').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      type = parts[0].toLowerCase();
      location = parts[1];
      description = parts.slice(2).join(' | ');
    } else {
      // try to extract known keywords
      const t = (text || '').toLowerCase();
      if (t.includes('fire')) type = 'fire';
      else if (t.includes('flood')) type = 'flood';
      else if (t.includes('medical')) type = 'medical';
    }

    const trackingId = `NK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
    const record = { trackingId, type, location, description, language: language || 'en', source: 'sms', meta: { from } };

    if (dbConnected && ReportModel) {
      await ReportModel.create(record);
    } else {
      inMemoryReports.push(record);
    }

    // Respond with tracking id so SMS gateway can forward to user
    return res.json({ ok: true, trackingId });
  } catch (err) {
    console.error('SMS report error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// USSD integration: accepts POST { sessionId, phone, text, language }
app.post('/api/integrations/ussd-report', async (req, res) => {
  try {
    const { sessionId, phone, text, language } = req.body;
    // Expect structured: TYPE|LOCATION|DESCRIPTION
    const parts = (text || '').split('|').map(p => p.trim()).filter(Boolean);
    let type = 'other';
    let location = '';
    let description = text || '';
    if (parts.length >= 3) {
      type = parts[0].toLowerCase();
      location = parts[1];
      description = parts.slice(2).join(' | ');
    }
    const trackingId = `NK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
    const record = { trackingId, type, location, description, language: language || 'en', source: 'ussd', meta: { sessionId, phone } };

    if (dbConnected && ReportModel) {
      await ReportModel.create(record);
    } else {
      inMemoryReports.push(record);
    }

    // USSD gateways expect specific reply payloads; we'll return a simple JSON acknowledging creation
    return res.json({ ok: true, trackingId });
  } catch (err) {
    console.error('USSD report error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
});
