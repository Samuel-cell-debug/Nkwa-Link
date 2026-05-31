Mock Server for Nkwalink

Run a simple Express server that simulates external integrations (dispatch, hospital, government, broadcast) and accepts report POSTs for offline syncing.

Setup

1. Install dependencies:

```bash
npm install
```

2. Start the mock server:

```bash
npm run mock-server
```

Endpoints

- `POST /api/integrations/:type/connect` - Simulates connecting to an external system (type: dispatch|hospital|government|broadcast)
- `POST /api/reports` - Accepts incident reports (used by offline sync)
- `GET /api/health` - Health check
