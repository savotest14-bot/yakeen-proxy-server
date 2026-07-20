# YAKEEN Proxy Service

Standalone Node.js microservice that communicates with the official **YAKEEN Identity Verification APIs**. Designed to be deployed on a **VPS located inside Saudi Arabia** and consumed securely by the main backend over HTTPS.

> **This service contains NO business logic.** It only authenticates with YAKEEN, verifies identities, and returns clean JSON responses.

---

## Tech Stack

- **Node.js** (Latest LTS)
- **Express.js** — Web framework
- **Axios** — HTTP client for YAKEEN API calls
- **Helmet** — Security headers
- **CORS** — Cross-origin control
- **Compression** — Response compression
- **express-rate-limit** — Rate limiting
- **express-validator** — Input validation
- **simple-node-logger** — Rolling file logs
- **Morgan** — Access logging
- **PM2** — Process management

---

## Project Structure

```
yakeen-proxy-service/
├── app.js                          # Express entry point
├── package.json
├── ecosystem.config.js             # PM2 config
├── .env.example                    # Environment template
├── README.md
│
├── config/
│   ├── env.js                      # Environment validation
│   ├── logger.js                   # Rolling file logger
│   └── axios.js                    # Pre-configured Axios
│
├── routes/
│   ├── health.routes.js            # GET /health
│   └── yakeen.routes.js            # POST /api/v1/yakeen/verify
│
├── controllers/
│   └── yakeen.controller.js        # Request handler
│
├── services/
│   └── yakeen.service.js           # YAKEEN API communication
│
├── middleware/
│   ├── authenticateProxy.js        # Internal secret auth
│   ├── validateRequest.js          # express-validator handler
│   ├── errorHandler.js             # Global error handler
│   └── notFound.js                 # 404 handler
│
├── validators/
│   └── verify.validator.js         # Request body validation
│
├── utils/
│   ├── response.js                 # Response helpers
│   ├── date.js                     # Date utilities
│   └── tokenCache.js               # In-memory token cache
│
├── logs/                           # Rolling log files
│
└── docs/
    └── postman_collection.json     # Postman collection
```

---

## Installation

```bash
# Clone and enter the project
cd yakeen-proxy-service

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your YAKEEN credentials
nano .env
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | Environment (production / development) |
| `INTERNAL_SECRET` | Secret for authenticating requests from the main backend |
| `YAKEEN_BASE_URL` | YAKEEN API base URL |
| `YAKEEN_LOGIN_URL` | YAKEEN login endpoint |
| `YAKEEN_USERNAME` | YAKEEN API username |
| `YAKEEN_PASSWORD` | YAKEEN API password |
| `YAKEEN_APP_ID` | YAKEEN application ID |
| `YAKEEN_APP_KEY` | YAKEEN application key |
| `YAKEEN_USAGE_CODE` | YAKEEN usage code |
| `YAKEEN_OPERATOR_ID` | YAKEEN operator ID |
| `YAKEEN_SAUDI_SERVICE_IDENTIFIER` | Service identifier for Saudi citizens |
| `YAKEEN_RESIDENT_SERVICE_IDENTIFIER` | Service identifier for residents |

---

## Running

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# View logs
pm2 logs yakeen-proxy

# Restart
pm2 restart yakeen-proxy

# Stop
pm2 stop yakeen-proxy

# Monitor
pm2 monit
```

---

## API Endpoints

### Health Check

```
GET /health
```

**Response:**
```json
{
  "success": true,
  "status": "UP",
  "timestamp": "2026-07-16T12:00:00.000Z"
}
```

### Verify Identity

```
POST /api/v1/yakeen/verify
```

**Headers:**
```
Authorization: Bearer <INTERNAL_SECRET>
Content-Type: application/json
```

**Request Body (Saudi):**
```json
{
  "identityType": "SAUDI",
  "identityNumber": "1234567890",
  "dateOfBirth": "1400-01-01"
}
```

**Request Body (Resident):**
```json
{
  "identityType": "RESIDENT",
  "identityNumber": "1234567890",
  "dateOfBirth": "1400-01-01"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Identity verified successfully",
  "data": { ... }
}
```

**Error Responses:**

| Status | Description |
|---|---|
| 401 | Unauthorized — invalid or missing INTERNAL_SECRET |
| 422 | Validation failed — missing or invalid fields |
| 400 | YAKEEN returned an error for the identity |
| 503 | YAKEEN service unavailable or authentication failed |
| 504 | YAKEEN service timed out |
| 429 | Rate limit exceeded |

---

## Deployment (Saudi VPS)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### 2. Deploy Application

```bash
# Clone your repository
git clone <your-repo-url> /var/www/yakeen-proxy-service
cd /var/www/yakeen-proxy-service

# Install dependencies
npm install --production

# Create environment file
cp .env.example .env
nano .env

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 process list for auto-restart on reboot
pm2 save
pm2 startup
```

### 3. Nginx Configuration

Create `/etc/nginx/sites-available/yakeen-proxy`:

```nginx
server {
    listen 80;
    server_name yakeen.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yakeen.yourdomain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate     /etc/letsencrypt/live/yakeen.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yakeen.yourdomain.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Request size limit
    client_max_body_size 1M;

    # Proxy to Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/yakeen-proxy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL Setup (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yakeen.yourdomain.com
sudo certbot renew --dry-run
```

### 5. Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Architecture Flow

```
Main Backend (anywhere)
        │
        ▼
POST https://yakeen.yourdomain.com/api/v1/yakeen/verify
  Authorization: Bearer <INTERNAL_SECRET>
        │
        ▼
  Saudi VPS (this service)
        │
        ├── YAKEEN Login (if token expired)
        │
        ├── YAKEEN Identity Verification
        │
        └── Return clean JSON
        │
        ▼
Main Backend
        │
        ▼
MongoDB Update (handled by main backend)
```

---

## Security Features

- **Helmet** — Secure HTTP headers
- **Rate Limiting** — 60 requests/minute
- **Compression** — gzip responses
- **CORS** — Configurable origins
- **Hidden headers** — x-powered-by disabled
- **Request size limit** — 1MB max body
- **Internal Secret Auth** — Bearer token verification
- **Input validation** — express-validator
- **Sensitive data redaction** — Passwords and tokens never logged

---

## Logging

| File | Content |
|---|---|
| `logs/yakeen-<date>.log` | All YAKEEN operations |
| `logs/error-<date>.log` | Errors only |
| `logs/access.log` | HTTP access log (morgan) |
| `logs/pm2-out.log` | PM2 stdout |
| `logs/pm2-error.log` | PM2 stderr |

---

## Main Backend Integration Example

```javascript
const axios = require("axios");

const verifyIdentity = async (identityType, identityNumber, dateOfBirth) => {
  const response = await axios.post(
    "https://yakeen.yourdomain.com/api/v1/yakeen/verify",
    { identityType, identityNumber, dateOfBirth },
    {
      headers: {
        Authorization: `Bearer ${process.env.YAKEEN_PROXY_SECRET}`,
        "Content-Type": "application/json",
      },
      timeout: 45000,
    }
  );

  return response.data;
};
```

---

## License

UNLICENSED — Private project.
