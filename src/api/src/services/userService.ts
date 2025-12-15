import pool from "../db/index.js";
import bcrypt from "bcrypt";

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface Customer {
  id: number;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query<User>(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0] || null;
}

export async function findUserById(id: number): Promise<User | null> {
  const result = await pool.query<User>(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

export async function findCustomerByUserId(userId: number): Promise<Customer | null> {
  const result = await pool.query<Customer>(
    "SELECT * FROM customers WHERE user_id = $1",
    [userId]
  );
  return result.rows[0] || null;
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function createUser(email: string, password: string): Promise<User> {
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const result = await pool.query<User>(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
    [email, passwordHash]
  );

  return result.rows[0];
}

export async function createCustomer(
  userId: number,
  firstName?: string,
  lastName?: string,
  phone?: string
): Promise<Customer> {
  const result = await pool.query<Customer>(
    "INSERT INTO customers (user_id, first_name, last_name, phone) VALUES ($1, $2, $3, $4) RETURNING *",
    [userId, firstName || null, lastName || null, phone || null]
  );

  return result.rows[0];
}
