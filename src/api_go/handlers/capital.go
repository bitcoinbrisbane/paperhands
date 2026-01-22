package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"paperhands/api/config"
	"paperhands/api/models"

	"github.com/gin-gonic/gin"
)

var validTokens = []string{"AAUD", "USDC", "USDT"}

type CreateCapitalSupplyRequest struct {
	UserID        int     `json:"userId" binding:"required"`
	Token         string  `json:"token" binding:"required"`
	Amount        float64 `json:"amount" binding:"required"`
	WalletAddress string  `json:"walletAddress" binding:"required"`
	TxHash        string  `json:"txHash"`
}

type GenerateDepositAddressRequest struct {
	UserID int    `json:"userId" binding:"required"`
	Token  string `json:"token" binding:"required"`
}

func isValidToken(token string) bool {
	for _, t := range validTokens {
		if t == token {
			return true
		}
	}
	return false
}

func generateEthAddress() string {
	bytes := make([]byte, 20)
	rand.Read(bytes)
	return "0x" + hex.EncodeToString(bytes)
}

// GetCapitalSupplies returns capital supplies with optional filters
func GetCapitalSupplies(c *gin.Context) {
	userIDStr := c.Query("userId")
	token := c.Query("token")
	status := c.Query("status")

	query := `
		SELECT id, user_id, token, amount, wallet_address, tx_hash, status, created_at, updated_at
		FROM capital_supplies
		WHERE 1=1
	`
	params := []interface{}{}
	paramCount := 1

	if userIDStr != "" {
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid userId"})
			return
		}
		query += fmt.Sprintf(" AND user_id = $%d", paramCount)
		params = append(params, userID)
		paramCount++
	}

	if token != "" {
		query += fmt.Sprintf(" AND token = $%d", paramCount)
		params = append(params, token)
		paramCount++
	}

	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", paramCount)
		params = append(params, status)
		paramCount++
	}

	query += " ORDER BY created_at DESC"

	rows, err := config.DB.Query(query, params...)
	if err != nil {
		log.Printf("Error querying capital supplies: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch capital supplies"})
		return
	}
	defer rows.Close()

	supplies := []map[string]interface{}{}
	for rows.Next() {
		var supply models.CapitalSupply
		err := rows.Scan(
			&supply.ID,
			&supply.UserID,
			&supply.Token,
			&supply.Amount,
			&supply.WalletAddress,
			&supply.TxHash,
			&supply.Status,
			&supply.CreatedAt,
			&supply.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning capital supply: %v", err)
			continue
		}
		supplies = append(supplies, supply.ToResponse())
	}

	c.JSON(http.StatusOK, supplies)
}

// CreateCapitalSupply creates a new capital supply
func CreateCapitalSupply(c *gin.Context) {
	var req CreateCapitalSupplyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "userId, token, amount, and walletAddress are required",
		})
		return
	}

	if !isValidToken(req.Token) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Invalid token. Must be one of: %v", validTokens),
		})
		return
	}

	var txHash sql.NullString
	if req.TxHash != "" {
		txHash = sql.NullString{String: req.TxHash, Valid: true}
	}

	query := `
		INSERT INTO capital_supplies (user_id, token, amount, wallet_address, tx_hash, status)
		VALUES ($1, $2, $3, $4, $5, 'pending')
		RETURNING id, user_id, token, amount, wallet_address, tx_hash, status, created_at, updated_at
	`

	var supply models.CapitalSupply
	err := config.DB.QueryRow(
		query,
		req.UserID,
		req.Token,
		req.Amount,
		req.WalletAddress,
		txHash,
	).Scan(
		&supply.ID,
		&supply.UserID,
		&supply.Token,
		&supply.Amount,
		&supply.WalletAddress,
		&supply.TxHash,
		&supply.Status,
		&supply.CreatedAt,
		&supply.UpdatedAt,
	)

	if err != nil {
		log.Printf("Error creating capital supply: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create capital supply"})
		return
	}

	log.Printf("Created capital supply %d for user %d: %f %s", supply.ID, req.UserID, req.Amount, req.Token)

	c.JSON(http.StatusCreated, supply.ToResponse())
}

// GenerateDepositAddress generates or retrieves a deposit address
func GenerateDepositAddress(c *gin.Context) {
	var req GenerateDepositAddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "userId and token are required",
		})
		return
	}

	if !isValidToken(req.Token) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Invalid token. Must be one of: %v", validTokens),
		})
		return
	}

	// Check for existing active address
	var existing models.DepositAddress
	checkQuery := `
		SELECT id, address, created_at
		FROM deposit_addresses
		WHERE user_id = $1 AND token = $2 AND status = 'active' AND swept = FALSE
		ORDER BY created_at DESC LIMIT 1
	`

	err := config.DB.QueryRow(checkQuery, req.UserID, req.Token).Scan(
		&existing.ID,
		&existing.Address,
		&existing.CreatedAt,
	)

	if err == nil {
		// Return existing address
		c.JSON(http.StatusOK, gin.H{
			"id":        existing.ID,
			"address":   existing.Address,
			"token":     req.Token,
			"createdAt": existing.CreatedAt,
			"isNew":     false,
		})
		return
	}

	if err != sql.ErrNoRows {
		log.Printf("Error checking existing address: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing address"})
		return
	}

	// Generate new address
	depositAddress := generateEthAddress()

	insertQuery := `
		INSERT INTO deposit_addresses (user_id, token, address, status, swept)
		VALUES ($1, $2, $3, 'active', FALSE)
		RETURNING id, user_id, token, address, status, swept, created_at
	`

	var newAddr models.DepositAddress
	err = config.DB.QueryRow(insertQuery, req.UserID, req.Token, depositAddress).Scan(
		&newAddr.ID,
		&newAddr.UserID,
		&newAddr.Token,
		&newAddr.Address,
		&newAddr.Status,
		&newAddr.Swept,
		&newAddr.CreatedAt,
	)

	if err != nil {
		log.Printf("Error creating deposit address: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate deposit address"})
		return
	}

	log.Printf("Generated deposit address %s for user %d: %s", depositAddress, req.UserID, req.Token)

	c.JSON(http.StatusCreated, gin.H{
		"id":        newAddr.ID,
		"userId":    newAddr.UserID,
		"token":     newAddr.Token,
		"address":   newAddr.Address,
		"status":    newAddr.Status,
		"swept":     newAddr.Swept,
		"createdAt": newAddr.CreatedAt,
		"isNew":     true,
	})
}

// GetDepositAddresses returns deposit addresses for a user
func GetDepositAddresses(c *gin.Context) {
	userIDStr := c.Query("userId")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid userId"})
		return
	}

	query := `
		SELECT id, user_id, token, address, status, swept, created_at, updated_at
		FROM deposit_addresses
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := config.DB.Query(query, userID)
	if err != nil {
		log.Printf("Error querying deposit addresses: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch deposit addresses"})
		return
	}
	defer rows.Close()

	addresses := []map[string]interface{}{}
	for rows.Next() {
		var addr models.DepositAddress
		err := rows.Scan(
			&addr.ID,
			&addr.UserID,
			&addr.Token,
			&addr.Address,
			&addr.Status,
			&addr.Swept,
			&addr.CreatedAt,
			&addr.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning deposit address: %v", err)
			continue
		}
		addresses = append(addresses, map[string]interface{}{
			"id":        addr.ID,
			"userId":    addr.UserID,
			"token":     addr.Token,
			"address":   addr.Address,
			"status":    addr.Status,
			"swept":     addr.Swept,
			"createdAt": addr.CreatedAt,
			"updatedAt": addr.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, addresses)
}
