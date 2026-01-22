# Paperhands (ftx.finance)

A Bitcoin-backed lending platform allowing users to supply stablecoins (AAUD, USDC, USDT) and take BTC-collateralized loans.

## Architecture

```
                                    +------------------+
                                    |    Internet      |
                                    +--------+---------+
                                             |
                                             v
                              +-----------------------------+
                              |         Nginx (SSL)         |
                              |      (Bare Metal Host)      |
                              |                             |
                              |  - SSL termination          |
                              |  - Static file serving      |
                              |  - Reverse proxy            |
                              +-----------------------------+
                                    |         |         |
                    +---------------+         |         +---------------+
                    |                         |                         |
                    v                         v                         v
         +------------------+     +------------------+     +------------------+
         | ftx.finance      |     | api.ftx.finance  |     | api2.ftx.finance |
         | (Static Files)   |     | (TypeScript API) |     | (Go API)         |
         |                  |     |                  |     |                  |
         | /var/www/        |     | Docker :8080     |     | Docker :8081     |
         | ftx.finance/     |     |                  |     |                  |
         +------------------+     +--------+---------+     +--------+---------+
                                           |                         |
                                           +------------+------------+
                                                        |
                                                        v
                                           +------------------+
                                           |    PostgreSQL    |
                                           |  Docker :5432    |
                                           +------------------+
```

## Components

### Frontend (React/Vite)
- **Location**: `src/ui/`
- **Deployed to**: `/var/www/ftx.finance/` (static files served by nginx)
- **Build**: `npm run build` produces static files in `dist/`

### TypeScript API
- **Location**: `src/api/`
- **Port**: 8080
- **Endpoints**: Analytics, Bitcoin price history
- **Docker container**: `paperhands-api`

### Go API
- **Location**: `src/api_go/`
- **Port**: 8081
- **Endpoints**: Auth, Users, Loans, Price, Capital
- **Docker container**: `paperhands-api-go`

### PostgreSQL Database
- **Port**: 5432
- **Docker container**: `paperhands-postgres`
- **Data volume**: `postgres_data`

## Docker Compose Services

```yaml
services:
  postgres:      # PostgreSQL database (port 5432)
  api:           # TypeScript API (port 8080)
  api-go:        # Go API (port 8081)
```

The UI is **not** containerized in production - it's built in Docker and the static files are extracted and served directly by nginx.

## Nginx Configuration

Nginx runs on the bare metal host (not in Docker) and handles:

1. **SSL Termination** - Let's Encrypt certificates for HTTPS
2. **Static File Serving** - React app from `/var/www/ftx.finance/`
3. **Reverse Proxy** - Routes API requests to Docker containers:
   - `api.ftx.finance` -> `localhost:8080` (TypeScript API)
   - `api2.ftx.finance` -> `localhost:8081` (Go API)

## Deployment (deploy.sh)

The `deploy.sh` script performs a complete deployment:

### Steps:
1. **SSH Connection** - Connects to `root@ftx.finance`
2. **Prerequisites** - Installs git, nginx, certbot, Docker, Docker Compose, UFW
3. **Firewall** - Configures UFW (ports 22, 80, 443)
4. **Repository** - Clones/pulls latest code from GitHub
5. **UI Build** - Builds React app in Docker, extracts static files to `/var/www/ftx.finance/`
6. **Nginx Config** - Copies `nginx/nginx.conf` to sites-available and enables it
7. **SSL Certificates** - Obtains Let's Encrypt certs via certbot (if not already present)
8. **Docker Containers** - Runs `docker-compose up -d --build` for APIs and database
9. **Start Nginx** - Starts/reloads nginx service

### Usage:
```bash
./deploy.sh
```

### Requirements:
- SSH access to `root@ftx.finance`
- SSH key configured
- Domain DNS pointing to server

## Local Development

### Prerequisites
- Node.js 18+
- Go 1.21+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### Setup

1. **Start database and APIs:**
   ```bash
   docker-compose up -d
   ```

2. **Start UI development server:**
   ```bash
   cd src/ui
   npm install
   npm run dev
   ```

3. **Access locally:**
   - UI: http://localhost:5173
   - TypeScript API: http://localhost:8080
   - Go API: http://localhost:8081

### Environment Variables

**UI** (`src/ui/.env`):
```
VITE_API_URL=http://localhost:8080
VITE_API2_URL=http://localhost:8081
```

**UI Production** (`src/ui/.env.production`):
```
VITE_API_URL=https://api.ftx.finance
VITE_API2_URL=https://api2.ftx.finance
```

## Test Users

After seeding the database:
- `alice@example.com` / `password123`
- `bob@example.com` / `password123`
- `charlie@example.com` / `password123`

## API Endpoints

### Go API (api2.ftx.finance)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/signup | User registration |
| POST | /auth/login | User login |
| POST | /auth/logout | User logout |
| GET | /users | List all users |
| GET | /users/:id | Get user by ID |
| GET | /loans | List loans |
| POST | /loans | Create loan |
| GET | /price/btc-aud | Get BTC/AUD price |
| GET | /capital | List capital supplies |
| POST | /capital | Create capital supply |
| POST | /capital/deposit-address | Generate deposit address |

### TypeScript API (api.ftx.finance)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /analytics/* | Analytics endpoints |
