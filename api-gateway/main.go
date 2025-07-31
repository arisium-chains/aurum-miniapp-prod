package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Authentication middleware
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: Implement authentication logic here
		// For now, just allow all requests
		c.Next()
	}
}

func main() {
	fmt.Println("Starting API Gateway...")

	router := gin.Default()
	router.Use(AuthMiddleware())

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	router.Run(":8081")
}
