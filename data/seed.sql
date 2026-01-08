-- Seed data for PaperHands database
-- This file contains sample data for testing

-- Note: Password hashes are bcrypt hashed versions of "password123"
-- You should change these in production!

-- Insert test users
INSERT INTO users (email, password_hash) VALUES
    ('alice@example.com', '$2b$10$rBV2kGW8pZq7qDG6hxK0/.K9vXJYN9WXgKFKZ9xqN9Z9Z9Z9Z9Z9Z'),
    ('bob@example.com', '$2b$10$rBV2kGW8pZq7qDG6hxK0/.K9vXJYN9WXgKFKZ9xqN9Z9Z9Z9Z9Z9Z'),
    ('charlie@example.com', '$2b$10$rBV2kGW8pZq7qDG6hxK0/.K9vXJYN9WXgKFKZ9xqN9Z9Z9Z9Z9Z9Z')
ON CONFLICT (email) DO NOTHING;

-- Insert test customers
INSERT INTO customers (user_id, first_name, last_name, phone) VALUES
    (1, 'Alice', 'Smith', '+61400000001'),
    (2, 'Bob', 'Jones', '+61400000002'),
    (3, 'Charlie', 'Brown', '+61400000003')
ON CONFLICT (user_id) DO NOTHING;

-- Insert test loans
INSERT INTO loans (customer_id, amount_aud, status, interest_rate, term_months) VALUES
    (1, 10000.00, 'approved', 5.5, 12),
    (1, 5000.00, 'pending', 5.5, 6),
    (2, 15000.00, 'approved', 6.0, 24),
    (3, 7500.00, 'disbursed', 5.0, 12);

-- Insert test disbursements
INSERT INTO disbursements (loan_id, customer_id, amount_aud, method, status, recipient_address) VALUES
    (1, 1, 10000.00, 'api', 'completed', 'bank-account-123'),
    (3, 2, 15000.00, 'on_chain', 'completed', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'),
    (4, 3, 7500.00, 'on_chain', 'processing', '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7');

-- Update the disbursement with a sample tx hash
UPDATE disbursements
SET tx_hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
WHERE id = 2;

-- Show the inserted data
SELECT 'Users:' as table_name;
SELECT id, email, created_at FROM users;

SELECT 'Customers:' as table_name;
SELECT id, user_id, first_name, last_name, phone FROM customers;

SELECT 'Loans:' as table_name;
SELECT id, customer_id, amount_aud, status, interest_rate, term_months FROM loans;

SELECT 'Disbursements:' as table_name;
SELECT id, loan_id, customer_id, amount_aud, method, status, recipient_address FROM disbursements;
