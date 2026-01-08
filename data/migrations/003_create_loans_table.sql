-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount_aud DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    interest_rate DECIMAL(5, 2),
    term_months INTEGER,
    approved_at TIMESTAMP,
    disbursed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_amount CHECK (amount_aud > 0)
);

-- Create index on customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_loans_customer_id ON loans(customer_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_loans_updated_at
    BEFORE UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
