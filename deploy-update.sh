#!/bin/bash

# Quick update script - pulls latest code and redeploys containers
# This is a simplified version of deploy-ssl.sh for subsequent deployments

set -e

SERVER="root@ftx.finance"
REMOTE_DIR="/opt/paperhands"

echo "================================="
echo "FTX.Finance Quick Update"
echo "================================="
echo ""

# Check SSH connection
echo "Connecting to ${SERVER}..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes ${SERVER} exit 2>/dev/null; then
    echo "Cannot connect to ${SERVER}"
    echo "Please check your SSH configuration"
    exit 1
fi

echo "✓ Connected"
echo ""

# Pull latest code and redeploy
echo "Pulling latest code and rebuilding containers..."
ssh ${SERVER} << 'ENDSSH'
    set -e
    cd /opt/paperhands

    echo "Fetching latest changes from GitHub..."
    GIT_TERMINAL_PROMPT=0 git fetch origin
    GIT_TERMINAL_PROMPT=0 git reset --hard origin/main
    GIT_TERMINAL_PROMPT=0 git pull origin main

    echo "Rebuilding and restarting containers..."
    docker-compose -f docker-compose.prod.yml up -d --build

    echo ""
    echo "✓ Deployment complete"
    echo ""
    echo "Container status:"
    docker-compose -f docker-compose.prod.yml ps
ENDSSH

echo ""
echo "================================="
echo "✓ Update Complete!"
echo "================================="
echo ""
echo "Your application is now running the latest code at:"
echo "  https://ftx.finance"
echo ""
