-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table (linked to users)
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    amount_aud DECIMAL(18, 2) NOT NULL,
    collateral_btc DECIMAL(18, 8) NOT NULL,
    btc_price_at_creation DECIMAL(18, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    deposit_address VARCHAR(100),
    derivation_path VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert a test user (password is 'password123' hashed with bcrypt)
INSERT INTO users (email, password_hash)
VALUES ('test@example.com', '$2b$10$K8ik9pYikgXXHy7mQMrRDu2n36Z.S2TwfheTD5QTi1rof91AnHiZK')
ON CONFLICT (email) DO NOTHING;

-- Insert test customer (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM customers c JOIN users u ON c.user_id = u.id WHERE u.email = 'test@example.com') THEN
        INSERT INTO customers (user_id, first_name, last_name)
        SELECT id, 'Test', 'User' FROM users WHERE email = 'test@example.com';
    END IF;
END $$;
