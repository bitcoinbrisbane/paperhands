import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "paperhands",
  user: process.env.DB_USER || "paperhands",
  password: process.env.DB_PASSWORD || "paperhands_dev",
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export default pool;
