-- Create disbursement method enum type
CREATE TYPE disbursement_method AS ENUM ('on_chain', 'api');

-- Create disbursement status enum type
CREATE TYPE disbursement_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create disbursements table
CREATE TABLE IF NOT EXISTS disbursements (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount_aud DECIMAL(12, 2) NOT NULL,
    method disbursement_method NOT NULL,
    status disbursement_status DEFAULT 'pending',
    recipient_address VARCHAR(255) NOT NULL,
    tx_hash VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_disbursement_amount CHECK (amount_aud > 0)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_disbursements_loan_id ON disbursements(loan_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_customer_id ON disbursements(customer_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_status ON disbursements(status);
CREATE INDEX IF NOT EXISTS idx_disbursements_tx_hash ON disbursements(tx_hash);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_disbursements_updated_at
    BEFORE UPDATE ON disbursements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
