#!/bin/bash

# Deployment script for paperhands
# Usage: ./deploy.sh [user@]host
# Example: ./deploy.sh root@178.128.78.90

set -e

HOST="${1:-root@178.128.78.90}"
APP_DIR="/opt/paperhands"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Deploying to $HOST"

# Copy local files to server
echo "=== Copying files to server ==="
ssh -o StrictHostKeyChecking=no "$HOST" "mkdir -p $APP_DIR"
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
    "$SCRIPT_DIR/" "$HOST:$APP_DIR/"
echo "✓ Files copied"

ssh -o StrictHostKeyChecking=no "$HOST" bash << 'REMOTE_SCRIPT'
set -e

echo "=== Updating system packages ==="
apt-get update -y
apt-get upgrade -y

echo "=== Checking/Installing Docker ==="
if command -v docker &> /dev/null; then
    echo "✓ Docker is already installed: $(docker --version)"
else
    echo "Installing Docker..."
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo "✓ Docker installed: $(docker --version)"
fi

echo "=== Checking/Installing Nginx ==="
if command -v nginx &> /dev/null; then
    echo "✓ Nginx is already installed: $(nginx -v 2>&1)"
else
    echo "Installing Nginx..."
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo "✓ Nginx installed: $(nginx -v 2>&1)"
fi

echo "=== Setting up UFW Firewall ==="
apt-get install -y ufw

# Reset UFW to default (deny incoming, allow outgoing)
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (important - do this first!)
ufw allow 22/tcp comment 'SSH'

# Allow HTTP and HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Enable UFW
ufw --force enable
ufw status verbose
echo "✓ UFW firewall configured"

APP_DIR="/opt/paperhands"
echo "✓ Repository ready at $APP_DIR"

echo "=== Configuring Nginx as Reverse Proxy ==="
cat > /etc/nginx/sites-available/paperhands << 'NGINX_CONF'
server {
    listen 80;
    server_name _;

    # UI - React frontend
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API - Express backend
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_CONF

# Enable the site
ln -sf /etc/nginx/sites-available/paperhands /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t
systemctl reload nginx
echo "✓ Nginx configured as reverse proxy"

echo "=== Building and Starting Docker Containers ==="
cd "$APP_DIR"
docker compose down 2>/dev/null || true
docker compose up --build -d

echo "=== Waiting for services to start ==="
sleep 10

echo "=== Checking Service Status ==="
docker compose ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Services:"
echo "  - UI:       http://$(hostname -I | awk '{print $1}')"
echo "  - API:      http://$(hostname -I | awk '{print $1}')/api/health"
echo "  - Postgres: localhost:5432 (internal only)"
echo ""
echo "Useful commands:"
echo "  - View logs:     cd $APP_DIR && docker compose logs -f"
echo "  - Restart:       cd $APP_DIR && docker compose restart"
echo "  - Stop:          cd $APP_DIR && docker compose down"

REMOTE_SCRIPT

echo "🎉 Deployment to $HOST completed!"
