package models

import (
	"database/sql"
	"time"
)

type CapitalSupply struct {
	ID            int            `json:"id"`
	UserID        int            `json:"userId"`
	Token         string         `json:"token"`
	Amount        float64        `json:"amount"`
	WalletAddress string         `json:"walletAddress"`
	TxHash        sql.NullString `json:"-"`
	Status        string         `json:"status"`
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
}

func (c CapitalSupply) ToResponse() map[string]interface{} {
	resp := map[string]interface{}{
		"id":            c.ID,
		"userId":        c.UserID,
		"token":         c.Token,
		"amount":        c.Amount,
		"walletAddress": c.WalletAddress,
		"status":        c.Status,
		"createdAt":     c.CreatedAt,
		"updatedAt":     c.UpdatedAt,
	}

	if c.TxHash.Valid {
		resp["txHash"] = c.TxHash.String
	} else {
		resp["txHash"] = nil
	}

	return resp
}

type DepositAddress struct {
	ID        int       `json:"id"`
	UserID    int       `json:"userId"`
	Token     string    `json:"token"`
	Address   string    `json:"address"`
	Status    string    `json:"status"`
	Swept     bool      `json:"swept"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
