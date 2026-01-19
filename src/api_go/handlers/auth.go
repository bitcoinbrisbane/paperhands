package handlers

import (
	"database/sql"
	"net/http"

	"paperhands/api/config"
	"paperhands/api/models"
	"paperhands/api/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type SignupRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
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
		SELECT id, email, password_hash, created_at, updated_at
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

	// Generate JWT token
	token, err := utils.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate authentication token",
		})
		return
	}

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

// Signup handles user registration
func Signup(c *gin.Context) {
	var req SignupRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Check if user already exists
	var exists bool
	const checkQuery string = "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)"
	err := config.DB.QueryRow(checkQuery, req.Email).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check existing user",
		})
		return
	}

	if exists {
		c.JSON(http.StatusConflict, gin.H{
			"error": "User with this email already exists",
		})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to hash password",
		})
		return
	}

	// Insert user
	var user models.User
	const insertQuery string = `
		INSERT INTO users (email, password_hash)
		VALUES ($1, $2)
		RETURNING id, email, created_at, updated_at
	`

	err = config.DB.QueryRow(insertQuery, req.Email, string(hashedPassword)).Scan(
		&user.ID,
		&user.Email,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user",
		})
		return
	}

	// Generate JWT token for auto-login after signup
	token, err := utils.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate authentication token",
		})
		return
	}

	// Return success response with token (auto-login after signup)
	c.JSON(http.StatusCreated, LoginResponse{
		Message: "User created successfully",
		User:    user,
		Token:   token,
	})
}
