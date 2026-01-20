# Deployment Guide for ftx.finance

Simple, unified deployment with nginx on bare metal.

## Architecture

**Host (Bare Metal):**
- Nginx - Web server and reverse proxy
- Certbot - SSL certificate management
- UFW - Firewall
- Static UI files served from `/var/www/ftx.finance`

**Docker Containers:**
- PostgreSQL database
- TypeScript API (port 8080)
- Go API (port 8081)

## Prerequisites

1. **Server Access**: SSH access to `root@ftx.finance`
2. **DNS Configuration**: Point these domains to your server IP:
   - `ftx.finance`
   - `www.ftx.finance`
   - `api.ftx.finance`
   - `api2.ftx.finance`
3. **Local SSH Keys**: Configured for passwordless login

## Quick Start

```bash
./deploy.sh
```

That's it! The script handles everything automatically.

## What the Script Does

1. **Installs Prerequisites** - git, nginx, certbot, Docker, UFW
2. **Configures Firewall** - Opens ports 22, 80, 443
3. **Clones/Updates Code** - Pulls latest from GitHub
4. **Builds UI** - Compiles React app and deploys to `/var/www/ftx.finance`
5. **Configures Nginx** - Sets up reverse proxy for APIs
6. **Obtains SSL Certificates** - Free certificates from Let's Encrypt (auto-renews)
7. **Starts Docker Containers** - PostgreSQL and both APIs
8. **Reloads Nginx** - Activates SSL configuration

## Your Application URLs

- **Main Site**: https://ftx.finance
- **TypeScript API**: https://api.ftx.finance
- **Go API**: https://api2.ftx.finance

## Common Tasks

### Redeploy After Changes

```bash
# Make changes, commit, push
git add .
git commit -m "your changes"
git push origin main

# Deploy
./deploy.sh
```

### View Logs

```bash
# Docker container logs
ssh root@ftx.finance 'cd /opt/paperhands && docker-compose logs -f'

# Nginx logs
ssh root@ftx.finance 'tail -f /var/log/nginx/error.log'
```

### Restart Services

```bash
# Restart Docker containers
ssh root@ftx.finance 'cd /opt/paperhands && docker-compose restart'

# Restart nginx
ssh root@ftx.finance 'systemctl restart nginx'
```

### Check Status

```bash
# Container status
ssh root@ftx.finance 'cd /opt/paperhands && docker-compose ps'

# Nginx status
ssh root@ftx.finance 'systemctl status nginx'

# SSL certificates
ssh root@ftx.finance 'certbot certificates'

# Firewall status
ssh root@ftx.finance 'ufw status'
```

### Test SSL Renewal

```bash
ssh root@ftx.finance 'certbot renew --dry-run'
```

## File Structure

```
/
├── deploy.sh                    # Single deployment script
├── docker-compose.yml           # 3 services: postgres, api, api-go
├── nginx/
│   └── nginx.conf              # Nginx configuration for host
└── src/
    ├── api/                    # TypeScript API
    ├── api_go/                 # Go API
    └── ui/                     # React frontend
        └── Dockerfile          # Builds static files
```

## Server File Locations

- **Application Code**: `/opt/paperhands`
- **UI Static Files**: `/var/www/ftx.finance`
- **Nginx Config**: `/etc/nginx/sites-available/ftx.finance`
- **SSL Certificates**: `/etc/letsencrypt/live/ftx.finance/`

## Security Notes

**IMPORTANT**: Before deploying to production:

1. Change database password in `docker-compose.yml`
2. Update `DATABASE_URL` environment variable
3. Consider using environment files for secrets

## Firewall Configuration

The script automatically configures UFW:
- Port 22 (SSH) - ✓ Open
- Port 80 (HTTP) - ✓ Open (redirects to HTTPS)
- Port 443 (HTTPS) - ✓ Open
- All other ports - ✗ Blocked

## SSL Certificates

- Provided by Let's Encrypt (free)
- Auto-renewal configured
- Covers all 4 domains
- Renews 30 days before expiration

## Troubleshooting

### Deployment fails

```bash
# Check SSH connection
ssh root@ftx.finance

# Check DNS
dig ftx.finance
dig api.ftx.finance
```

### Site not loading

```bash
# Check nginx
ssh root@ftx.finance 'nginx -t'
ssh root@ftx.finance 'systemctl status nginx'

# Check containers
ssh root@ftx.finance 'cd /opt/paperhands && docker-compose ps'
```

### API not responding

```bash
# Check container logs
ssh root@ftx.finance 'cd /opt/paperhands && docker-compose logs api'
ssh root@ftx.finance 'cd /opt/paperhands && docker-compose logs api-go'

# Check if ports are listening
ssh root@ftx.finance 'netstat -tlnp | grep -E "8080|8081"'
```

### SSL certificate issues

```bash
# Check certificates
ssh root@ftx.finance 'certbot certificates'

# Renew manually
ssh root@ftx.finance 'certbot renew'
```

## Development vs Production

**Development** (local):
- Use `docker-compose.yml` with `npm run dev`
- APIs at `localhost:8080` and `localhost:8081`
- UI at `localhost:5173`

**Production** (ftx.finance):
- Nginx on bare metal
- APIs in Docker containers
- SSL enabled
- Firewall configured
- Auto-deployment with `./deploy.sh`

## Test User

A test user is seeded in the database:

- **Email**: `test@example.com`
- **Password**: `password123`

**Remember to change or remove this in production!**
