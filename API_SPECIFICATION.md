# Nkwalink Emergency Dashboard - API Specification

## 📡 API Overview

The Nkwalink Emergency Dashboard API provides comprehensive endpoints for managing incidents, resources, alerts, and user coordination. All endpoints use RESTful architecture with JSON request/response format.

### Base URL

```
Production: https://api.nkwalink.com/v1
Development: http://localhost:3000/api/v1
```

### Authentication

All API requests require an Authorization header with a JWT token:

```
Authorization: Bearer <jwt_token>
```

### Response Format

All successful responses return JSON with the following structure:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_12345"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Description of what went wrong",
    "details": { ... }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_12345"
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

---

## 👥 Authentication Endpoints

### POST /auth/login

**Description**: Authenticate user and receive JWT token

**Request**:
```json
{
  "username": "string",
  "password": "string",
  "role": "citizen|responder|coordinator"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "USR-001",
      "name": "John Doe",
      "role": "responder",
      "phone": "0501234567",
      "team": "Accra Central Station",
      "permissions": ["create_report", "accept_incident"]
    },
    "expires_in": 86400
  }
}
```

### POST /auth/logout

**Description**: Invalidate user session

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out"
  }
}
```

### GET /auth/me

**Description**: Get current user profile

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "USR-001",
    "name": "John Doe",
    "role": "responder",
    "email": "john@example.com",
    "phone": "0501234567",
    "team": "Accra Central Station",
    "status": "available",
    "lastLogin": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🚨 Incident Endpoints

### POST /incidents

**Description**: Create a new emergency incident report

**Required Permissions**: `citizen`, `responder`, `coordinator`

**Request**:
```json
{
  "type": "fire|medical|accident|crime|flood|other",
  "location": {
    "address": "string",
    "latitude": 5.6037,
    "longitude": -0.1870,
    "region": "greater_accra"
  },
  "priority": "critical|high|medium|low",
  "description": "string",
  "reporter": {
    "name": "string",
    "phone": "string",
    "email": "string"
  },
  "media": {
    "photos": ["url1", "url2"],
    "videos": ["url1"],
    "audio": "url"
  }
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "INC-2024-001",
    "type": "fire",
    "location": { ... },
    "priority": "critical",
    "status": "reported",
    "createdAt": "2024-01-15T10:30:00Z",
    "reporterId": "USR-001"
  }
}
```

### GET /incidents

**Description**: List incidents with filtering and pagination

**Required Permissions**: `responder`, `coordinator`

**Query Parameters**:
- `status`: Filter by status (reported, assigned, en-route, resolved)
- `priority`: Filter by priority (critical, high, medium, low)
- `type`: Filter by incident type
- `region`: Filter by region
- `limit`: Results per page (default: 20, max: 100)
- `offset`: Pagination offset (default: 0)
- `sort`: Sort field (createdAt, priority, updatedAt)
- `order`: Sort order (asc, desc)

**Example**:
```
GET /incidents?status=reported&priority=critical&limit=10&sort=createdAt&order=desc
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "incidents": [
      {
        "id": "INC-2024-001",
        "type": "fire",
        "location": { ... },
        "priority": "critical",
        "status": "reported",
        "createdAt": "2024-01-15T10:30:00Z",
        "reporter": { "name": "John Doe", "phone": "0501234567" },
        "assignedUnit": null
      }
    ],
    "pagination": {
      "limit": 10,
      "offset": 0,
      "total": 42,
      "pages": 5
    }
  }
}
```

### GET /incidents/:id

**Description**: Get incident details

**Required Permissions**: `responder` (own incidents), `coordinator`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "INC-2024-001",
    "type": "fire",
    "location": {
      "address": "Accra Central",
      "latitude": 5.6037,
      "longitude": -0.1870,
      "region": "greater_accra"
    },
    "priority": "critical",
    "status": "reported",
    "description": "Fire outbreak at commercial building",
    "reporter": {
      "id": "USR-123",
      "name": "John Doe",
      "phone": "0501234567"
    },
    "media": {
      "photos": ["url1", "url2"],
      "videos": ["url1"],
      "audio": "url"
    },
    "assignedUnit": null,
    "responseTeam": [],
    "timeline": [
      {
        "status": "reported",
        "timestamp": "2024-01-15T10:30:00Z",
        "actor": "USR-123"
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /incidents/:id

**Description**: Update incident details or status

**Required Permissions**: `responder` (assigned only), `coordinator`

**Request**:
```json
{
  "status": "reported|assigned|en-route|resolved|closed",
  "priority": "critical|high|medium|low",
  "description": "string",
  "assignedUnit": "RES-001",
  "notes": "string"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "INC-2024-001",
    "status": "assigned",
    "assignedUnit": "RES-001",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

### DELETE /incidents/:id

**Description**: Close/resolve an incident

**Required Permissions**: `coordinator`

**Request**:
```json
{
  "resolution": "resolved|transferred|false_alarm",
  "notes": "string"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "INC-2024-001",
    "status": "closed",
    "closedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

## 🚗 Resource Endpoints

### GET /resources

**Description**: List available resources and their status

**Required Permissions**: `responder` (own team only), `coordinator`

**Query Parameters**:
- `status`: Filter by status (available, busy, offline, maintenance)
- `type`: Filter by resource type (ambulance, fire_truck, police_unit)
- `region`: Filter by region
- `team`: Filter by team

**Response** (200):
```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "id": "AMB-001",
        "type": "ambulance",
        "status": "busy",
        "location": {
          "address": "Accra Central",
          "latitude": 5.6037,
          "longitude": -0.1870
        },
        "team": "Accra Central Station",
        "crew": {
          "total": 2,
          "names": ["Officer A", "Officer B"]
        },
        "assignedIncident": "INC-2024-001",
        "capacity": 2,
        "fuelLevel": 85,
        "lastUpdated": "2024-01-15T10:35:00Z"
      }
    ]
  }
}
```

### PUT /resources/:id

**Description**: Update resource status

**Required Permissions**: `responder` (own resources), `coordinator`

**Request**:
```json
{
  "status": "available|busy|offline|maintenance",
  "location": {
    "latitude": 5.6037,
    "longitude": -0.1870,
    "address": "string"
  },
  "fuelLevel": 85,
  "notes": "string"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "AMB-001",
    "status": "available",
    "location": { ... },
    "updatedAt": "2024-01-15T10:40:00Z"
  }
}
```

### POST /resources/:id/allocate

**Description**: Allocate a resource to an incident

**Required Permissions**: `coordinator`

**Request**:
```json
{
  "incidentId": "INC-2024-001",
  "priority": "high",
  "eta": 10,
  "instructions": "Respond to medical emergency"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "resourceId": "AMB-001",
    "incidentId": "INC-2024-001",
    "status": "allocated",
    "eta": 10,
    "allocatedAt": "2024-01-15T10:40:00Z"
  }
}
```

---

## 📢 Alert Endpoints

### POST /alerts/broadcast

**Description**: Broadcast alert to multiple channels

**Required Permissions**: `coordinator`

**Request**:
```json
{
  "type": "urgent|warning|info",
  "title": "string",
  "message": "string",
  "target": {
    "regions": ["greater_accra", "ashanti"],
    "roles": ["citizen", "responder"],
    "units": ["RES-001", "RES-002"]
  },
  "channels": {
    "sms": true,
    "whatsapp": true,
    "ussd": false,
    "push": true,
    "web": true
  },
  "urgency": "immediate|high|normal",
  "expiration": "2024-01-15T11:30:00Z"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "alertId": "ALR-2024-001",
    "type": "urgent",
    "status": "broadcasting",
    "targetAudience": 1250,
    "channels": ["sms", "whatsapp", "push", "web"],
    "createdAt": "2024-01-15T10:40:00Z"
  }
}
```

### GET /alerts

**Description**: Get recent alerts

**Query Parameters**:
- `limit`: Number of alerts (default: 20)
- `type`: Filter by type (urgent, warning, info)
- `status`: Filter by status (broadcasting, sent, expired)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "ALR-2024-001",
        "type": "urgent",
        "title": "Traffic Alert",
        "message": "Multiple vehicle accident on Ring Road",
        "status": "sent",
        "sentAt": "2024-01-15T10:40:00Z",
        "recipients": 1250,
        "delivered": 1200,
        "failed": 50
      }
    ]
  }
}
```

### POST /alerts/:id/acknowledge

**Description**: Acknowledge received alert

**Required Permissions**: `responder`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "alertId": "ALR-2024-001",
    "acknowledgedAt": "2024-01-15T10:42:00Z"
  }
}
```

---

## 💬 Communication Endpoints

### GET /messages/:conversationId

**Description**: Get message thread

**Query Parameters**:
- `limit`: Messages to retrieve (default: 50)
- `before`: Load older messages before timestamp

**Response** (200):
```json
{
  "success": true,
  "data": {
    "conversationId": "CONV-001",
    "participants": ["USR-001", "USR-002"],
    "messages": [
      {
        "id": "MSG-001",
        "sender": "USR-001",
        "text": "Responding to incident INC-2024-001",
        "timestamp": "2024-01-15T10:40:00Z",
        "status": "delivered"
      }
    ]
  }
}
```

### POST /messages

**Description**: Send message

**Request**:
```json
{
  "recipientId": "USR-002",
  "conversationId": "CONV-001",
  "text": "string",
  "attachments": ["url1", "url2"]
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "MSG-002",
    "sender": "USR-001",
    "text": "Message text",
    "status": "sent",
    "timestamp": "2024-01-15T10:42:00Z"
  }
}
```

---

## 📊 Analytics Endpoints

### GET /analytics/incidents

**Description**: Get incident statistics and trends

**Query Parameters**:
- `period`: Time period (day, week, month, year)
- `region`: Filter by region
- `type`: Filter by incident type

**Response** (200):
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 152,
      "resolved": 145,
      "pending": 7,
      "averageResponseTime": "7.2 mins",
      "resolutionRate": "95.4%"
    },
    "byType": {
      "medical": 65,
      "accident": 38,
      "fire": 25,
      "crime": 18,
      "flood": 6
    },
    "byPriority": {
      "critical": 12,
      "high": 45,
      "medium": 65,
      "low": 30
    },
    "timeSeries": [
      {
        "date": "2024-01-15",
        "incidents": 22,
        "resolved": 20,
        "avgResponseTime": 7.1
      }
    ]
  }
}
```

### GET /analytics/response-time

**Description**: Get response time metrics

**Response** (200):
```json
{
  "success": true,
  "data": {
    "overall": {
      "average": 7.2,
      "median": 6.5,
      "min": 2,
      "max": 45
    },
    "byType": {
      "medical": 5.8,
      "fire": 8.2,
      "accident": 7.5,
      "crime": 8.9,
      "flood": 12.3
    },
    "byRegion": {
      "greater_accra": 6.8,
      "ashanti": 8.1,
      "northern": 10.5
    },
    "trend": [
      { "date": "2024-01-15", "avgTime": 7.2 }
    ]
  }
}
```

### GET /analytics/resources

**Description**: Get resource utilization metrics

**Response** (200):
```json
{
  "success": true,
  "data": {
    "utilization": {
      "overall": 78,
      "byType": {
        "ambulance": 82,
        "fire_truck": 65,
        "police_unit": 88
      },
      "byRegion": {
        "greater_accra": 85,
        "ashanti": 72,
        "northern": 65
      }
    },
    "availability": {
      "ambulances": { "available": 8, "busy": 12 },
      "fire_trucks": { "available": 5, "busy": 3 },
      "police_units": { "available": 10, "busy": 22 }
    }
  }
}
```

### GET /reports/generate

**Description**: Generate comprehensive report

**Query Parameters**:
- `format`: Output format (pdf, json, csv)
- `period`: Report period (day, week, month)
- `include`: What to include (incidents, resources, alerts, analytics)

**Response** (200):
```
Content-Type: application/pdf
[PDF Binary Data]
```

---

## 📱 User Management Endpoints

### GET /users/:id

**Description**: Get user profile

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "USR-001",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "0501234567",
    "role": "responder",
    "team": "Accra Central Station",
    "status": "available",
    "permissions": ["create_report", "accept_incident"],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /users/:id/status

**Description**: Update user status

**Request**:
```json
{
  "status": "available|busy|break|offline",
  "location": {
    "latitude": 5.6037,
    "longitude": -0.1870
  }
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "userId": "USR-001",
    "status": "available",
    "updatedAt": "2024-01-15T10:45:00Z"
  }
}
```

---

## ⚠️ Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_INPUT` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

---

## 🔐 Rate Limiting

- **Public Endpoints**: 100 requests/minute per IP
- **Authenticated Endpoints**: 1000 requests/minute per user
- **Alert Broadcasting**: 10 broadcasts/minute per user

---

## 📝 Webhook Events

### Incident Events

- `incident.created` - New incident reported
- `incident.assigned` - Unit assigned to incident
- `incident.resolved` - Incident resolved
- `incident.escalated` - Incident escalated

### Resource Events

- `resource.status_changed` - Resource status updated
- `resource.location_updated` - Resource location changed
- `resource.low_fuel` - Resource fuel low warning

### Alert Events

- `alert.broadcast_started` - Alert broadcast initiated
- `alert.delivery_complete` - Alert delivered to all recipients
- `alert.acknowledged` - User acknowledged alert

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**API Format**: RESTful JSON  
**Authentication**: JWT Bearer Token
