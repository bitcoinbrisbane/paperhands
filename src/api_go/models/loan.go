package models

import (
	"database/sql"
	"time"
)

type Loan struct {
	ID                 int            `json:"id"`
	CustomerID         int            `json:"customerId"`
	AmountAUD          float64        `json:"amountAud"`
	CollateralBTC      float64        `json:"collateralBtc"`
	BTCPriceAtCreation float64        `json:"btcPriceAtCreation"`
	Status             string         `json:"status"`
	DepositAddress     sql.NullString `json:"-"`
	DerivationPath     sql.NullString `json:"-"`
	CreatedAt          time.Time      `json:"createdAt"`
	UpdatedAt          time.Time      `json:"updatedAt"`
}

// MarshalJSON custom marshaler to handle nullable fields
func (l Loan) ToResponse() map[string]interface{} {
	resp := map[string]interface{}{
		"id":                 l.ID,
		"customerId":         l.CustomerID,
		"amountAud":          l.AmountAUD,
		"collateralBtc":      l.CollateralBTC,
		"btcPriceAtCreation": l.BTCPriceAtCreation,
		"status":             l.Status,
		"createdAt":          l.CreatedAt,
		"updatedAt":          l.UpdatedAt,
	}

	if l.DepositAddress.Valid {
		resp["depositAddress"] = l.DepositAddress.String
	} else {
		resp["depositAddress"] = nil
	}

	if l.DerivationPath.Valid {
		resp["derivationPath"] = l.DerivationPath.String
	} else {
		resp["derivationPath"] = nil
	}

	return resp
}
