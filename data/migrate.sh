#!/bin/bash

# Database migration script for PaperHands
# This script runs all SQL migration files in order

set -e

# Load environment variables from .env if it exists
if [ -f "../src/api_go/.env" ]; then
    export $(cat ../src/api_go/.env | grep -v '^#' | xargs)
fi

# Default values if not set in environment
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-paperhands}

echo "========================================="
echo "PaperHands Database Migration"
echo "========================================="
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo "========================================="
echo ""

# Set PGPASSWORD for non-interactive execution
export PGPASSWORD=$DB_PASSWORD

# Create database if it doesn't exist
echo "Checking if database exists..."
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "Creating database $DB_NAME..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
    echo "Database created successfully."
else
    echo "Database already exists."
fi

echo ""
echo "Running migrations..."
echo ""

# Run each migration file in order
for migration_file in migrations/*.sql; do
    if [ -f "$migration_file" ]; then
        echo "Applying: $(basename $migration_file)"
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$migration_file"
        echo "✓ Completed: $(basename $migration_file)"
        echo ""
    fi
done

echo "========================================="
echo "All migrations completed successfully!"
echo "========================================="

# Unset password
unset PGPASSWORD
