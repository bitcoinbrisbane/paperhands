import { Router, Request, Response } from "express";

const router = Router();

const MEMPOOL_API = "https://mempool.space/api";

interface MempoolTransaction {
  txid: string;
  version: number;
  locktime: number;
  vin: Array<{
    txid: string;
    vout: number;
    prevout: {
      scriptpubkey: string;
      scriptpubkey_address: string;
      value: number;
    };
    scriptsig: string;
    sequence: number;
  }>;
  vout: Array<{
    scriptpubkey: string;
    scriptpubkey_address: string;
    value: number;
  }>;
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

interface AddressStats {
  funded_txo_count: number;
  funded_txo_sum: number;
  spent_txo_count: number;
  spent_txo_sum: number;
  tx_count: number;
}

interface AddressInfo {
  address: string;
  chain_stats: AddressStats;
  mempool_stats: AddressStats;
}

// Get address balance and stats
router.get("/address/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const response = await fetch(`${MEMPOOL_API}/address/${address}`);

    if (!response.ok) {
      if (response.status === 400) {
        res.status(400).json({ error: "Invalid address" });
        return;
      }
      throw new Error(`Mempool API error: ${response.status}`);
    }

    const data = await response.json() as AddressInfo;

    // Calculate balance in satoshis
    const confirmedBalance = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
    const unconfirmedBalance = data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;
    const totalBalance = confirmedBalance + unconfirmedBalance;

    res.json({
      address,
      balance: {
        confirmed: confirmedBalance,
        unconfirmed: unconfirmedBalance,
        total: totalBalance,
        // Convert to BTC
        confirmedBtc: confirmedBalance / 100000000,
        unconfirmedBtc: unconfirmedBalance / 100000000,
        totalBtc: totalBalance / 100000000,
      },
      txCount: data.chain_stats.tx_count + data.mempool_stats.tx_count,
    });
  } catch (error) {
    console.error("Error fetching address info:", error);
    res.status(500).json({ error: "Failed to fetch address info" });
  }
});

// Get address transactions
router.get("/address/:address/txs", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const response = await fetch(`${MEMPOOL_API}/address/${address}/txs`);

    if (!response.ok) {
      if (response.status === 400) {
        res.status(400).json({ error: "Invalid address" });
        return;
      }
      throw new Error(`Mempool API error: ${response.status}`);
    }

    const transactions = await response.json() as MempoolTransaction[];

    // Transform transactions for frontend
    const formattedTxs = transactions.map((tx) => {
      // Calculate if this is incoming or outgoing for the address
      const incoming = tx.vout.filter((out) => out.scriptpubkey_address === address);
      const outgoing = tx.vin.filter((inp) => inp.prevout?.scriptpubkey_address === address);

      const incomingValue = incoming.reduce((sum, out) => sum + out.value, 0);
      const outgoingValue = outgoing.reduce((sum, inp) => sum + inp.prevout.value, 0);

      const netValue = incomingValue - outgoingValue;
      const type = netValue >= 0 ? "receive" : "send";

      return {
        txid: tx.txid,
        type,
        amount: Math.abs(netValue),
        amountBtc: Math.abs(netValue) / 100000000,
        fee: tx.fee,
        feeBtc: tx.fee / 100000000,
        confirmed: tx.status.confirmed,
        blockHeight: tx.status.block_height,
        blockTime: tx.status.block_time,
        timestamp: tx.status.block_time ? new Date(tx.status.block_time * 1000).toISOString() : null,
      };
    });

    res.json({
      address,
      transactions: formattedTxs,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

export default router;
