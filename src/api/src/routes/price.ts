import { Router, Request, Response } from "express";

const router = Router();

interface PriceCache {
  price: number;
  timestamp: number;
}

let priceCache: PriceCache | null = null;
const CACHE_TTL = 60000; // 1 minute cache

router.get("/btc-aud", async (_req: Request, res: Response) => {
  try {
    // Check cache
    if (priceCache && Date.now() - priceCache.timestamp < CACHE_TTL) {
      res.json({ price: priceCache.price, currency: "AUD", cached: true });
      return;
    }

    // Fetch from CoinGecko API (free, no API key required)
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=aud"
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const price = data.bitcoin.aud;

    // Update cache
    priceCache = {
      price,
      timestamp: Date.now(),
    };

    console.log(`Fetched BTC/AUD price: ${price}`);

    res.json({ price, currency: "AUD", cached: false });
  } catch (error) {
    console.error("Error fetching BTC price:", error);

    // Return cached price if available, even if stale
    if (priceCache) {
      res.json({ price: priceCache.price, currency: "AUD", cached: true, stale: true });
      return;
    }

    res.status(500).json({ error: "Failed to fetch BTC price" });
  }
});

export default router;
