import { Router, Request, Response } from "express";
import pool from "../db/index.js";

const router = Router();

interface CreateLoanRequest {
  customerId: number;
  amountAud: number;
  collateralBtc: number;
  btcPriceAtCreation: number;
}

interface GetLoansQuery {
  customerId?: string;
  status?: string;
}

router.get("/", async (req: Request<object, object, object, GetLoansQuery>, res: Response) => {
  try {
    const { customerId, status } = req.query;

    let query = `
      SELECT
        id,
        customer_id,
        amount_aud,
        collateral_btc,
        btc_price_at_creation,
        status,
        deposit_address,
        derivation_path,
        created_at,
        updated_at
      FROM loans
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    let paramCount = 1;

    if (customerId) {
      query += ` AND customer_id = $${paramCount}`;
      params.push(Number(customerId));
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);

    const loans = result.rows.map(row => ({
      id: row.id,
      customerId: row.customer_id,
      amountAud: parseFloat(row.amount_aud),
      collateralBtc: parseFloat(row.collateral_btc),
      btcPriceAtCreation: parseFloat(row.btc_price_at_creation),
      status: row.status,
      depositAddress: row.deposit_address,
      derivationPath: row.derivation_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json(loans);
  } catch (error) {
    console.error("Error fetching loans:", error);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
});

router.post("/", async (req: Request<object, object, CreateLoanRequest>, res: Response) => {
  try {
    const { customerId, amountAud, collateralBtc, btcPriceAtCreation } = req.body;

    if (!customerId || !amountAud || !collateralBtc || !btcPriceAtCreation) {
      res.status(400).json({
        error: "customerId, amountAud, collateralBtc, and btcPriceAtCreation are required"
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO loans (customer_id, amount_aud, collateral_btc, btc_price_at_creation, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id, customer_id, amount_aud, collateral_btc, btc_price_at_creation, status, created_at`,
      [customerId, amountAud, collateralBtc, btcPriceAtCreation]
    );

    const loan = result.rows[0];

    console.log(`Created pending loan ${loan.id} for customer ${customerId}`);

    res.status(201).json({
      id: loan.id,
      customerId: loan.customer_id,
      amountAud: loan.amount_aud,
      collateralBtc: loan.collateral_btc,
      btcPriceAtCreation: loan.btc_price_at_creation,
      status: loan.status,
      createdAt: loan.created_at,
    });
  } catch (error) {
    console.error("Error creating loan:", error);
    res.status(500).json({ error: "Failed to create loan" });
  }
});

export default router;
