import pool from "../db/index.js";

/**
 * Disbursement method types
 */
export enum DisbursementMethod {
  ON_CHAIN = "on_chain",
  API = "api",
}

/**
 * Disbursement status
 */
export enum DisbursementStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

/**
 * Disbursement record
 */
export interface DisbursementRecord {
  id: number;
  loanId: number;
  customerId: number;
  amountAud: number;
  method: DisbursementMethod;
  status: DisbursementStatus;
  recipientAddress: string;
  txHash?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new disbursement record in the database
 */
export async function createDisbursement(
  loanId: number,
  customerId: number,
  amountAud: number,
  recipientAddress: string,
  method: DisbursementMethod
): Promise<DisbursementRecord> {
  const result = await pool.query<DisbursementRecord>(
    `INSERT INTO disbursements
     (loan_id, customer_id, amount_aud, method, status, recipient_address, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING *`,
    [loanId, customerId, amountAud, method, DisbursementStatus.PENDING, recipientAddress]
  );

  return result.rows[0];
}

/**
 * Update disbursement status
 */
export async function updateDisbursement(
  id: number,
  status: DisbursementStatus,
  txHash?: string,
  errorMessage?: string
): Promise<DisbursementRecord | null> {
  const result = await pool.query<DisbursementRecord>(
    `UPDATE disbursements
     SET status = $1, tx_hash = $2, error_message = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [status, txHash, errorMessage, id]
  );

  return result.rows[0] || null;
}

/**
 * Get disbursement by ID
 */
export async function getDisbursement(id: number): Promise<DisbursementRecord | null> {
  const result = await pool.query<DisbursementRecord>(
    "SELECT * FROM disbursements WHERE id = $1",
    [id]
  );

  return result.rows[0] || null;
}

/**
 * Get disbursements by loan ID
 */
export async function getDisbursementsByLoan(loanId: number): Promise<DisbursementRecord[]> {
  const result = await pool.query<DisbursementRecord>(
    "SELECT * FROM disbursements WHERE loan_id = $1 ORDER BY created_at DESC",
    [loanId]
  );

  return result.rows;
}

/**
 * Get disbursements by customer ID
 */
export async function getDisbursementsByCustomer(customerId: number): Promise<DisbursementRecord[]> {
  const result = await pool.query<DisbursementRecord>(
    "SELECT * FROM disbursements WHERE customer_id = $1 ORDER BY created_at DESC",
    [customerId]
  );

  return result.rows;
}
