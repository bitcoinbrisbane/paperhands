# SSL Deployment Guide for ftx.finance

This guide explains how to deploy your application with SSL certificates using the automated deployment script.

## Prerequisites

1. **SSH Access**: You must have SSH access to `root@ftx.finance`
2. **DNS Configuration**: Ensure `ftx.finance` and `www.ftx.finance` point to your server's IP
3. **Ports Open**: Ensure ports 80 and 443 are open in your firewall
4. **GitHub Access**: Server needs access to clone the public repository

## Security Notes

**IMPORTANT**: Before deploying to production, update the database credentials in `docker-compose.prod.yml`:
- Change `POSTGRES_PASSWORD` from the development default
- Update `DATABASE_URL` with the new password
- Consider using environment variables or secrets management for sensitive data

## Quick Start

Run the automated deployment script:

```bash
./deploy-ssl.sh
```

This script will:
1. Install certbot on your server
2. Copy your application files to `/opt/paperhands`
3. Obtain SSL certificates from Let's Encrypt
4. Configure nginx with SSL
5. Deploy your Docker containers with SSL support

## What the Script Does

### 1. Install Dependencies
- Installs git, certbot, nginx, and Docker on the server
- Detects your OS (Ubuntu/Debian or CentOS/RedHat) automatically

### 2. Clone/Pull from GitHub
- Clones the repository from GitHub if it doesn't exist
- Pulls latest changes if the repository already exists
- Ensures the server always runs the latest code from `main` branch

### 3. Obtain SSL Certificates
- Uses Let's Encrypt to obtain free SSL certificates
- Configures auto-renewal (certificates renew automatically every 90 days)
- Supports both `ftx.finance` and `www.ftx.finance`

### 4. Deploy Application
- Builds Docker containers with SSL support using `docker-compose.prod.yml`
- Mounts SSL certificates into the nginx container
- Starts all services (postgres, api, api-go, ui)

## Repository Files

- `deploy-ssl.sh` - Initial deployment script with SSL setup (run locally)
- `deploy-update.sh` - Quick update script for subsequent deployments (run locally)
- `docker-compose.prod.yml` - Production Docker Compose with SSL volume mounts
- `src/ui/nginx-ssl.conf` - SSL-ready nginx configuration
- `src/ui/nginx.conf` - Updated to use ftx.finance domain

## Deployment Workflow

1. **Make changes locally** - Edit code, test, commit
2. **Push to GitHub** - `git push origin main`
3. **Run deployment script** - `./deploy-ssl.sh`
4. The script automatically:
   - Pulls latest code from GitHub to the server
   - Rebuilds Docker containers
   - Deploys with zero downtime

## Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
# 1. SSH to server
ssh root@ftx.finance

# 2. Install dependencies
apt update && apt install -y git certbot python3-certbot-nginx nginx docker.io

# 3. Clone repository
cd /opt
git clone https://github.com/bitcoinbrisbane/paperhands.git
cd paperhands

# 4. Get SSL certificate
certbot certonly --standalone -d ftx.finance -d www.ftx.finance

# 5. Deploy with Docker
docker-compose -f docker-compose.prod.yml up -d --build
```

## Update Workflow

After the initial deployment, to update the application:

```bash
# Option 1: Quick update script (recommended for subsequent deployments)
./deploy-update.sh

# Option 2: Full deployment script (includes SSL checks)
./deploy-ssl.sh

# Option 3: SSH and pull manually
ssh root@ftx.finance
cd /opt/paperhands
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

**Note:** Use `deploy-update.sh` for quick updates after the initial setup. It's faster since it skips SSL certificate generation.

## Verify SSL Setup

After deployment, test your SSL:

```bash
# Check certificate status
ssh root@ftx.finance 'certbot certificates'

# Test auto-renewal
ssh root@ftx.finance 'certbot renew --dry-run'

# Check website
curl -I https://ftx.finance
```

## Troubleshooting

### Port 80/443 Already in Use
```bash
ssh root@ftx.finance 'lsof -i :80'
ssh root@ftx.finance 'lsof -i :443'
```

### View Container Logs
```bash
ssh root@ftx.finance 'cd /opt/paperhands && docker-compose -f docker-compose.prod.yml logs -f'
```

### Restart Services
```bash
ssh root@ftx.finance 'cd /opt/paperhands && docker-compose -f docker-compose.prod.yml restart'
```

### Check Certificate Expiry
```bash
ssh root@ftx.finance 'certbot certificates'
```

## Certificate Renewal

Certificates auto-renew via certbot's systemd timer. To manually renew:

```bash
ssh root@ftx.finance 'certbot renew'
```

## Security Notes

- SSL certificates are stored in `/etc/letsencrypt/` on the server
- They are mounted read-only into the nginx container
- Certificates auto-renew 30 days before expiration
- All HTTP traffic is redirected to HTTPS

## Nginx Configurations

Two nginx configurations are provided:

1. **nginx.conf** - Basic HTTP configuration (current)
2. **nginx-ssl.conf** - Full HTTPS with HTTP redirect (used after SSL setup)

The deployment script automatically handles switching between them.
