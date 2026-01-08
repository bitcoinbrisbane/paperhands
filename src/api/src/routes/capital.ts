import { Router, Request, Response } from "express";
import pool from "../db/index.js";

const router = Router();

interface CreateCapitalSupplyRequest {
  userId: number;
  token: string;
  amount: number;
  walletAddress: string;
  txHash?: string;
}

interface GetCapitalSuppliesQuery {
  userId?: string;
  token?: string;
  status?: string;
}

interface GenerateDepositAddressRequest {
  userId: number;
  token: string;
}

// Helper function to generate a fake Ethereum address
function generateFakeEthAddress(): string {
  const chars = "0123456789abcdef";
  let address = "0x";
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

router.get("/", async (req: Request<object, object, object, GetCapitalSuppliesQuery>, res: Response) => {
  try {
    const { userId, token, status } = req.query;

    let query = `
      SELECT
        id,
        user_id,
        token,
        amount,
        wallet_address,
        tx_hash,
        status,
        created_at,
        updated_at
      FROM capital_supplies
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    let paramCount = 1;

    if (userId) {
      query += ` AND user_id = $${paramCount}`;
      params.push(Number(userId));
      paramCount++;
    }

    if (token) {
      query += ` AND token = $${paramCount}`;
      params.push(token);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);

    const supplies = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      token: row.token,
      amount: parseFloat(row.amount),
      walletAddress: row.wallet_address,
      txHash: row.tx_hash,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json(supplies);
  } catch (error) {
    console.error("Error fetching capital supplies:", error);
    res.status(500).json({ error: "Failed to fetch capital supplies" });
  }
});

router.post("/", async (req: Request<object, object, CreateCapitalSupplyRequest>, res: Response) => {
  try {
    const { userId, token, amount, walletAddress, txHash } = req.body;

    if (!userId || !token || !amount || !walletAddress) {
      res.status(400).json({
        error: "userId, token, amount, and walletAddress are required"
      });
      return;
    }

    // Validate token
    const validTokens = ["AAUD", "USDC", "USDT"];
    if (!validTokens.includes(token)) {
      res.status(400).json({
        error: `Invalid token. Must be one of: ${validTokens.join(", ")}`
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO capital_supplies (user_id, token, amount, wallet_address, tx_hash, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, user_id, token, amount, wallet_address, tx_hash, status, created_at`,
      [userId, token, amount, walletAddress, txHash || null]
    );

    const supply = result.rows[0];

    console.log(`Created capital supply ${supply.id} for user ${userId}: ${amount} ${token}`);

    res.status(201).json({
      id: supply.id,
      userId: supply.user_id,
      token: supply.token,
      amount: parseFloat(supply.amount),
      walletAddress: supply.wallet_address,
      txHash: supply.tx_hash,
      status: supply.status,
      createdAt: supply.created_at,
    });
  } catch (error) {
    console.error("Error creating capital supply:", error);
    res.status(500).json({ error: "Failed to create capital supply" });
  }
});

router.post("/deposit-address", async (req: Request<object, object, GenerateDepositAddressRequest>, res: Response) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      res.status(400).json({
        error: "userId and token are required"
      });
      return;
    }

    // Validate token
    const validTokens = ["AAUD", "USDC", "USDT"];
    if (!validTokens.includes(token)) {
      res.status(400).json({
        error: `Invalid token. Must be one of: ${validTokens.join(", ")}`
      });
      return;
    }

    // Check if user already has an active deposit address for this token
    const existingAddress = await pool.query(
      `SELECT id, address, created_at FROM deposit_addresses
       WHERE user_id = $1 AND token = $2 AND status = 'active' AND swept = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [userId, token]
    );

    if (existingAddress.rows.length > 0) {
      // Return existing address
      const address = existingAddress.rows[0];
      res.json({
        id: address.id,
        address: address.address,
        token,
        createdAt: address.created_at,
        isNew: false,
      });
      return;
    }

    // Generate a new fake Ethereum address
    const depositAddress = generateFakeEthAddress();

    const result = await pool.query(
      `INSERT INTO deposit_addresses (user_id, token, address, status, swept)
       VALUES ($1, $2, $3, 'active', FALSE)
       RETURNING id, user_id, token, address, status, swept, created_at`,
      [userId, token, depositAddress]
    );

    const newAddress = result.rows[0];

    console.log(`Generated deposit address ${depositAddress} for user ${userId}: ${token}`);

    res.status(201).json({
      id: newAddress.id,
      userId: newAddress.user_id,
      token: newAddress.token,
      address: newAddress.address,
      status: newAddress.status,
      swept: newAddress.swept,
      createdAt: newAddress.created_at,
      isNew: true,
    });
  } catch (error) {
    console.error("Error generating deposit address:", error);
    res.status(500).json({ error: "Failed to generate deposit address" });
  }
});

router.get("/deposit-addresses", async (req: Request<object, object, object, { userId?: string }>, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const result = await pool.query(
      `SELECT id, user_id, token, address, status, swept, created_at, updated_at
       FROM deposit_addresses
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [Number(userId)]
    );

    const addresses = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      token: row.token,
      address: row.address,
      status: row.status,
      swept: row.swept,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json(addresses);
  } catch (error) {
    console.error("Error fetching deposit addresses:", error);
    res.status(500).json({ error: "Failed to fetch deposit addresses" });
  }
});

export default router;
