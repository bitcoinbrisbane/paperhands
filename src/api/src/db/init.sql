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
-- $2b$10$rQZ8K.5K5K5K5K5K5K5K5OeY7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y7Y7
INSERT INTO users (email, password_hash)
VALUES ('test@example.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm')
ON CONFLICT (email) DO NOTHING;

-- Insert test customer
INSERT INTO customers (user_id, first_name, last_name)
SELECT id, 'Test', 'User' FROM users WHERE email = 'test@example.com'
ON CONFLICT DO NOTHING;
