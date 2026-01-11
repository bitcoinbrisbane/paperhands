package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"paperhands/api/utils"
)

// Context keys for storing user data
const (
	ContextUserID    = "userID"
	ContextUserEmail = "userEmail"
)

// AuthRequired is middleware that validates JWT tokens
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header is required",
			})
			return
		}

		// Check Bearer prefix
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorization header format. Use: Bearer <token>",
			})
			return
		}

		tokenString := parts[1]

		// Validate token
		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			switch err {
			case utils.ErrExpiredToken:
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
					"error": "Token has expired",
				})
			case utils.ErrMissingSecret:
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"error": "Server configuration error",
				})
			default:
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
					"error": "Invalid token",
				})
			}
			return
		}

		// Store user info in context for use in handlers
		c.Set(ContextUserID, claims.UserID)
		c.Set(ContextUserEmail, claims.Email)

		c.Next()
	}
}

// GetUserIDFromContext extracts user ID from Gin context
func GetUserIDFromContext(c *gin.Context) (int, bool) {
	userID, exists := c.Get(ContextUserID)
	if !exists {
		return 0, false
	}
	id, ok := userID.(int)
	return id, ok
}

// GetUserEmailFromContext extracts user email from Gin context
func GetUserEmailFromContext(c *gin.Context) (string, bool) {
	email, exists := c.Get(ContextUserEmail)
	if !exists {
		return "", false
	}
	emailStr, ok := email.(string)
	return emailStr, ok
}
