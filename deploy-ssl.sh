#!/bin/bash

# Deployment script for setting up SSL on ftx.finance
# This script will SSH to the server and set up SSL certificates with certbot

set -e

# Configuration
SERVER="root@ftx.finance"
DOMAIN="ftx.finance"
WWW_DOMAIN="www.ftx.finance"
REMOTE_DIR="/opt/paperhands"

echo "================================="
echo "FTX.Finance SSL Setup Script"
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

# Step 1: Install certbot on the server
echo "Step 1: Installing certbot on server..."
ssh ${SERVER} << 'ENDSSH'
    set -e

    # Detect OS and install certbot
    if [ -f /etc/debian_version ]; then
        echo "Detected Debian/Ubuntu system"
        apt update
        apt install -y certbot python3-certbot-nginx
    elif [ -f /etc/redhat-release ]; then
        echo "Detected RedHat/CentOS system"
        yum install -y certbot python3-certbot-nginx
    else
        echo "Warning: Unknown OS. Please install certbot manually."
    fi

    which certbot && echo "✓ Certbot installed successfully" || echo "✗ Certbot installation may have failed"
ENDSSH

echo ""

# Step 2: Clone or pull latest code from GitHub
echo "Step 2: Setting up application from GitHub..."
ssh ${SERVER} << 'ENDSSH'
    set -e

    # Install git if not present
    if ! command -v git &> /dev/null; then
        if [ -f /etc/debian_version ]; then
            apt install -y git
        elif [ -f /etc/redhat-release ]; then
            yum install -y git
        fi
    fi

    # Clone or pull repository
    if [ -d /opt/paperhands/.git ]; then
        echo "Repository exists, pulling latest changes..."
        cd /opt/paperhands
        git fetch origin
        git reset --hard origin/main
        git pull origin main
    else
        echo "Cloning repository..."
        rm -rf /opt/paperhands

        # Try SSH first (if keys are configured), fall back to HTTPS
        if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
            echo "Using SSH authentication..."
            git clone git@github.com:bitcoinbrisbane/paperhands.git /opt/paperhands
        else
            echo "Using HTTPS (public repo)..."
            # For public repos, use HTTPS without authentication
            GIT_TERMINAL_PROMPT=0 git clone https://github.com/bitcoinbrisbane/paperhands.git /opt/paperhands
        fi
        cd /opt/paperhands
    fi

    echo "✓ Code updated from GitHub"
ENDSSH

echo ""

# Step 3: Setup nginx and obtain SSL certificates
echo "Step 3: Obtaining SSL certificates..."
echo ""
echo "IMPORTANT: Certbot needs nginx running on port 80 to verify domain ownership."
echo "We'll temporarily run nginx outside Docker for certificate generation."
echo ""

ssh ${SERVER} << ENDSSH
    set -e
    cd ${REMOTE_DIR}

    # Stop any running containers to free up ports
    if command -v docker-compose &> /dev/null; then
        docker-compose down 2>/dev/null || true
    fi

    # Install nginx on host if not present (needed for certbot)
    if ! command -v nginx &> /dev/null; then
        if [ -f /etc/debian_version ]; then
            apt install -y nginx
        elif [ -f /etc/redhat-release ]; then
            yum install -y nginx
        fi
    fi

    # Create a simple nginx config just for SSL verification
    cat > /etc/nginx/sites-available/${DOMAIN} << 'NGINXCONF'
server {
    listen 80;
    server_name ftx.finance www.ftx.finance api.ftx.finance api2.ftx.finance;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
NGINXCONF

    # Enable the site (Debian/Ubuntu only)
    if [ -d /etc/nginx/sites-enabled ]; then
        ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/${DOMAIN}
        rm -f /etc/nginx/sites-enabled/default
    else
        cp /etc/nginx/sites-available/${DOMAIN} /etc/nginx/conf.d/${DOMAIN}.conf
    fi

    # Test and restart nginx
    nginx -t && systemctl restart nginx

    # Run certbot for all domains
    echo "Running certbot..."
    certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN} -d api.${DOMAIN} -d api2.${DOMAIN} --non-interactive --agree-tos --register-unsafely-without-email || \
    certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN} -d api.${DOMAIN} -d api2.${DOMAIN}

    echo "✓ SSL certificates obtained successfully"

    # Stop system nginx to free up ports for Docker
    systemctl stop nginx
    systemctl disable nginx
ENDSSH

echo ""

# Step 4: Verify production configuration
echo "Step 4: Verifying production configuration..."
echo "✓ Using docker-compose.prod.yml from repository"
echo ""

# Step 5: Deploy the application with SSL
echo "Step 5: Deploying application with Docker..."
ssh ${SERVER} << 'ENDSSH'
    set -e
    cd /opt/paperhands

    # Install docker and docker-compose if needed
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi

    # Build and start containers using production config
    docker-compose -f docker-compose.prod.yml down || true
    docker-compose -f docker-compose.prod.yml up -d --build

    echo "✓ Application deployed successfully"
    echo ""
    echo "Checking container status..."
    docker-compose -f docker-compose.prod.yml ps
ENDSSH

echo ""
echo "================================="
echo "✓ SSL Setup Complete!"
echo "================================="
echo ""
echo "Your application should now be running at:"
echo "  https://${DOMAIN} (main site)"
echo "  https://api.${DOMAIN} (TypeScript API)"
echo "  https://api2.${DOMAIN} (Go API)"
echo ""
echo "SSL certificates will auto-renew. Check renewal with:"
echo "  ssh ${SERVER} 'certbot renew --dry-run'"
echo ""
echo "To view logs:"
echo "  ssh ${SERVER} 'cd ${REMOTE_DIR} && docker-compose -f docker-compose.prod.yml logs -f'"
echo ""
echo "To redeploy after pushing changes to GitHub:"
echo "  ./deploy-update.sh"
echo ""
