# Responder Dashboard Module - Quick Start Guide

## Overview
The Responder Dashboard is a secure interface for emergency responders to manage their assigned incidents, request backup resources, communicate with coordinators, and receive real-time notifications.

## Features
✅ **Secure Login** - Role-based access with token authentication
✅ **Incident Queue** - View all assigned incidents with real-time status
✅ **Status Management** - Update incident status (New → En Route → Resolved)
✅ **Backup Requests** - Request additional resources (ambulances, fire trucks, police units, personnel, supplies)
✅ **Secure Messaging** - Chat with coordinators about incident details
✅ **Real-Time Notifications** - Polling-based notifications when new incidents are assigned
✅ **Mobile Responsive** - Fully responsive design for all screen sizes
✅ **Media Attachments** - View citizen-submitted photos and videos

## Demo Credentials

| Username | Password | Unit |
|----------|----------|------|
| `resp001` | `emergency123` | Fire Team Alpha |
| `resp002` | `response456` | Ambulance Unit 2 |
| `resp003` | `field789` | Police Patrol 7 |

## Getting Started

### 1. Start the Mock Server

```bash
npm install
npm start
```

The server will run on `http://localhost:4000`

### 2. Access the Dashboard

Open `http://localhost:4000/responder-dashboard.html` or open the local `responder-dashboard.html` file in a browser.

### 3. Login

- Enter username: `resp001`
- Enter password: `emergency123`
- Click Login

### 4. View Your Incidents

The dashboard will display:
- **My Incident Queue** (left panel): List of all assigned incidents
- **Incident Details** (right panel): Full details when you select an incident from the queue

### 5. Manage Incident Status

Click one of the status buttons to update:
- **New** - Incident just received
- **En Route** - You're heading to the location
- **Resolved** - Incident has been handled

### 6. Request Backup

1. Click **Request Backup** button
2. Select resource type (Ambulance, Fire Truck, Police Unit, Personnel, Medical Supplies)
3. Set quantity and urgency level
4. Add optional details
5. Submit request

Coordinators will receive a notification immediately.

### 7. Contact Coordinator

1. Click **Contact Coordinator** button
2. Select issue type (Clarification, Support, Escalation, Other)
3. Type your message
4. Send

### 8. Messaging

Use the **Coordinator Messages** panel to send and receive messages about the current incident. Messages are organized by incident.

### 9. Notifications

The dashboard polls for new notifications every 5 seconds:
- New incident assignments appear as notifications
- Backup request status updates
- Coordinator responses

The badge in the top-right shows the count of new incidents.

## API Endpoints

### Authentication
```bash
POST /api/responders/login
{
  "username": "resp001",
  "password": "emergency123"
}
→ { ok: true, token: "...", responder: { id, name, unit } }
```

### Incident Management
```bash
# Get assigned incidents
GET /api/responders/:responderId/incidents
Headers: Authorization: Bearer <token>

# Update incident status
PATCH /api/responders/:responderId/incidents/:incidentId
{
  "status": "en-route" | "new" | "resolved"
}
```

### Backup Requests
```bash
POST /api/responders/:responderId/backup-request
{
  "incidentId": "...",
  "resourceType": "ambulance|fire_truck|police_unit|personnel|medical_supplies",
  "quantity": 1,
  "urgency": "normal|high|critical",
  "details": "optional details"
}
```

### Messaging
```bash
# Send message
POST /api/responders/:responderId/message
{
  "toRole": "coordinator",
  "text": "Message text",
  "incidentId": "...",
  "type": "clarification|support|escalation|other"
}

# Get messages for incident
GET /api/responders/:responderId/messages/:incidentId

# Get notifications (polling)
GET /api/responders/:responderId/notifications
→ { ok: true, notifications: [{ message: "...", read: false }] }
```

## Example cURL Requests

### Login
```bash
curl -X POST http://localhost:4000/api/responders/login \
  -H "Content-Type: application/json" \
  -d '{"username":"resp001","password":"emergency123"}'
```

### Get Incidents
```bash
curl http://localhost:4000/api/responders/resp001/incidents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Status
```bash
curl -X PATCH http://localhost:4000/api/responders/resp001/incidents/inc-12345 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"en-route"}'
```

### Request Backup
```bash
curl -X POST http://localhost:4000/api/responders/resp001/backup-request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "incidentId":"inc-12345",
    "resourceType":"ambulance",
    "quantity":2,
    "urgency":"high",
    "details":"Multiple casualties reported"
  }'
```

### Send Message
```bash
curl -X POST http://localhost:4000/api/responders/resp001/message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toRole":"coordinator",
    "text":"Request permission to evacuate area",
    "incidentId":"inc-12345",
    "type":"clarification"
  }'
```

## UI/UX Features

### Mobile Responsive
- Stacks to single column on mobile devices
- Touch-friendly buttons and inputs
- Optimized notification sizing

### Real-Time Updates
- Incidents auto-poll every 5 seconds
- Messages load when you open an incident
- Notifications appear at bottom right

### Status Visual Indicators
- 🔴 New (Red)
- 🟠 En Route (Orange)
- 🟢 Resolved (Green)

### Resource Request Prioritization
- Normal: Standard response time
- High: Expedited response
- Critical: Immediate dispatch

## Technical Details

### Frontend
- Vanilla JavaScript (no frameworks)
- LocalStorage for session persistence
- Polling-based notifications
- FormData for media uploads

### Backend
- Node.js + Express
- In-memory data storage (can integrate MongoDB)
- Token-based authentication
- CORS enabled

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

- WebSocket support for real-time notifications (lower latency than polling)
- GPS tracking of responder location
- Incident history and analytics
- Voice communication integration
- Offline incident sync when connection is lost
- Multi-language support in dashboard UI

## Troubleshooting

### Login failing
- Verify credentials are exact: `resp001` / `emergency123`
- Check that mock server is running on port 4000
- Check browser console for CORS errors

### No incidents showing
- Incidents are auto-generated on first login for demo
- Wait a few seconds for the dashboard to load
- Try refreshing the page

### Notifications not appearing
- Notifications poll every 5 seconds - wait a moment
- Check browser console for errors
- Ensure you're connected to the mock server

### Messages not sending
- Select an incident first (click on it in the queue)
- Ensure incident ID is populated in the details panel
- Check network tab for 201 response

## Support

For issues or questions, check the main Nkwa-Link documentation or contact the development team.
