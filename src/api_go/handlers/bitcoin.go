package handlers

import (
	"log"
	"net/http"
	"os"

	"github.com/btcsuite/btcd/btcec/v2/schnorr"
	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcd/txscript"
	"github.com/gin-gonic/gin"
	"github.com/tyler-smith/go-bip39"

	"github.com/btcsuite/btcd/btcutil/hdkeychain"
)

type BitcoinAddressRequest struct {
	CustomerID int `json:"customerId" binding:"required"`
	LoanID     int `json:"loanId" binding:"required"`
}

type BitcoinAddressResponse struct {
	Address    string `json:"address"`
	CustomerID int    `json:"customerId"`
	LoanID     int    `json:"loanId"`
	Path       string `json:"path"`
}

// GenerateBitcoinAddress generates a Taproot (P2TR) address for a customer/loan
func GenerateBitcoinAddress(c *gin.Context) {
	var req BitcoinAddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "customerId and loanId are required"})
		return
	}

	seed := os.Getenv("SEED")
	if seed == "" {
		log.Println("SEED environment variable not configured")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "SEED not configured"})
		return
	}

	// Convert mnemonic to seed
	seedBytes, err := bip39.NewSeedWithErrorChecking(seed, "")
	if err != nil {
		log.Printf("Error converting mnemonic to seed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process seed"})
		return
	}

	// Create HD wallet from seed (mainnet)
	masterKey, err := hdkeychain.NewMaster(seedBytes, &chaincfg.MainNetParams)
	if err != nil {
		log.Printf("Error creating master key: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create master key"})
		return
	}

	// Derive path: m/86'/0'/0'/customerId/loanId (BIP86 for Taproot)
	// 86' = purpose (Taproot)
	// 0' = coin type (Bitcoin)
	// 0' = account
	// customerId = customer index
	// loanId = address index
	path := []uint32{
		86 + hdkeychain.HardenedKeyStart,  // purpose
		0 + hdkeychain.HardenedKeyStart,   // coin type
		0 + hdkeychain.HardenedKeyStart,   // account
		uint32(req.CustomerID),            // customer (non-hardened)
		uint32(req.LoanID),                // loan (non-hardened)
	}

	key := masterKey
	for _, index := range path {
		key, err = key.Derive(index)
		if err != nil {
			log.Printf("Error deriving key at index %d: %v", index, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to derive key"})
			return
		}
	}

	// Get the public key
	pubKey, err := key.ECPubKey()
	if err != nil {
		log.Printf("Error getting public key: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get public key"})
		return
	}

	// Create Taproot address (P2TR)
	// For a simple key-path spend, we use the public key directly as the internal key
	internalKey := schnorr.SerializePubKey(pubKey)

	// Create the taproot output key (with no script tree, just key path spend)
	taprootKey := txscript.ComputeTaprootKeyNoScript(pubKey)

	// Create the P2TR address
	address, err := btcutil.NewAddressTaproot(schnorr.SerializePubKey(taprootKey), &chaincfg.MainNetParams)
	if err != nil {
		log.Printf("Error creating taproot address: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create address"})
		return
	}

	pathStr := "m/86'/0'/0'/" + string(rune('0'+req.CustomerID)) + "/" + string(rune('0'+req.LoanID))
	// Use proper path string formatting
	pathStr = formatDerivationPath(req.CustomerID, req.LoanID)

	log.Printf("Generated Taproot address for customer %d, loan %d: %s (internal key: %x)",
		req.CustomerID, req.LoanID, address.EncodeAddress(), internalKey)

	c.JSON(http.StatusOK, BitcoinAddressResponse{
		Address:    address.EncodeAddress(),
		CustomerID: req.CustomerID,
		LoanID:     req.LoanID,
		Path:       pathStr,
	})
}

func formatDerivationPath(customerID, loanID int) string {
	return "m/86'/0'/0'/" + itoa(customerID) + "/" + itoa(loanID)
}

func itoa(i int) string {
	if i == 0 {
		return "0"
	}
	result := ""
	for i > 0 {
		result = string(rune('0'+i%10)) + result
		i /= 10
	}
	return result
}
