package handlers

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"paperhands/api/config"
	"paperhands/api/models"

	"github.com/gin-gonic/gin"
)

type CreateLoanRequest struct {
	CustomerID         int     `json:"customerId" binding:"required"`
	AmountAUD          float64 `json:"amountAud" binding:"required"`
	CollateralBTC      float64 `json:"collateralBtc" binding:"required"`
	BTCPriceAtCreation float64 `json:"btcPriceAtCreation" binding:"required"`
}

// GetLoans returns all loans with optional filters
func GetLoans(c *gin.Context) {
	customerID := c.Query("customerId")
	status := c.Query("status")

	query := `
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
	`
	params := []interface{}{}
	paramCount := 1

	if customerID != "" {
		query += fmt.Sprintf(" AND customer_id = $%d", paramCount)
		custID, err := strconv.Atoi(customerID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customerId"})
			return
		}
		params = append(params, custID)
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
		log.Printf("Error querying loans: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch loans"})
		return
	}
	defer rows.Close()

	loans := []map[string]interface{}{}
	for rows.Next() {
		var loan models.Loan
		err := rows.Scan(
			&loan.ID,
			&loan.CustomerID,
			&loan.AmountAUD,
			&loan.CollateralBTC,
			&loan.BTCPriceAtCreation,
			&loan.Status,
			&loan.DepositAddress,
			&loan.DerivationPath,
			&loan.CreatedAt,
			&loan.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning loan: %v", err)
			continue
		}
		loans = append(loans, loan.ToResponse())
	}

	c.JSON(http.StatusOK, loans)
}

// GetLoanByID returns a single loan by ID
func GetLoanByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid loan ID"})
		return
	}

	query := `
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
		WHERE id = $1
	`

	var loan models.Loan
	err = config.DB.QueryRow(query, id).Scan(
		&loan.ID,
		&loan.CustomerID,
		&loan.AmountAUD,
		&loan.CollateralBTC,
		&loan.BTCPriceAtCreation,
		&loan.Status,
		&loan.DepositAddress,
		&loan.DerivationPath,
		&loan.CreatedAt,
		&loan.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Loan not found"})
		return
	}

	if err != nil {
		log.Printf("Error fetching loan: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch loan"})
		return
	}

	c.JSON(http.StatusOK, loan.ToResponse())
}

// CreateLoan creates a new loan
func CreateLoan(c *gin.Context) {
	var req CreateLoanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "customerId, amountAud, collateralBtc, and btcPriceAtCreation are required",
		})
		return
	}

	query := `
		INSERT INTO loans (customer_id, amount_aud, collateral_btc, btc_price_at_creation, status)
		VALUES ($1, $2, $3, $4, 'pending')
		RETURNING id, customer_id, amount_aud, collateral_btc, btc_price_at_creation, status, created_at, updated_at
	`

	var loan models.Loan
	err := config.DB.QueryRow(
		query,
		req.CustomerID,
		req.AmountAUD,
		req.CollateralBTC,
		req.BTCPriceAtCreation,
	).Scan(
		&loan.ID,
		&loan.CustomerID,
		&loan.AmountAUD,
		&loan.CollateralBTC,
		&loan.BTCPriceAtCreation,
		&loan.Status,
		&loan.CreatedAt,
		&loan.UpdatedAt,
	)

	if err != nil {
		log.Printf("Error creating loan: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create loan"})
		return
	}

	log.Printf("Created pending loan %d for customer %d", loan.ID, req.CustomerID)

	c.JSON(http.StatusCreated, loan.ToResponse())
}

// UpdateLoanStatus updates the status of a loan
func UpdateLoanStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid loan ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status is required"})
		return
	}

	query := `
		UPDATE loans
		SET status = $1, updated_at = NOW()
		WHERE id = $2
		RETURNING id, customer_id, amount_aud, collateral_btc, btc_price_at_creation, status, deposit_address, derivation_path, created_at, updated_at
	`

	var loan models.Loan
	err = config.DB.QueryRow(query, req.Status, id).Scan(
		&loan.ID,
		&loan.CustomerID,
		&loan.AmountAUD,
		&loan.CollateralBTC,
		&loan.BTCPriceAtCreation,
		&loan.Status,
		&loan.DepositAddress,
		&loan.DerivationPath,
		&loan.CreatedAt,
		&loan.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Loan not found"})
		return
	}

	if err != nil {
		log.Printf("Error updating loan: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update loan"})
		return
	}

	c.JSON(http.StatusOK, loan.ToResponse())
}
