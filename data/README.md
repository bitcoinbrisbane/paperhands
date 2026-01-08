# Database Migrations

This directory contains SQL migration scripts for the PaperHands application database.

## Prerequisites

- PostgreSQL installed and running
- Database credentials configured in `src/api_go/.env`

## Database Schema

The migrations create the following tables:

1. **users** - User authentication and account information
2. **customers** - Customer profile information linked to users
3. **loans** - Loan applications and records
4. **disbursements** - Loan disbursement records (on-chain or API)

## Running Migrations

### Option 1: Using the migration script (Recommended)

```bash
cd data
./migrate.sh
```

The script will:
- Read database configuration from `src/api_go/.env`
- Create the database if it doesn't exist
- Run all migration files in order
- Show progress for each migration

### Option 2: Manual execution

Run each migration file individually:

```bash
psql -h localhost -p 5432 -U postgres -d paperhands -f migrations/001_create_users_table.sql
psql -h localhost -p 5432 -U postgres -d paperhands -f migrations/002_create_customers_table.sql
psql -h localhost -p 5432 -U postgres -d paperhands -f migrations/003_create_loans_table.sql
psql -h localhost -p 5432 -U postgres -d paperhands -f migrations/004_create_disbursements_table.sql
```

### Option 3: Using psql directly

```bash
psql -h localhost -p 5432 -U postgres -d paperhands
\i migrations/001_create_users_table.sql
\i migrations/002_create_customers_table.sql
\i migrations/003_create_loans_table.sql
\i migrations/004_create_disbursements_table.sql
```

## Migration Files

- `001_create_users_table.sql` - Creates users table with email/password authentication
- `002_create_customers_table.sql` - Creates customers table with profile information
- `003_create_loans_table.sql` - Creates loans table for loan records
- `004_create_disbursements_table.sql` - Creates disbursements table for payment tracking

## Environment Variables

The migration script uses the following environment variables (from `src/api_go/.env`):

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=paperhands
```

## Database Connection

After running migrations, you can connect to the database:

```bash
psql -h localhost -p 5432 -U postgres -d paperhands
```

## Creating Test Data

Example SQL to create a test user:

```sql
-- Insert a test user (password: "password123")
INSERT INTO users (email, password_hash)
VALUES ('test@example.com', '$2b$10$rBV2kGW8pZq7qDG6hxK0/.K9vXJYN9WXgKFKZ9xqN9Z9Z9Z9Z9Z9Z');

-- Insert corresponding customer
INSERT INTO customers (user_id, first_name, last_name, phone)
VALUES (1, 'Test', 'User', '+1234567890');
```

## Rollback

To drop all tables (USE WITH CAUTION):

```sql
DROP TABLE IF EXISTS disbursements CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS disbursement_method;
DROP TYPE IF EXISTS disbursement_status;
DROP FUNCTION IF EXISTS update_updated_at_column();
```
