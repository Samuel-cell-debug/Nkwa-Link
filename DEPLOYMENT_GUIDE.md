# Nkwalink Emergency Dashboard - Deployment & Configuration Guide

## 🚀 Deployment Guide

### Development Setup

#### Prerequisites
- Node.js 16+ (optional, for backend development)
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)
- Git for version control
- HTTPS certificate (for production)

#### Local Development

1. **Clone Repository**
   ```bash
   git clone https://github.com/Samuel-cell-debug/Nkwa-Link.git
   cd Nkwa-Link
   ```

2. **Start Local Server**
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # OR using Node.js
   npx http-server
   
   # OR using PHP
   php -S localhost:8000
   ```

3. **Access Dashboard**
   ```
   http://localhost:8000/dashboard.html
   ```

### Production Deployment

#### Option 1: Static Hosting (Netlify/Vercel)

1. **Build for Production**
   ```bash
   # Minify JavaScript
   npx terser dashboard-logic.js -o dashboard-logic.min.js -c -m
   
   # Optimize HTML
   npx html-minifier --input-dir . --output-dir dist
   ```

2. **Deploy to Netlify**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

3. **Environment Setup**
   - Set `API_BASE_URL` environment variable
   - Configure CORS for API requests
   - Enable HTTPS (automatic with Netlify)

#### Option 2: Traditional Web Server (Nginx/Apache)

1. **Nginx Configuration**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name nkwalink.com;
       
       ssl_certificate /etc/ssl/certs/nkwalink.crt;
       ssl_certificate_key /etc/ssl/private/nkwalink.key;
       
       root /var/www/nkwalink;
       index dashboard.html;
       
       # Enable gzip compression
       gzip on;
       gzip_types text/plain text/css text/javascript application/json;
       
       # Cache static files
       location ~* \.(js|css|png|jpg|gif|svg)$ {
           expires 30d;
           add_header Cache-Control "public, immutable";
       }
       
       # Service Worker
       location = /sw.js {
           add_header Cache-Control "public, max-age=0, must-revalidate";
       }
       
       # API proxy
       location /api/ {
           proxy_pass https://api-server:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       # Fallback to index.html for SPA routing
       try_files $uri $uri/ /dashboard.html;
   }
   ```

2. **Apache Configuration**
   ```apache
   <VirtualHost *:443>
       ServerName nkwalink.com
       DocumentRoot /var/www/nkwalink
       
       SSLEngine on
       SSLCertificateFile /etc/ssl/certs/nkwalink.crt
       SSLCertificateKeyFile /etc/ssl/private/nkwalink.key
       
       <IfModule mod_rewrite.c>
           RewriteEngine On
           RewriteBase /
           RewriteRule ^index\.html$ - [L]
           RewriteCond %{REQUEST_FILENAME} !-f
           RewriteCond %{REQUEST_FILENAME} !-d
           RewriteRule . /dashboard.html [L]
       </IfModule>
       
       <IfModule mod_deflate.c>
           AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
       </IfModule>
       
       <IfModule mod_expires.c>
           ExpiresActive On
           ExpiresByType text/css "access plus 30 days"
           ExpiresByType text/javascript "access plus 30 days"
           ExpiresByType image/jpeg "access plus 30 days"
           ExpiresByType image/gif "access plus 30 days"
           ExpiresByType image/png "access plus 30 days"
       </IfModule>
   </VirtualHost>
   ```

#### Option 3: Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM nginx:alpine
   
   # Copy dashboard files
   COPY dashboard.html /usr/share/nginx/html/
   COPY dashboard-logic.js /usr/share/nginx/html/
   COPY sw.js /usr/share/nginx/html/
   
   # Copy nginx config
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   
   # Health check
   HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
       CMD curl -f http://localhost/dashboard.html || exit 1
   
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Build and Run**
   ```bash
   docker build -t nkwalink-dashboard .
   docker run -d -p 80:80 --name nkwalink nkwalink-dashboard
   ```

3. **Docker Compose Setup**
   ```yaml
   version: '3.8'
   
   services:
     frontend:
       build: ./frontend
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./ssl:/etc/nginx/ssl
       depends_on:
         - api
     
     api:
       build: ./backend
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - DATABASE_URL=postgresql://user:password@db:5432/nkwalink
         - REDIS_URL=redis://redis:6379
       depends_on:
         - db
         - redis
     
     db:
       image: postgres:14
       environment:
         - POSTGRES_DB=nkwalink
         - POSTGRES_USER=nkwalink
         - POSTGRES_PASSWORD=${DB_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data
     
     redis:
       image: redis:7-alpine
       ports:
         - "6379:6379"
       volumes:
         - redis_data:/data
   
   volumes:
     postgres_data:
     redis_data:
   ```

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file in project root:

```env
# API Configuration
API_BASE_URL=https://api.nkwalink.com/v1
API_TIMEOUT=10000

# Frontend Configuration
ENVIRONMENT=production
LOG_LEVEL=info
ENABLE_ANALYTICS=true

# Feature Flags
ENABLE_VOICE_INPUT=true
ENABLE_MEDIA_UPLOAD=true
ENABLE_OFFLINE_MODE=true
ENABLE_HEATMAP=true

# Geolocation
ENABLE_GPS=true
GEOLOCATION_TIMEOUT=10000

# Service Worker
ENABLE_SW=true
SW_UPDATE_INTERVAL=3600000

# Analytics
ANALYTICS_ID=GA-XXXXX
ENABLE_ERROR_TRACKING=true
ERROR_TRACKING_KEY=sentry-dsn

# SMS/WhatsApp Gateway
SMS_GATEWAY_URL=https://sms-gateway.example.com
WHATSAPP_API_KEY=xxx
USSD_GATEWAY_URL=https://ussd-gateway.example.com
```

### Service Worker Configuration

In `dashboard-logic.js`, configure cache:

```javascript
const CACHE_CONFIG = {
  version: 'v1',
  static: [
    'dashboard.html',
    'dashboard-logic.js',
    'sw.js',
    // External CDNs
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
  ],
  maxAge: 86400000, // 24 hours
  maxSize: 52428800 // 50MB
};
```

### API Gateway Configuration

```javascript
const API_CONFIG = {
  baseURL: process.env.API_BASE_URL,
  timeout: process.env.API_TIMEOUT,
  retries: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': '1.0.0'
  }
};
```

---

## 🔒 Security Configuration

### HTTPS/TLS Setup

1. **Let's Encrypt (Free)**
   ```bash
   # Using Certbot
   sudo certbot certonly --standalone -d nkwalink.com -d www.nkwalink.com
   
   # Auto-renewal
   sudo certbot renew --quiet --no-eff-email
   ```

2. **Self-Signed Certificate (Development)**
   ```bash
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365
   ```

### Content Security Policy (CSP)

```html
<meta http-equiv="Content-Security-Policy" 
      content="
        default-src 'self';
        script-src 'self' https://cdn.tailwindcss.com https://cdn.jsdelivr.net;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' https://fonts.gstatic.com;
        img-src 'self' data: https:;
        connect-src 'self' https://api.nkwalink.com;
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self'
      ">
```

### CORS Configuration (Backend)

```javascript
// Node.js Express example
const cors = require('cors');

app.use(cors({
  origin: ['https://nkwalink.com', 'https://www.nkwalink.com'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### API Key Management

```javascript
// Store API keys securely
const API_KEYS = {
  sms_gateway: process.env.SMS_GATEWAY_KEY,
  whatsapp: process.env.WHATSAPP_API_KEY,
  analytics: process.env.ANALYTICS_KEY
};

// Validate API keys
function validateAPIKey(key) {
  // Check against stored keys
  // Implement rate limiting
  // Log access
}
```

---

## 📊 Monitoring & Logging

### Application Monitoring

```javascript
// Error tracking with Sentry
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: process.env.ERROR_TRACKING_KEY,
  environment: process.env.ENVIRONMENT,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter sensitive data
    return event;
  }
});

window.addEventListener('error', (event) => {
  Sentry.captureException(event.error);
});
```

### Performance Monitoring

```javascript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);

// Custom metrics
const navigationTiming = performance.getEntriesByType('navigation')[0];
console.log('Page Load Time:', navigationTiming.loadEventEnd - navigationTiming.loadEventStart);
```

### Server Logging

```javascript
// Winston logger setup (Node.js backend)
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL,
  format: winston.format.json(),
  defaultMeta: { service: 'nkwalink-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log incidents
logger.info('Incident created', {
  incidentId: incident.id,
  type: incident.type,
  priority: incident.priority
});
```

---

## 🧪 Testing Before Deployment

### Pre-Deployment Checklist

- [ ] All roles accessible and functional
- [ ] Offline mode working correctly
- [ ] Service Worker installed and caching
- [ ] GPS functionality tested
- [ ] Voice input working
- [ ] Media upload functional
- [ ] All languages loading
- [ ] Responsive design on mobile/tablet
- [ ] Performance metrics acceptable
- [ ] No console errors
- [ ] API endpoints tested
- [ ] Error handling working
- [ ] Security headers in place
- [ ] SSL certificate valid
- [ ] Rate limiting configured
- [ ] Database migrations complete
- [ ] Backup and recovery tested

### Performance Testing

```bash
# Using Lighthouse
npm install -g lighthouse
lighthouse https://nkwalink.com --view

# Page Speed Insights
curl -X GET "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=nkwalink.com"

# Load Testing with Apache Bench
ab -n 1000 -c 100 https://nkwalink.com/dashboard.html

# Load Testing with wrk
wrk -t12 -c400 -d30s https://nkwalink.com/api/incidents
```

---

## 📈 Scaling Strategy

### Horizontal Scaling

```
                         ┌─────────────┐
                         │   CDN       │
                         │ (CloudFlare)│
                         └──────┬──────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
            ┌──────────────┐        ┌──────────────┐
            │ Load Balancer│        │ Load Balancer│
            │  (Nginx)     │        │  (Nginx)     │
            └───┬──────────┘        └──────┬───────┘
                │                         │
    ┌───────────┼───────────┐ ┌──────────┼──────────┐
    ▼           ▼           ▼ ▼          ▼          ▼
  ┌───┐       ┌───┐       ┌───┐      ┌───┐      ┌───┐
  │App│       │App│       │App│      │App│      │App│
  │ 1 │       │ 2 │       │ 3 │      │ 4 │      │ 5 │
  └───┘       └───┘       └───┘      └───┘      └───┘
    │           │           │          │          │
    └───────────┴───────────┴──────────┴──────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
        ┌────────┐      ┌────────┐     ┌────────┐
        │  DB    │      │ Redis  │     │  S3    │
        │Primary │      │ Cache  │     │Storage │
        └────────┘      └────────┘     └────────┘
```

### Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_priority ON incidents(priority);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_incidents_location ON incidents USING GIST(location);

-- Partition incidents by date
CREATE TABLE incidents_2024_01 PARTITION OF incidents
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Configuration

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test
      - run: npm run lint

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v2
      - run: npm run build
      - uses: actions/upload-artifact@v2
        with:
          name: build
          path: dist/

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      - uses: actions/download-artifact@v2
      - run: npm run deploy
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          API_BASE_URL: ${{ secrets.API_BASE_URL }}
```

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: Service Worker not caching files
```javascript
// Solution: Clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(names.map(name => caches.delete(name)));
    })
  );
});
```

**Issue**: CORS errors on API calls
```javascript
// Solution: Configure proper CORS headers
fetch(url, {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  credentials: 'include'
});
```

**Issue**: Offline functionality not working
```javascript
// Solution: Register service worker after page load
window.addEventListener('load', () => {
  navigator.serviceWorker.register('/sw.js');
});
```

---

**Version**: 1.0.0  
**Last Updated**: 2024
