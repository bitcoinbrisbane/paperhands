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
// It supports two modes:
// 1. XPUB mode (recommended): Uses an extended public key derived at m/86'/0'/0'
//    This is more secure as the server never has access to private keys
// 2. SEED mode (fallback): Uses a mnemonic seed phrase to derive keys
//    Less secure as the server has access to private keys
func GenerateBitcoinAddress(c *gin.Context) {
	var req BitcoinAddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "customerId and loanId are required"})
		return
	}

	var accountKey *hdkeychain.ExtendedKey
	var err error

	// Try XPUB first (more secure - public keys only)
	xpub := os.Getenv("XPUB")
	if xpub != "" {
		accountKey, err = hdkeychain.NewKeyFromString(xpub)
		if err != nil {
			log.Printf("Error parsing XPUB: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid XPUB"})
			return
		}

		// Verify it's a public key (not private)
		if accountKey.IsPrivate() {
			log.Println("Warning: XPUB contains private key, consider using public key only for security")
		}

		log.Println("Using XPUB for address generation (public key only mode)")
	} else {
		// Fall back to SEED (less secure - has private keys)
		seed := os.Getenv("SEED")
		if seed == "" {
			log.Println("Neither XPUB nor SEED environment variable configured")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "XPUB or SEED not configured"})
			return
		}

		log.Println("Using SEED for address generation (private key mode)")

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

		// Derive to account level: m/86'/0'/0'
		// 86' = purpose (Taproot/BIP86)
		// 0' = coin type (Bitcoin)
		// 0' = account
		hardenedPath := []uint32{
			86 + hdkeychain.HardenedKeyStart,
			0 + hdkeychain.HardenedKeyStart,
			0 + hdkeychain.HardenedKeyStart,
		}

		accountKey = masterKey
		for _, index := range hardenedPath {
			accountKey, err = accountKey.Derive(index)
			if err != nil {
				log.Printf("Error deriving hardened key at index %d: %v", index, err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to derive key"})
				return
			}
		}
	}

	// Derive non-hardened path: {customerId}/{loanId}
	// This works with both xpub and full keys
	key := accountKey
	for _, index := range []uint32{uint32(req.CustomerID), uint32(req.LoanID)} {
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

	pathStr := formatDerivationPath(req.CustomerID, req.LoanID)

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
