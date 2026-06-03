const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
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

// ===== RESPONDER MANAGEMENT =====
// In-memory stores for responders, sessions, assignments, backup requests, messages, notifications
const responderCredentials = {
  'resp001': { id: 'resp001', name: 'Officer Ahmed Hassan', password: 'emergency123', role: 'responder', unit: 'Fire Team Alpha' },
  'resp002': { id: 'resp002', name: 'Nurse Ama Boateng', password: 'response456', role: 'responder', unit: 'Ambulance Unit 2' },
  'resp003': { id: 'resp003', name: 'Officer Kwame Asante', password: 'field789', role: 'responder', unit: 'Police Patrol 7' }
};

const userSessions = {};
const responderSessions = userSessions;
const coordinatorCredentials = {
  'coord001': { id: 'coord001', name: 'Chief Coordinator Amina', password: 'control456', role: 'coordinator', region: 'national' },
  'coord002': { id: 'coord002', name: 'Deputy Coordinator Kofi', password: 'command789', role: 'coordinator', region: 'greater_accra' },
  'coord003': { id: 'coord003', name: 'Central Command', password: 'central123', role: 'coordinator', region: 'ashanti' }
};
const incidentAssignments = []; // { id, type, location, description, responderId, assignedUnit, status, severity, region, createdAt, media, lat, lng }
const backupRequests = []; // { id, responderId, incidentId, resourceType, quantity, urgency, details, status }
const responderMessages = []; // { id, fromRole, toRole, responderId, incidentId, text, type, createdAt }
const notificationQueue = {}; // responder/coordinator -> [{ message, read }]
const resourceInventory = [
  { id: 'ambulance-1', type: 'ambulance', status: 'available', location: 'Accra', assignedTo: null, capacity: 4 },
  { id: 'fire-1', type: 'fire_truck', status: 'on_duty', location: 'Kumasi', assignedTo: null, capacity: 8 },
  { id: 'police-1', type: 'police_unit', status: 'available', location: 'Tema', assignedTo: null, capacity: 6 },
  { id: 'med-1', type: 'medical_supplies', status: 'stocked', location: 'Accra', quantity: 120 },
  { id: 'team-1', type: 'personnel', status: 'ready', location: 'Volta', quantity: 30 }
];
const alertHistory = [];
const broadcastHistory = [];
const fireServiceLogs = [];
const policeServiceLogs = [];
const FIRE_SERVICE_API_KEY = process.env.FIRE_SERVICE_API_KEY || 'fire-service-secret';
const FIRE_SERVICE_URL = process.env.FIRE_SERVICE_URL || 'https://gnfs.example.gov.gh/api/incidents';
const POLICE_SERVICE_API_KEY = process.env.POLICE_SERVICE_API_KEY || 'police-service-secret';
const POLICE_SERVICE_OAUTH_TOKEN = process.env.POLICE_SERVICE_OAUTH_TOKEN || 'police-oauth-token';
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || `http://localhost:${PORT}`;
const AMBULANCE_SERVICE_API_KEY = process.env.AMBULANCE_SERVICE_API_KEY || 'ambulance-service-secret';
const AMBULANCE_SERVICE_URL = process.env.AMBULANCE_SERVICE_URL || 'https://gna.example.gov.gh/api/dispatch';
const ambulanceServiceLogs = [];

function inferRegion(location) {
  const text = (location || '').toLowerCase();
  if (text.includes('accra') || text.includes('tema')) return 'greater_accra';
  if (text.includes('kumasi') || text.includes('ashanti')) return 'ashanti';
  if (text.includes('volta')) return 'volta';
  return 'greater_accra';
}

function buildEvidenceLinks(media = []) {
  return media.map(item => {
    if (!item.path) return null;
    if (item.path.startsWith('http')) return item.path;
    return `${SERVER_BASE_URL}/${item.path.replace(/^[/.]+/, '')}`;
  }).filter(Boolean);
}

function maskPII(value = '') {
  if (!value) return '';
  // Mask phone numbers: keep last 3 digits
  const phone = String(value).replace(/[^0-9]/g, '');
  if (phone.length >= 7) {
    return phone.replace(new RegExp(`^(.*)(.{3})$`), (m, a, b) => `${a.replace(/./g, '*')}${b}`);
  }
  // Fallback: partially mask
  return value.replace(/.(?=.{2})/g, '*');
}

function httpsPostJson(url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const json = JSON.stringify(payload);
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return reject(new Error('Fire Service URL must use HTTPS'));
    }

    const options = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(json),
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        const responsePayload = body ? JSON.parse(body) : null;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, body: responsePayload });
        } else {
          const error = new Error(`Fire Service returned ${res.statusCode}`);
          error.statusCode = res.statusCode;
          error.body = responsePayload;
          reject(error);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(json);
    req.end();
  });
}

async function forwardToFireService(incident, retries = 3) {
  const payload = {
    incidentId: incident.id,
    type: incident.type,
    location: incident.location,
    description: incident.description || 'No citizen description provided',
    attachedMedia: buildEvidenceLinks(incident.media),
    evidenceLinks: buildEvidenceLinks(incident.media),
    reportedAt: new Date(incident.createdAt).toISOString(),
    source: incident.source || 'web'
  };

  const logEntry = {
    id: `fire-log-${uuidv4()}`,
    incidentId: incident.id,
    status: 'pending',
    payload,
    attempts: [],
    createdAt: Date.now()
  };
  fireServiceLogs.push(logEntry);
  console.log('[FireService] Forwarding fire incident', { incidentId: incident.id, location: incident.location });

  let attempt = 0;
  while (attempt < retries) {
    attempt += 1;
    const attemptRecord = { attempt, attemptedAt: Date.now() };
    try {
      const response = await httpsPostJson(FIRE_SERVICE_URL, payload, {
        'x-service-api-key': FIRE_SERVICE_API_KEY
      });
      attemptRecord.status = 'success';
      attemptRecord.response = response.body;
      logEntry.status = 'success';
      logEntry.deliveredAt = Date.now();
      logEntry.attempts.push(attemptRecord);
      return { payload, logEntry };
    } catch (error) {
      attemptRecord.status = 'failed';
      attemptRecord.error = error.message;
      logEntry.attempts.push(attemptRecord);
      console.warn('[FireService] Attempt failed', { incidentId: incident.id, attempt, error: error.message });
      if (attempt >= retries) {
        logEntry.status = 'failed';
        logEntry.failedAt = Date.now();
        logEntry.error = error.message;
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 300 * Math.pow(2, attempt - 1)));
    }
  }
}

function createIncidentFromReport(report) {
  const region = report.meta?.region || inferRegion(report.location);
  const severity = report.severity || (['fire', 'medical'].includes(report.type) ? 'high' : 'medium');
  const coords = {
    greater_accra: { lat: 5.60, lng: -0.18 },
    ashanti: { lat: 6.69, lng: -1.62 },
    tema: { lat: 5.67, lng: 0.02 },
    volta: { lat: 6.60, lng: 0.48 }
  }[region] || { lat: 5.60, lng: -0.18 };

  return {
    id: `inc-${uuidv4()}`,
    type: report.type,
    location: report.location || 'Unknown location',
    description: report.description || 'No details provided',
    status: 'new',
    severity,
    region,
    lat: coords.lat,
    lng: coords.lng,
    createdAt: Date.now(),
    assignedUnit: null,
    responderId: null,
    media: report.media || []
    ,
    meta: report.meta || {}
  };
}

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || !userSessions[token]) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  req.user = userSessions[token];
  req.responder = req.user;
  next();
}

function fireServiceAuth(req, res, next) {
  const apiKey = req.headers['x-service-api-key'] || req.headers.authorization?.split(' ')[1];
  if (!apiKey || apiKey !== FIRE_SERVICE_API_KEY) {
    console.warn('[FireService] Unauthorized request attempt');
    return res.status(401).json({ ok: false, error: 'Invalid fire-service authentication' });
  }
  next();
}

function policeServiceAuth(req, res, next) {
  const apiKey = req.headers['x-service-api-key'];
  const bearerToken = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null;
  if (apiKey === POLICE_SERVICE_API_KEY || bearerToken === POLICE_SERVICE_OAUTH_TOKEN) {
    return next();
  }
  console.warn('[PoliceService] Unauthorized request attempt');
  return res.status(401).json({ ok: false, error: 'Invalid police-service authentication' });
}

function coordinatorAuth(req, res, next) {
  authMiddleware(req, res, () => {
    if (!req.user || req.user.role !== 'coordinator') {
      return res.status(403).json({ ok: false, error: 'Coordinator access required' });
    }
    next();
  });
}

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: Date.now(), dbConnected });
});

// Friendly root
app.get('/', (req, res) => {
  res.json({
    message: 'Nkwa-Link mock server with reporting and responder modules',
    endpoints: [
      '/api/health',
      '/api/integrations/:type/connect',
      '/api/reports',
      '/api/integrations/sms-report',
      '/api/integrations/ussd-report',
      '/api/responders/login',
      '/api/responders/:responderId/incidents',
      '/api/responders/:responderId/backup-request',
      '/api/responders/:responderId/message',
      '/api/responders/:responderId/notifications',
      '/api/coordinators/login',
      '/api/coordinators/incidents',
      '/api/coordinators/resources',
      '/api/coordinators/resource-requests',
      '/api/coordinators/resource-requests/:requestId',
      '/api/coordinators/notifications',
      '/api/coordinators/incidents/:incidentId/assign',
      '/api/coordinators/broadcast',
      '/api/coordinators/analytics',
      '/api/coordinators/reports/export',
      '/api/integrations/fire-service/forward',
      '/api/integrations/police-service/forward'
    ]
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
      severity: payload.severity || 'medium',
      media,
      source: payload.source || 'web',
      meta: payload.meta ? JSON.parse(payload.meta) : undefined
    };

    const incident = createIncidentFromReport(record);
    incidentAssignments.push(incident);

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
    const record = { trackingId, type, location, description, language: language || 'en', severity: 'medium', source: 'sms', meta: { from } };
    const incident = createIncidentFromReport(record);
    incidentAssignments.push(incident);

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
    const record = { trackingId, type, location, description, language: language || 'en', severity: 'medium', source: 'ussd', meta: { sessionId, phone } };
    const incident = createIncidentFromReport(record);
    incidentAssignments.push(incident);

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

// ===== RESPONDER ENDPOINTS =====

// Responder login
app.post('/api/responders/login', (req, res) => {
  const { username, password } = req.body;
  const creds = responderCredentials[username];
  
  if (!creds || creds.password !== password) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }

  const token = `token-${uuidv4()}`;
  responderSessions[token] = { responderId: creds.id, createdAt: Date.now() };
  notificationQueue[creds.id] = notificationQueue[creds.id] || [];
  
  res.json({
    ok: true,
    token,
    responder: { id: creds.id, name: creds.name, unit: creds.unit }
  });
});

// Get assigned incidents for a responder
app.get('/api/responders/:responderId/incidents', authMiddleware, (req, res) => {
  const { responderId } = req.params;
  
  // Simulate returning incidents assigned to this responder
  const assigned = incidentAssignments.filter(inc => inc.responderId === responderId);
  
  // If empty, generate sample incidents for demo
  if (assigned.length === 0) {
    const samples = [
      { id: `inc-${uuidv4()}`, type: 'fire', location: 'Accra Central Market', description: 'Fire outbreak at vendor stalls', responderId, status: 'new', createdAt: Date.now(), media: [] },
      { id: `inc-${uuidv4()}`, type: 'medical', location: 'Tema Station', description: 'Person collapsed at station', responderId, status: 'new', createdAt: Date.now() - 300000, media: [] }
    ];
    samples.forEach(s => incidentAssignments.push(s));
    return res.json({ ok: true, incidents: samples });
  }
  
  res.json({ ok: true, incidents: assigned });
});

// Update incident status
app.patch('/api/responders/:responderId/incidents/:incidentId', authMiddleware, (req, res) => {
  const { responderId, incidentId } = req.params;
  const { status } = req.body;
  
  const incident = incidentAssignments.find(inc => inc.id === incidentId && inc.responderId === responderId);
  if (!incident) {
    return res.status(404).json({ ok: false, error: 'Incident not found' });
  }
  
  incident.status = status;
  res.json({ ok: true, incident });
});

// Request backup resources
app.post('/api/responders/:responderId/backup-request', authMiddleware, (req, res) => {
  const { responderId } = req.params;
  const { incidentId, resourceType, quantity, urgency, details } = req.body;
  
  const requestId = `backup-${uuidv4()}`;
  const request = {
    id: requestId,
    responderId,
    incidentId,
    resourceType,
    quantity,
    urgency,
    details,
    status: 'pending',
    createdAt: Date.now()
  };
  
  backupRequests.push(request);
  
  // Add notification for coordinator
  if (notificationQueue['coord001']) {
    notificationQueue['coord001'].push({
      message: `Backup request from ${responderId}: ${quantity} ${resourceType}`,
      read: false
    });
  }
  
  res.status(201).json({ ok: true, requestId });
});

// Send message from responder to coordinator
app.post('/api/responders/:responderId/message', authMiddleware, (req, res) => {
  const { responderId } = req.params;
  const { toRole, text, incidentId, type } = req.body;
  
  const messageId = `msg-${uuidv4()}`;
  const message = {
    id: messageId,
    fromRole: 'responder',
    toRole,
    responderId,
    incidentId,
    text,
    type,
    createdAt: Date.now()
  };
  
  responderMessages.push(message);
  
  // Add notification for coordinator
  if (toRole === 'coordinator' && notificationQueue['coord001']) {
    notificationQueue['coord001'].push({
      message: `Message from responder ${responderId}: ${text.substring(0, 50)}...`,
      read: false
    });
  }
  
  res.status(201).json({ ok: true, messageId });
});

// Get messages for a specific incident
app.get('/api/responders/:responderId/messages/:incidentId', authMiddleware, (req, res) => {
  const { responderId, incidentId } = req.params;
  
  const msgs = responderMessages.filter(m => m.responderId === responderId && m.incidentId === incidentId);
  res.json({ ok: true, messages: msgs });
});

// Get notifications for responder (polling endpoint)
app.get('/api/responders/:responderId/notifications', authMiddleware, (req, res) => {
  const { responderId } = req.params;
  const notifs = notificationQueue[responderId] || [];
  
  res.json({ ok: true, notifications: notifs });
  
  // Clear notifications after sending
  notificationQueue[responderId] = [];
});

// ===== COORDINATOR ENDPOINTS =====

app.post('/api/coordinators/login', (req, res) => {
  const { username, password } = req.body;
  const creds = coordinatorCredentials[username];
  if (!creds || creds.password !== password) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }
  const token = `token-${uuidv4()}`;
  userSessions[token] = { userId: creds.id, role: 'coordinator', name: creds.name, region: creds.region };
  notificationQueue[creds.id] = notificationQueue[creds.id] || [];
  res.json({ ok: true, token, coordinator: { id: creds.id, name: creds.name, region: creds.region } });
});

app.get('/api/coordinators/incidents', coordinatorAuth, (req, res) => {
  let incidents = incidentAssignments.slice();
  if (incidents.length === 0) {
    incidents = [
      { id: `inc-${uuidv4()}`, type: 'fire', location: 'Accra Central Market', description: 'Large blaze at market stalls', status: 'new', severity: 'high', region: 'greater_accra', lat: 5.5500, lng: -0.2000, createdAt: Date.now(), assignedUnit: null, responderId: null, media: [] },
      { id: `inc-${uuidv4()}`, type: 'flood', location: 'Kumasi Riverfront', description: 'River overflow after heavy rains', status: 'en-route', severity: 'medium', region: 'ashanti', lat: 6.6885, lng: -1.6244, createdAt: Date.now() - 1800000, assignedUnit: 'team-1', responderId: 'resp002', media: [] },
      { id: `inc-${uuidv4()}`, type: 'medical', location: 'Tema General Hospital', description: 'Mass casualty incident reported', status: 'new', severity: 'high', region: 'tema', lat: 5.6698, lng: 0.0167, createdAt: Date.now() - 3600000, assignedUnit: null, responderId: null, media: [] }
    ];
    incidentAssignments.push(...incidents);
  }

  const { type, region, severity } = req.query;
  if (type) incidents = incidents.filter(i => i.type === type);
  if (region) incidents = incidents.filter(i => i.region === region);
  if (severity) incidents = incidents.filter(i => i.severity === severity);

  res.json({ ok: true, incidents });
});

app.get('/api/coordinators/resources', coordinatorAuth, (req, res) => {
  res.json({ ok: true, resources: resourceInventory });
});

app.get('/api/coordinators/resource-requests', coordinatorAuth, (req, res) => {
  res.json({ ok: true, requests: backupRequests });
});

app.get('/api/coordinators/notifications', coordinatorAuth, (req, res) => {
  const coordinatorId = req.user.userId;
  const notifs = notificationQueue[coordinatorId] || [];
  res.json({ ok: true, notifications: notifs });
  notificationQueue[coordinatorId] = [];
});

app.patch('/api/coordinators/resource-requests/:requestId', coordinatorAuth, (req, res) => {
  const { requestId } = req.params;
  const { action, notes } = req.body;
  const request = backupRequests.find(r => r.id === requestId);
  if (!request) {
    return res.status(404).json({ ok: false, error: 'Request not found' });
  }
  if (!['approve', 'deny'].includes(action)) {
    return res.status(400).json({ ok: false, error: 'Action must be approve or deny' });
  }
  request.status = action === 'approve' ? 'approved' : 'denied';
  request.reviewNotes = notes || '';
  request.reviewedAt = Date.now();

  const targetResponder = request.responderId;
  if (notificationQueue[targetResponder]) {
    notificationQueue[targetResponder].push({ message: `Your backup request ${requestId} was ${request.status}.`, read: false });
  }

  res.json({ ok: true, request });
});

app.patch('/api/coordinators/incidents/:incidentId/assign', coordinatorAuth, (req, res) => {
  const { incidentId } = req.params;
  const { responderId, unitId } = req.body;
  const incident = incidentAssignments.find(i => i.id === incidentId);
  if (!incident) {
    return res.status(404).json({ ok: false, error: 'Incident not found' });
  }
  incident.responderId = responderId || incident.responderId;
  incident.assignedUnit = unitId || incident.assignedUnit;
  incident.status = incident.status === 'new' ? 'en-route' : incident.status;

  if (responderId && notificationQueue[responderId]) {
    notificationQueue[responderId].push({ message: `New incident assigned: ${incident.location}`, read: false });
  }

  res.json({ ok: true, incident });
});

app.post('/api/coordinators/incidents/:incidentId/forward-fire', coordinatorAuth, async (req, res) => {
  const { incidentId } = req.params;
  const incident = incidentAssignments.find(i => i.id === incidentId);
  if (!incident) {
    console.warn('[FireService] Incident lookup failed:', incidentId);
    return res.status(404).json({ ok: false, error: 'Incident not found' });
  }
  if (incident.type !== 'fire') {
    return res.status(400).json({ ok: false, error: 'Only fire-related incidents may be forwarded' });
  }
  try {
    const result = await forwardToFireService(incident);
    return res.json({ ok: true, forwarded: true, forwardedPayload: result.payload });
  } catch (error) {
    console.error('[FireService] Forward failed', { incidentId: incident.id, error: error.message });
    return res.status(502).json({ ok: false, error: 'Failed to forward incident to Fire Service', details: error.message });
  }
});

app.post('/api/coordinators/incidents/:incidentId/forward-ambulance', coordinatorAuth, async (req, res) => {
  const { incidentId } = req.params;
  const { consent } = req.body;
  const incident = incidentAssignments.find(i => i.id === incidentId);
  if (!incident) {
    console.warn('[AmbulanceService] Incident lookup failed:', incidentId);
    return res.status(404).json({ ok: false, error: 'Incident not found' });
  }
  if (incident.type !== 'medical') {
    return res.status(400).json({ ok: false, error: 'Only medical incidents may be forwarded to ambulance service' });
  }

  // Apply explicit consent if provided
  if (typeof consent === 'boolean') incident.meta = incident.meta || {}, incident.meta.consent = consent;

  try {
    const eta = getEstimatedResponseTime(incident);
    const result = await forwardToAmbulanceService(incident);
    return res.json({ ok: true, forwarded: true, forwardedPayload: result.payload, etaMinutes: eta });
  } catch (error) {
    console.error('[AmbulanceService] Forward failed', { incidentId: incident.id, error: error.message });
    return res.status(502).json({ ok: false, error: 'Failed to forward incident to Ambulance Service', details: error.message });
  }
});

app.post('/api/integrations/fire-service/forward', fireServiceAuth, async (req, res) => {
  const { incidentId } = req.body;
  if (!incidentId) {
    return res.status(400).json({ ok: false, error: 'incidentId is required' });
  }

  const incident = incidentAssignments.find(i => i.id === incidentId);
  if (!incident) {
    console.warn('[FireService] Incident lookup failed:', incidentId);
    return res.status(404).json({ ok: false, error: 'Incident not found' });
  }

  if (incident.type !== 'fire') {
    return res.status(400).json({ ok: false, error: 'Only fire-related incidents may be forwarded' });
  }
  try {
    const result = await forwardToFireService(incident);
    return res.status(200).json({ ok: true, forwarded: true, payload: result.payload });
  } catch (error) {
    console.error('[FireService] Forward failed', { incidentId: incident.id, error: error.message });
    return res.status(502).json({ ok: false, error: 'Failed to forward incident to Fire Service', details: error.message });
  }
});

app.post('/api/integrations/police-service/forward', policeServiceAuth, async (req, res) => {
  const { incidentId } = req.body;
  if (!incidentId) {
    return res.status(400).json({ ok: false, error: 'incidentId is required' });
  }

  const incident = incidentAssignments.find(i => i.id === incidentId);
  if (!incident) {
    console.warn('[PoliceService] Incident lookup failed:', incidentId);
    return res.status(404).json({ ok: false, error: 'Incident not found' });
  }

  if (!['crime', 'security', 'police'].includes(incident.type)) {
    return res.status(400).json({ ok: false, error: 'Only security-related incidents may be forwarded' });
  }

  const payload = {
    incidentId: incident.id,
    type: incident.type,
    location: incident.location,
    description: incident.description || 'No citizen description provided',
    evidenceLinks: buildEvidenceLinks(incident.media),
    reportedAt: new Date(incident.createdAt).toISOString(),
    source: incident.source || 'web'
  };

  const logEntry = {
    id: `police-log-${uuidv4()}`,
    incidentId: incident.id,
    status: 'pending',
    payload,
    createdAt: Date.now()
  };
  policeServiceLogs.push(logEntry);
  console.log('[PoliceService] Forwarding security incident', { incidentId: incident.id, location: incident.location });

  try {
    await new Promise((resolve, reject) => {
      const latency = 250 + Math.floor(Math.random() * 250);
      setTimeout(() => {
        if (Math.random() < 0.9) return resolve();
        return reject(new Error('Simulated GPS API outage or police service unavailable'));
      }, latency);
    });

    logEntry.status = 'success';
    logEntry.deliveredAt = Date.now();
    console.log('[PoliceService] Forward successful', { incidentId: incident.id });
    return res.status(200).json({ ok: true, forwarded: true, payload });
  } catch (error) {
    logEntry.status = 'failed';
    logEntry.error = error.message;
    logEntry.failedAt = Date.now();
    console.error('[PoliceService] Forward failed', { incidentId: incident.id, error: error.message });
    return res.status(502).json({ ok: false, error: 'Failed to forward incident to Police Service', details: error.message });
  }
});

// Ambulance service auth (API key) and forwarding
function ambulanceServiceAuth(req, res, next) {
  const apiKey = req.headers['x-service-api-key'] || req.headers.authorization?.split(' ')[1];
  if (!apiKey || apiKey !== AMBULANCE_SERVICE_API_KEY) {
    console.warn('[AmbulanceService] Unauthorized request attempt');
    return res.status(401).json({ ok: false, error: 'Invalid ambulance-service authentication' });
  }
  next();
}

function getEstimatedResponseTime(incident) {
  // Simple heuristics: high -> 8m, medium -> 15m, low -> 25m
  if (!incident) return 20;
  const sev = (incident.severity || '').toLowerCase();
  if (sev === 'high') return 8;
  if (sev === 'medium') return 15;
  return 25;
}

async function forwardToAmbulanceService(incident, retries = 2) {
  // Respect consent if present
  if (incident.meta && incident.meta.consent === false) {
    throw new Error('No consent to share personal data');
  }

  const payload = {
    incidentId: incident.id,
    type: incident.type,
    location: incident.location,
    description: incident.description || 'No description',
    patient: incident.meta?.patient ? {
      name: incident.meta.patient.name ? maskPII(incident.meta.patient.name) : undefined,
      age: incident.meta.patient.age || undefined,
      phone: incident.meta.patient.phone ? maskPII(incident.meta.patient.phone) : undefined,
      conditions: incident.meta.patient.conditions || undefined
    } : undefined,
    evidenceLinks: buildEvidenceLinks(incident.media),
    reportedAt: new Date(incident.createdAt).toISOString(),
    source: incident.source || 'web'
  };

  const logEntry = {
    id: `ambulance-log-${uuidv4()}`,
    incidentId: incident.id,
    status: 'pending',
    payload: { ...payload, patient: payload.patient },
    attempts: [],
    createdAt: Date.now()
  };
  ambulanceServiceLogs.push(logEntry);

  let attempt = 0;
  while (attempt < retries) {
    attempt += 1;
    const attemptRecord = { attempt, attemptedAt: Date.now() };
    try {
      // Use HTTPS post helper; ensure URL is https
      const response = await httpsPostJson(AMBULANCE_SERVICE_URL, payload, { 'x-service-api-key': AMBULANCE_SERVICE_API_KEY });
      attemptRecord.status = 'success';
      attemptRecord.response = response.body;
      logEntry.status = 'success';
      logEntry.deliveredAt = Date.now();
      logEntry.attempts.push(attemptRecord);

      // Notify available ambulance units (real-time notifications)
      resourceInventory.filter(r => r.type === 'ambulance').forEach(unit => {
        const nid = unit.id;
        notificationQueue[nid] = notificationQueue[nid] || [];
        notificationQueue[nid].push({ message: `Dispatch: New medical incident at ${incident.location}`, incidentId: incident.id, read: false });
      });

      return { payload, logEntry };
    } catch (error) {
      attemptRecord.status = 'failed';
      attemptRecord.error = error.message;
      logEntry.attempts.push(attemptRecord);
      console.warn('[AmbulanceService] Attempt failed', { incidentId: incident.id, attempt, error: error.message });
      if (attempt >= retries) {
        logEntry.status = 'failed';
        logEntry.failedAt = Date.now();
        logEntry.error = error.message;
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
    }
  }
}

// Endpoint: external ambulance integration (service-to-service)
app.post('/api/integrations/ambulance-service/forward', ambulanceServiceAuth, async (req, res) => {
  const { incidentId, consent } = req.body;
  if (!incidentId) return res.status(400).json({ ok: false, error: 'incidentId is required' });

  const incident = incidentAssignments.find(i => i.id === incidentId);
  if (!incident) return res.status(404).json({ ok: false, error: 'Incident not found' });
  if (incident.type !== 'medical') return res.status(400).json({ ok: false, error: 'Only medical incidents may be forwarded' });

  // Apply explicit consent if provided in request
  if (typeof consent === 'boolean') incident.meta = incident.meta || {}, incident.meta.consent = consent;

  try {
    const eta = getEstimatedResponseTime(incident);
    const result = await forwardToAmbulanceService(incident);

    // Send confirmation back to citizen (assuming contact in incident.meta)
    const citizenContact = incident.meta?.contact || incident.meta?.patient?.phone || null;
    if (citizenContact) {
      const masked = maskPII(citizenContact);
      // Enqueue a lightweight confirmation notification (simulated)
      notificationQueue[citizenContact] = notificationQueue[citizenContact] || [];
      notificationQueue[citizenContact].push({ message: `Ambulance dispatched. ETA ~${eta} minutes. Ref: ${incident.id}`, read: false });
    }

    return res.json({ ok: true, forwarded: true, trackingId: incident.id, etaMinutes: eta });
  } catch (error) {
    return res.status(502).json({ ok: false, error: 'Failed to forward to Ambulance Service', details: error.message });
  }
});

app.post('/api/coordinators/broadcast', coordinatorAuth, (req, res) => {
  const { channels, regions, message, title } = req.body;
  const broadcast = {
    id: `bcast-${uuidv4()}`,
    channels: channels || ['sms'],
    regions: regions || ['nationwide'],
    title: title || 'Emergency Broadcast',
    message,
    createdAt: Date.now()
  };
  broadcastHistory.push(broadcast);
  alertHistory.push({ ...broadcast, deliveredAt: Date.now() });

  const targetResponders = Object.values(userSessions)
    .filter(u => u.role === 'responder')
    .map(u => u.responderId || u.userId);

  targetResponders.forEach(id => {
    notificationQueue[id] = notificationQueue[id] || [];
    notificationQueue[id].push({ message: `Broadcast sent via ${broadcast.channels.join(', ')}: ${broadcast.title}`, read: false });
  });

  res.status(201).json({ ok: true, broadcast });
});

app.get('/api/coordinators/analytics', coordinatorAuth, (req, res) => {
  const totalIncidents = incidentAssignments.length;
  const openIncidents = incidentAssignments.filter(i => i.status !== 'resolved').length;
  const byType = incidentAssignments.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc; }, {});
  const byRegion = incidentAssignments.reduce((acc, i) => { acc[i.region] = (acc[i.region] || 0) + 1; return acc; }, {});
  const bySeverity = incidentAssignments.reduce((acc, i) => { acc[i.severity] = (acc[i.severity] || 0) + 1; return acc; }, {});
  const resourceSummary = resourceInventory.map(r => ({ id: r.id, type: r.type, status: r.status, location: r.location, quantity: r.quantity || r.capacity || 0 }));
  res.json({ ok: true, analytics: { totalIncidents, openIncidents, byType, byRegion, bySeverity, resourceSummary, pendingRequests: backupRequests.filter(r => r.status === 'pending').length } });
});

app.get('/api/coordinators/reports/export', coordinatorAuth, (req, res) => {
  const format = req.query.format || 'csv';
  const rows = incidentAssignments.map(i => ({
    id: i.id,
    type: i.type,
    location: i.location,
    status: i.status,
    severity: i.severity,
    region: i.region,
    assignedUnit: i.assignedUnit || '',
    responderId: i.responderId || '',
    createdAt: new Date(i.createdAt).toISOString()
  }));
  if (format === 'csv') {
    const header = Object.keys(rows[0] || {}).join(',');
    const body = rows.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="coordinator_report.csv"');
    return res.send(`${header}\n${body}`);
  }
  res.json({ ok: true, reports: rows });
});

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
});
