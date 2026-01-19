import express from "express";
import cors from "cors";
import "dotenv/config";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import bitcoinRouter from "./routes/bitcoin.js";
import priceRouter from "./routes/price.js";
import blockchainRouter from "./routes/blockchain.js";
import loansRouter from "./routes/loans.js";
import disbursementsRouter from "./routes/disbursements.js";
import capitalRouter from "./routes/capital.js";
import analyticsRouter from "./routes/analytics.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/bitcoin", bitcoinRouter);
app.use("/api/price", priceRouter);
app.use("/api/blockchain", blockchainRouter);
app.use("/api/loans", loansRouter);
app.use("/api/disbursements", disbursementsRouter);
app.use("/api/capital", capitalRouter);
app.use("/api/analytics", analyticsRouter);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
