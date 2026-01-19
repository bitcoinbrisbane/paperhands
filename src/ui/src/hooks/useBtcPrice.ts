import { useState, useEffect } from "react";
import api2 from "../services/api2";

interface UseBtcPriceResult {
  price: number | null;
  loading: boolean;
  error: string | null;
}

export function useBtcPrice(): UseBtcPriceResult {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await api2.get("/price/btc-aud");
        setPrice(response.data.price);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch BTC price:", err);
        setError("Failed to fetch price");
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();

    // Refresh price every 60 seconds
    const interval = setInterval(fetchPrice, 60000);

    return () => clearInterval(interval);
  }, []);

  return { price, loading, error };
}
