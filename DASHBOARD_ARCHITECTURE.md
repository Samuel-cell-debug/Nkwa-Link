# Nkwalink Emergency Dashboard - Technical Architecture

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Browser)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Dashboard UI (HTML/CSS)                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  JavaScript Logic Layer (dashboard-logic.js)        │   │
│  │  ├─ State Management                               │   │
│  │  ├─ Event Handlers                                 │   │
│  │  ├─ Role-Based Rendering                           │   │
│  │  └─ Utility Functions                              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Service Worker (sw.js)                            │   │
│  │  ├─ Offline Caching                                │   │
│  │  ├─ Background Sync                                │   │
│  │  └─ Network Fallback                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
    ┌─────────┐            ┌─────────┐          ┌──────────┐
    │ IndexDB │            │ Cache   │          │LocalStore│
    │ (Data)  │            │ (Files) │          │(Prefs)   │
    └─────────┘            └─────────┘          └──────────┘
```

### Component Hierarchy

```
dashboard.html
├── Header Component
│   ├─ Branding
│   ├─ Connection Status
│   ├─ Language Selector
│   ├─ User Menu
│   └─ Quick Stats
├── Main Content Area
│   ├── Citizen Dashboard
│   │   ├─ Report Form Section
│   │   ├─ Emergency Hotlines
│   │   ├─ Safety Tips
│   │   └─ Local Alerts Feed
│   ├── Responder Dashboard
│   │   ├─ Status Overview Cards
│   │   ├─ Incident Queue
│   │   ├─ Team Status
│   │   ├─ Resources Panel
│   │   └─ Communications
│   └── Coordinator Dashboard
│       ├─ KPI Dashboard
│       ├─ Incident Heatmap
│       ├─ Resources Overview
│       ├─ Incident Table
│       ├─ Alert Broadcasting
│       └─ Analytics Charts
└── Modals
    └─ Success Modal
```

## 🔄 Data Flow

### Citizen Report Submission Flow

```
User Form Input
    ↓
Form Validation
    ↓
Create Incident Object
    ↓
Add to Incidents Array
    ↓
Update Header Stats
    ↓
Show Success Modal
    ↓
Refresh Incident Lists (all roles)
```

### Responder Incident Assignment Flow

```
Incident Appears in Queue
    ↓
Responder Clicks "Accept"
    ↓
Update Incident Status → "assigned"
    ↓
Update Assigned Unit
    ↓
Refresh Responder Dashboard
    ↓
Update Coordinator Dashboard
    ↓
Send Notification to Command Center
```

### Alert Broadcast Flow

```
Coordinator Fills Alert Form
    ↓
Select Channels (SMS/WhatsApp/USSD)
    ↓
Submit Form
    ↓
Create Alert Object
    ↓
Add to Alerts Array
    ↓
Queue for Each Selected Channel
    ↓
Update Recent Alerts Display
    ↓
Show Success Confirmation
```

## 🎯 Role-Based Access Control (RBAC)

### Permission Matrix

| Feature | Citizen | Responder | Coordinator |
|---------|---------|-----------|-------------|
| Report Emergency | ✅ | ✅ | ✅ |
| View Own Status | ✅ | ✅ | ✅ |
| View All Incidents | ❌ | ✅ | ✅ |
| Accept Assignment | ❌ | ✅ | ❌ |
| Broadcast Alert | ❌ | ❌ | ✅ |
| Manage Resources | ❌ | ❌ | ✅ |
| Export Reports | ❌ | ❌ | ✅ |
| View Analytics | ❌ | ❌ | ✅ |
| Send Messages | ❌ | ✅ | ✅ |

### Implementation

```javascript
// Role-based view switching
function switchRole(role) {
  currentUser.role = role;
  
  // Hide all dashboards
  document.querySelectorAll('[id$="Dashboard"]').forEach(el => {
    el.classList.add('hidden');
  });
  
  // Show selected dashboard
  document.getElementById(`${role}Dashboard`).classList.remove('hidden');
  
  // Render role-specific content
  renderDashboard(role);
}
```

## 📱 State Management

### Global State Object

```javascript
// Current User
let currentUser = {
  id: string,
  name: string,
  role: 'citizen' | 'responder' | 'coordinator',
  phone: string,
  team: string | null,
  status: 'available' | 'busy' | 'break' | 'offline'
};

// Incidents Array
let incidents = [
  {
    id: string,
    type: string,
    location: string,
    priority: 'critical' | 'high' | 'medium' | 'low',
    status: 'reported' | 'assigned' | 'en-route' | 'resolved',
    time: Date,
    reporter: { name, phone },
    description: string,
    assignedUnit: string | null
  }
];

// Resources Array
let resources = [
  {
    id: string,
    type: string,
    location: string,
    status: 'available' | 'busy' | 'offline',
    crew: number
  }
];

// Messages Array
let messages = [
  {
    sender: string,
    text: string,
    timestamp: Date
  }
];

// Alerts Array
let alerts = [
  {
    type: 'urgent' | 'warning' | 'info',
    message: string,
    channels: string[],
    timestamp: Date
  }
];
```

### State Update Pattern

```javascript
// 1. Update state
incidents.push(newIncident);

// 2. Recalculate metrics
updateHeaderInfo();

// 3. Re-render affected views
renderCitizenDashboard();
renderResponderDashboard();
renderCoordinatorDashboard();

// 4. Persist to storage (if needed)
saveToIndexDB();
```

## 🎨 Rendering Architecture

### Template-Based Rendering

```javascript
// Generic rendering pattern
function renderComponent(data, container, template) {
  container.innerHTML = data
    .map(item => template(item))
    .join('');
}

// Example usage
renderComponent(
  incidents,
  document.getElementById('responderIncidentQueue'),
  (incident) => `
    <div class="incident-card">
      <h3>${incident.type.toUpperCase()}</h3>
      <p>${incident.location}</p>
    </div>
  `
);
```

### Dynamic CSS Classes

```javascript
// Function to get class based on priority
function getStatusClass(priority) {
  const classMap = {
    critical: 'status-critical',
    high: 'status-high',
    medium: 'status-medium',
    low: 'status-low'
  };
  return classMap[priority];
}

// Usage in template
<span class="status-badge ${getStatusClass(incident.priority)}">
  ${incident.priority}
</span>
```

## 🔐 Security Architecture

### Client-Side Security

```javascript
// Input Validation
function validateReport(data) {
  if (!data.type || !data.location || !data.phone) {
    throw new Error('Missing required fields');
  }
  if (!isValidPhoneNumber(data.phone)) {
    throw new Error('Invalid phone number');
  }
  return true;
}

// Sanitize Output
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

### Data Protection

```javascript
// Sensitive data handling
const sensitiveFields = ['password', 'token', 'ssn'];

function filterSensitiveData(object) {
  const filtered = {};
  for (let key in object) {
    if (!sensitiveFields.includes(key)) {
      filtered[key] = object[key];
    }
  }
  return filtered;
}
```

## 💾 Storage Architecture

### LocalStorage (User Preferences)

```javascript
// Save preferences
localStorage.setItem('language', 'tw');
localStorage.setItem('theme', 'dark');

// Retrieve preferences
const language = localStorage.getItem('language') || 'en';
```

### IndexedDB (Large Datasets)

```javascript
// Initialize database
const db = indexedDB.open('NkwalinkDB', 1);

db.onupgradeneeded = (event) => {
  const db = event.target.result;
  
  // Create object stores
  db.createObjectStore('incidents', { keyPath: 'id' });
  db.createObjectStore('resources', { keyPath: 'id' });
  db.createObjectStore('messages', { keyPath: 'timestamp' });
};

// Store data
function saveIncident(incident) {
  const transaction = db.transaction(['incidents'], 'readwrite');
  const store = transaction.objectStore('incidents');
  store.put(incident);
}

// Retrieve data
function getIncidents() {
  const transaction = db.transaction(['incidents'], 'readonly');
  const store = transaction.objectStore('incidents');
  return store.getAll();
}
```

### Cache API (Static Assets)

```javascript
// Cache strategy: Cache First, then Network
fetch(event.request)
  .then(response => {
    // If successful, cache it
    caches.open(CACHE_NAME).then(cache => {
      cache.put(event.request, response);
    });
    return response;
  })
  .catch(() => {
    // If offline, return cached version
    return caches.match(event.request);
  });
```

## 🔄 Synchronization

### Real-Time Updates

```javascript
// Periodic polling for updates
setInterval(() => {
  if (navigator.onLine) {
    fetchLatestIncidents();
    fetchResourceStatus();
    fetchAlerts();
  }
}, 10000); // Every 10 seconds
```

### Event-Driven Updates

```javascript
// Listen for state changes
document.addEventListener('incidentUpdated', (event) => {
  const incident = event.detail;
  updateIncidentInUI(incident);
  saveToIndexDB(incident);
  syncToServer(incident);
});

// Dispatch event
const event = new CustomEvent('incidentUpdated', { detail: incident });
document.dispatchEvent(event);
```

## 🧪 Testing Architecture

### Unit Testing Structure

```javascript
// Test helpers
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Test failed: ${message}`);
  }
}

// Test cases
function testPriorityCalculation() {
  assert(getPriorityValue('critical') === 4, 'Critical = 4');
  assert(getPriorityValue('high') === 3, 'High = 3');
  assert(getPriorityValue('medium') === 2, 'Medium = 2');
  assert(getPriorityValue('low') === 1, 'Low = 1');
}

function testIncidentCreation() {
  const incident = createIncident({
    type: 'fire',
    location: 'Test Street',
    priority: 'high'
  });
  assert(incident.id !== undefined, 'Incident has ID');
  assert(incident.status === 'reported', 'Status is reported');
}
```

## 📊 Performance Optimization

### Rendering Optimization

```javascript
// Debounce function calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usage
window.addEventListener('resize', debounce(() => {
  renderResponsiveLayout();
}, 300));
```

### Memory Management

```javascript
// Event delegation for large lists
document.getElementById('incidentList').addEventListener('click', (e) => {
  if (e.target.closest('.incident-card')) {
    handleIncidentClick(e.target.closest('.incident-card'));
  }
});

// Cleanup on navigation
function switchRole(role) {
  // Remove old event listeners
  document.removeEventListener('click', oldHandler);
  
  // Render new dashboard
  renderDashboard(role);
}
```

## 🌐 API Integration Points

### Planned Backend Services

```
Frontend Dashboard
    ├── → Incident Service
    │    ├─ POST /api/incidents
    │    ├─ GET /api/incidents
    │    ├─ PUT /api/incidents/:id
    │    └─ DELETE /api/incidents/:id
    │
    ├── → Resource Service
    │    ├─ GET /api/resources
    │    ├─ PUT /api/resources/:id
    │    └─ POST /api/resources/:id/allocate
    │
    ├── → Alert Service
    │    ├─ POST /api/alerts/broadcast
    │    ├─ GET /api/alerts
    │    └─ POST /api/alerts/:id/acknowledge
    │
    ├── → User Service
    │    ├─ POST /api/auth/login
    │    ├─ GET /api/auth/me
    │    ├─ POST /api/auth/logout
    │    └─ PUT /api/users/:id/status
    │
    └── → Analytics Service
         ├─ GET /api/analytics/incidents
         ├─ GET /api/analytics/response-time
         ├─ GET /api/analytics/resource-usage
         └─ GET /api/reports/generate
```

## 🚀 Deployment Architecture

### Development Environment

```
localhost:8000
└── dashboard.html
    └── dashboard-logic.js
        └── sw.js
```

### Production Deployment

```
CDN
├── Static Assets (HTML, CSS, JS)
└── Service Worker

API Server
├── Incident Management API
├── Resource Management API
├── Alert Broadcasting API
└── Analytics API

Database
├── Incidents Table
├── Resources Table
├── Users Table
├── Alerts Table
└── Audit Logs Table

Message Queue
├── SMS Queue
├── WhatsApp Queue
└── USSD Queue
```

## 📈 Scalability Considerations

### Horizontal Scaling

```
Load Balancer
├── API Server 1
├── API Server 2
├── API Server 3
└── API Server N

Database Cluster
├── Primary Database
├── Replica 1
├── Replica 2
└── Replica N

Cache Layer
├── Redis Node 1
├── Redis Node 2
└── Redis Node N
```

### Performance Metrics

- **Page Load Time**: < 2 seconds
- **Dashboard Render**: < 500ms
- **API Response**: < 1 second
- **Real-time Updates**: < 5 seconds latency

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Architecture Pattern**: MVC (Model-View-Controller)  
**Deployment Model**: Client-Side Rendered + Backend API
