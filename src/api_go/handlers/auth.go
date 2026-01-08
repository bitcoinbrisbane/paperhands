package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"paperhands/api/config"
	"paperhands/api/models"
)

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Message string      `json:"message"`
	User    models.User `json:"user,omitempty"`
	Token   string      `json:"token,omitempty"`
}

// Login handles user authentication
func Login(c *gin.Context) {
	var req LoginRequest

	// Bind and validate request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}

	// Query user from database
	var user models.User
	var hashedPassword string

	query := `
		SELECT id, email, password, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	err := config.DB.QueryRow(query, req.Email).Scan(
		&user.ID,
		&user.Email,
		&hashedPassword,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Database error",
		})
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password",
		})
		return
	}

	// TODO: Generate JWT token
	// For now, we'll use a placeholder token
	token := "placeholder-token-" + time.Now().Format("20060102150405")

	// Return success response
	c.JSON(http.StatusOK, LoginResponse{
		Message: "Login successful",
		User:    user,
		Token:   token,
	})
}

// Logout handles user logout
func Logout(c *gin.Context) {
	// In a stateless JWT implementation, logout is typically handled client-side
	// by removing the token. However, we can add token to a blacklist if needed.

	// For now, we'll just return a success message
	c.JSON(http.StatusOK, gin.H{
		"message": "Logout successful",
	})
}
