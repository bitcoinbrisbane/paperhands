#!/bin/bash

# Unified deployment script for ftx.finance
# This script deploys the entire application with nginx on bare metal

set -e

# Configuration
SERVER="root@ftx.finance"
DOMAIN="ftx.finance"
WWW_DOMAIN="www.ftx.finance"
REMOTE_DIR="/opt/paperhands"
WEB_ROOT="/var/www/ftx.finance"

echo "================================="
echo "FTX.Finance Deployment"
echo "================================="
echo ""

# Check if we can reach the server
echo "Testing SSH connection to ${SERVER}..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes ${SERVER} exit 2>/dev/null; then
    echo "Cannot connect to ${SERVER}"
    echo "Please ensure:"
    echo "  1. You have SSH access to the server"
    echo "  2. Your SSH key is configured"
    echo "  3. The server is running"
    exit 1
fi

echo "✓ SSH connection successful"
echo ""

# Main deployment on the server
ssh ${SERVER} << 'ENDSSH'
    set -e

    DOMAIN="ftx.finance"
    REMOTE_DIR="/opt/paperhands"
    WEB_ROOT="/var/www/ftx.finance"

    echo "Step 1: Installing prerequisites..."
    echo "===================================="

    # Detect OS
    if [ -f /etc/debian_version ]; then
        PKG_MANAGER="apt"
        echo "Detected Debian/Ubuntu system"
    elif [ -f /etc/redhat-release ]; then
        PKG_MANAGER="yum"
        echo "Detected RedHat/CentOS system"
    else
        echo "Unknown OS. Please install packages manually."
        exit 1
    fi

    # Update package lists
    if [ "$PKG_MANAGER" = "apt" ]; then
        apt update
    fi

    # Install git
    if ! command -v git &> /dev/null; then
        echo "Installing git..."
        $PKG_MANAGER install -y git
    fi
    echo "✓ Git installed"

    # Install nginx
    if ! command -v nginx &> /dev/null; then
        echo "Installing nginx..."
        $PKG_MANAGER install -y nginx
    fi
    echo "✓ Nginx installed"

    # Install certbot
    if ! command -v certbot &> /dev/null; then
        echo "Installing certbot..."
        if [ "$PKG_MANAGER" = "apt" ]; then
            $PKG_MANAGER install -y certbot python3-certbot-nginx
        else
            $PKG_MANAGER install -y certbot python3-certbot-nginx
        fi
    fi
    echo "✓ Certbot installed"

    # Install Docker
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
        systemctl enable docker
        systemctl start docker
    fi
    echo "✓ Docker installed"

    # Install Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    echo "✓ Docker Compose installed"

    # Install UFW if not present
    if ! command -v ufw &> /dev/null; then
        echo "Installing UFW firewall..."
        $PKG_MANAGER install -y ufw
    fi
    echo "✓ UFW installed"

    echo ""
    echo "Step 2: Configuring firewall..."
    echo "================================"

    # Configure UFW
    ufw --force enable
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw status
    echo "✓ Firewall configured"

    echo ""
    echo "Step 3: Cloning/updating repository..."
    echo "======================================"

    # Clone or pull repository
    if [ -d ${REMOTE_DIR}/.git ]; then
        echo "Repository exists, pulling latest changes..."
        cd ${REMOTE_DIR}
        git fetch origin
        git reset --hard origin/main
        git pull origin main
    else
        echo "Cloning repository..."
        rm -rf ${REMOTE_DIR}
        GIT_TERMINAL_PROMPT=0 git clone https://github.com/bitcoinbrisbane/paperhands.git ${REMOTE_DIR}
        cd ${REMOTE_DIR}
    fi
    echo "✓ Code updated from GitHub"

    echo ""
    echo "Step 4: Building UI..."
    echo "======================"

    # Build UI in Docker and extract dist files
    cd ${REMOTE_DIR}/src/ui

    # Build the UI container with production env vars passed as build args
    docker build --no-cache \
        --build-arg VITE_API_URL=https://api.ftx.finance \
        --build-arg VITE_API2_URL=https://api2.ftx.finance \
        -t paperhands-ui-builder .

    # Create a temporary container and copy dist files
    docker create --name ui-temp paperhands-ui-builder

    # Clean old files before copying new ones
    rm -rf ${WEB_ROOT}/*
    mkdir -p ${WEB_ROOT}

    docker cp ui-temp:/app/dist/. ${WEB_ROOT}/
    docker rm ui-temp

    # Set proper permissions
    chown -R www-data:www-data ${WEB_ROOT}
    chmod -R 755 ${WEB_ROOT}

    echo "✓ UI built and deployed to ${WEB_ROOT}"

    echo ""
    echo "Step 5: Configuring nginx..."
    echo "============================"

    # Copy nginx config
    cd ${REMOTE_DIR}
    cp nginx/nginx.conf /etc/nginx/sites-available/${DOMAIN}

    # Enable site
    if [ -d /etc/nginx/sites-enabled ]; then
        ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/${DOMAIN}
        rm -f /etc/nginx/sites-enabled/default
    else
        cp /etc/nginx/sites-available/${DOMAIN} /etc/nginx/conf.d/${DOMAIN}.conf
    fi

    echo "✓ Nginx configured"

    echo ""
    echo "Step 6: Obtaining SSL certificates..."
    echo "====================================="

    # Check if certificates already exist
    if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
        echo "Obtaining new SSL certificates..."

        # Create temporary simple config for certbot
        cat > /etc/nginx/sites-available/temp-${DOMAIN} << 'NGINXCONF'
server {
    listen 80;
    server_name ftx.finance www.ftx.finance api.ftx.finance api2.ftx.finance;
    root /var/www/html;
    location / {
        try_files $uri $uri/ =404;
    }
}
NGINXCONF

        if [ -d /etc/nginx/sites-enabled ]; then
            ln -sf /etc/nginx/sites-available/temp-${DOMAIN} /etc/nginx/sites-enabled/temp-${DOMAIN}
        fi

        # Test and reload nginx
        nginx -t && systemctl reload nginx

        # Run certbot
        certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} -d api.${DOMAIN} -d api2.${DOMAIN} --non-interactive --agree-tos --register-unsafely-without-email || \
        certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} -d api.${DOMAIN} -d api2.${DOMAIN}

        # Remove temporary config
        rm -f /etc/nginx/sites-enabled/temp-${DOMAIN}
        rm -f /etc/nginx/sites-available/temp-${DOMAIN}

        echo "✓ SSL certificates obtained"
    else
        echo "✓ SSL certificates already exist"
    fi

    echo ""
    echo "Step 7: Starting Docker containers..."
    echo "====================================="

    cd ${REMOTE_DIR}

    # Stop any running containers
    docker-compose down 2>/dev/null || true

    # Remove old UI container if it exists (we serve UI via nginx now)
    docker stop paperhands-ui 2>/dev/null || true
    docker rm paperhands-ui 2>/dev/null || true

    # Start containers
    docker-compose up -d --build

    echo "✓ Docker containers started"
    echo ""
    echo "Container status:"
    docker-compose ps

    # Clean up unused Docker resources
    echo ""
    echo "Cleaning up unused Docker resources..."
    docker system prune -f --volumes 2>/dev/null || true
    docker image prune -f 2>/dev/null || true
    docker builder prune -f 2>/dev/null || true
    echo "✓ Docker cleanup complete"

    echo ""
    echo "Step 8: Starting nginx..."
    echo "=========================="

    # Final nginx start/restart with SSL config
    nginx -t
    if systemctl is-active --quiet nginx; then
        systemctl reload nginx
        echo "✓ Nginx reloaded"
    else
        systemctl enable nginx
        systemctl start nginx
        echo "✓ Nginx started"
    fi

ENDSSH

echo ""
echo "================================="
echo "✓ Deployment Complete!"
echo "================================="
echo ""
echo "Your application is now running at:"
echo "  https://${DOMAIN} (main site)"
echo "  https://api.${DOMAIN} (TypeScript API)"
echo "  https://api2.${DOMAIN} (Go API)"
echo ""
echo "Useful commands:"
echo "  View logs:         ssh ${SERVER} 'cd ${REMOTE_DIR} && docker-compose logs -f'"
echo "  Restart services:  ssh ${SERVER} 'cd ${REMOTE_DIR} && docker-compose restart'"
echo "  Check nginx:       ssh ${SERVER} 'systemctl status nginx'"
echo "  Check SSL:         ssh ${SERVER} 'certbot certificates'"
echo ""
echo "To redeploy after pushing changes:"
echo "  ./deploy.sh"
echo ""
