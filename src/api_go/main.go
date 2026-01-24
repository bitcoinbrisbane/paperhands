package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"paperhands/api/config"
	"paperhands/api/handlers"
	"paperhands/api/middleware"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize database connection
	config.InitDB()
	defer config.CloseDB()

	// Set Gin mode
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create router
	r := gin.Default()

	// Note: CORS is handled by nginx reverse proxy in production
	// For local development, you may need to enable CORS middleware

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	// Auth routes
	auth := r.Group("/auth")
	{
		auth.POST("/signup", handlers.Signup)
		auth.POST("/login", handlers.Login)
		auth.POST("/logout", handlers.Logout)
	}

	// Users routes (protected by JWT authentication)
	users := r.Group("/users")
	users.Use(middleware.AuthRequired())
	{
		users.GET("", handlers.GetAllUsers)
		users.GET("/:id", handlers.GetUserByID)
		users.POST("", handlers.CreateUser)
		users.PUT("/:id", handlers.UpdateUser)
	}

	// Loans routes (protected by JWT authentication)
	loans := r.Group("/loans")
	loans.Use(middleware.AuthRequired())
	{
		loans.GET("", handlers.GetLoans)
		loans.GET("/:id", handlers.GetLoanByID)
		loans.POST("", handlers.CreateLoan)
		loans.PUT("/:id", handlers.UpdateLoanStatus)
	}

	// Price routes (public - no auth required)
	price := r.Group("/price")
	{
		price.GET("/btc-aud", handlers.GetBTCAUDPrice)
	}

	// Capital routes (protected by JWT authentication)
	capital := r.Group("/capital")
	capital.Use(middleware.AuthRequired())
	{
		capital.GET("", handlers.GetCapitalSupplies)
		capital.POST("", handlers.CreateCapitalSupply)
		capital.POST("/deposit-address", handlers.GenerateDepositAddress)
		capital.GET("/deposit-addresses", handlers.GetDepositAddresses)
	}

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	// Start server
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
