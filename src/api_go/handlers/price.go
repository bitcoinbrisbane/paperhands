package handlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type PriceCache struct {
	Price     float64
	Timestamp time.Time
	mu        sync.RWMutex
}

type CoinGeckoResponse struct {
	Bitcoin struct {
		AUD float64 `json:"aud"`
	} `json:"bitcoin"`
}

type PriceResponse struct {
	Price    float64 `json:"price"`
	Currency string  `json:"currency"`
	Cached   bool    `json:"cached"`
	Stale    bool    `json:"stale,omitempty"`
}

var (
	priceCache = &PriceCache{}
	cacheTTL   = 60 * time.Second // 1 minute cache
)

// GetBTCAUDPrice returns the current BTC/AUD price
func GetBTCAUDPrice(c *gin.Context) {
	// Check cache
	priceCache.mu.RLock()
	if priceCache.Price > 0 && time.Since(priceCache.Timestamp) < cacheTTL {
		price := priceCache.Price
		priceCache.mu.RUnlock()
		c.JSON(http.StatusOK, PriceResponse{
			Price:    price,
			Currency: "AUD",
			Cached:   true,
		})
		return
	}
	priceCache.mu.RUnlock()

	// Fetch from CoinGecko API
	resp, err := http.Get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=aud")
	if err != nil {
		log.Printf("Error fetching BTC price: %v", err)
		returnCachedOrError(c)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("CoinGecko API error: %d", resp.StatusCode)
		returnCachedOrError(c)
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response: %v", err)
		returnCachedOrError(c)
		return
	}

	var data CoinGeckoResponse
	if err := json.Unmarshal(body, &data); err != nil {
		log.Printf("Error parsing response: %v", err)
		returnCachedOrError(c)
		return
	}

	price := data.Bitcoin.AUD

	// Update cache
	priceCache.mu.Lock()
	priceCache.Price = price
	priceCache.Timestamp = time.Now()
	priceCache.mu.Unlock()

	log.Printf("Fetched BTC/AUD price: %.2f", price)

	c.JSON(http.StatusOK, PriceResponse{
		Price:    price,
		Currency: "AUD",
		Cached:   false,
	})
}

func returnCachedOrError(c *gin.Context) {
	priceCache.mu.RLock()
	defer priceCache.mu.RUnlock()

	if priceCache.Price > 0 {
		c.JSON(http.StatusOK, PriceResponse{
			Price:    priceCache.Price,
			Currency: "AUD",
			Cached:   true,
			Stale:    true,
		})
		return
	}

	c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch BTC price"})
}
